import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { encodeFunctionData, decodeFunctionData, encodeFunctionResult, decodeFunctionResult } from 'viem';
import Ajv2020 from 'ajv/dist/2020.js';
import ts from 'typescript';
import { CONTRACTS } from '@hanamesh/api-contracts';
import { validatorFor } from './schema.mjs';

const json = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

test('C-CHAIN publishes all five provider factory contracts without pretending to implement them', async () => {
    const chain = await import('@hanamesh/api-contracts/chain');
    const definition = chain.CHAIN_CONTRACT_DEFINITION;
    assert.equal(CONTRACTS['C-CHAIN'].definition, definition);
    assert.equal(definition.providerCommit, 'f30464bef961b0f226fc3c03697cca08b7a77b5f');
    assert.deepEqual(Object.keys(definition.factories).sort(), [
        'createBondSupplyAdapter', 'createConfirmedLaunchProducer', 'createLaunchAdmissionProducer',
        'createSwapSupplyAdapter', 'createUserPaidClaimAdapter',
    ]);
    assert.deepEqual(definition.factories.createUserPaidClaimAdapter.baselineErrors,
        ['CLAIM_WINDOW_CLOSED', 'CLAIM_PROOF_MISMATCH', 'USER_WALLET_REQUIRED']);
    assert.ok(definition.factories.createUserPaidClaimAdapter.errors.includes('CLAIM_PROOF_MISMATCH'));
    assert.ok(!definition.factories.createUserPaidClaimAdapter.errors.includes('WALLET_CLIENT_REQUIRED'));
    assert.ok(!definition.factories.createUserPaidClaimAdapter.errors.includes('RECEIPT_POLICY_REQUIRED_OR_INVALID'));
    assert.ok(definition.factories.createSwapSupplyAdapter.errors.includes('SERVER_SIGNER_FORBIDDEN'));
    for (const name of Object.keys(definition.factories)) {
        assert.equal(chain[name], undefined, 'production factories are type-only contracts');
        assert.ok(definition.factories[name].errors.length);
        assert.match(definition.factories[name].note, /propagat/i);
    }
});

test('the root registry types remain usable without the optional viem peer', () => {
    const file = new URL('./virtual-root-consumer.ts', import.meta.url).pathname;
    const text = "import { CONTRACTS } from '@hanamesh/api-contracts'; void CONTRACTS['C-CHAIN'].definition.factories.createSwapSupplyAdapter.errors;";
    const options = { strict: true, noEmit: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, types: [] };
    const host = ts.createCompilerHost(options);
    const exists = host.fileExists.bind(host), directoryExists = host.directoryExists.bind(host), getSourceFile = host.getSourceFile.bind(host);
    const isViem = path => /\/node_modules\/viem(?:\/|$)/.test(path);
    host.fileExists = path => path === file || (!isViem(path) && exists(path));
    host.directoryExists = path => !isViem(path) && directoryExists(path);
    host.getSourceFile = (path, languageVersion, onError, shouldCreateNewSourceFile) => path === file
        ? ts.createSourceFile(file, text, languageVersion, true)
        : getSourceFile(path, languageVersion, onError, shouldCreateNewSourceFile);
    const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([file], options, host));
    assert.deepEqual(diagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')), []);
});

test('C-CHAIN examples satisfy the unchanged provider schemas; the minimal read port stays isolated', async () => {
    const { createChainContractExamples, createChainProviderFixture, CHAIN_FIXTURE_LABEL } = await import('@hanamesh/api-contracts/chain');
    const examples = createChainContractExamples();
    assert.equal(examples.label, CHAIN_FIXTURE_LABEL);
    assert.match(examples.label, /^FIXTURE/);
    const ajv = new Ajv2020({ strict: false });
    ajv.addFormat('date-time', value => /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(value) && Number.isFinite(Date.parse(value)));
    const confirmed = ajv.compile(json('../contracts/chain/confirmed-launch.schema.json'));
    const request = validatorFor(new URL('../contracts/chain/user-paid-claim.schema.json', import.meta.url), 'Request');
    assert.ok(confirmed(examples.confirmedLaunch));
    assert.ok(request(examples.claimRequest).ok);
    assert.equal('rootValidUntil' in examples.confirmedLaunch, false);
    assert.equal(examples.confirmedLaunch.paidAmount, '25000000');
    const fixture = createChainProviderFixture(examples.confirmedLaunch);
    assert.equal(fixture.label, CHAIN_FIXTURE_LABEL);
    const result = await fixture.producer.getConfirmedLaunch({ requestId: examples.confirmedLaunch.requestId });
    assert.deepEqual(result, examples.confirmedLaunch);
    result.paidAmount = '0';
    assert.equal((await fixture.producer.getConfirmedLaunch({ requestId: result.requestId })).paidAmount, '25000000');
    assert.equal(await fixture.producer.getConfirmedLaunch({ requestId: 'unknown' }), null);
    assert.equal(await createChainProviderFixture(null).producer.getConfirmedLaunch({ requestId: result.requestId }), null);
});

test('C-CHAIN declaration bodies, signatures and schema bytes remain pinned to provider evidence', () => {
    const provenance = json('../contracts/chain/provenance.json');
    const source = ts.createSourceFile('provider.d.ts', readFileSync(new URL('../contracts/chain/provider.d.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true);
    const statements = new Map(source.statements.filter(s => s.name && ts.isIdentifier(s.name)).map(s => [s.name.text, s]));
    assert.equal(statements.size, Object.keys(provenance.declarationSHA256).length);
    for (const [name, digest] of Object.entries(provenance.declarationSHA256))
        assert.equal(createHash('sha256').update(statements.get(name).getText(source)).digest('hex'), digest, name);
    for (const [name, definition] of Object.entries(provenance.factories))
        assert.equal(statements.get(name).getText(source), definition.signature, name);
    for (const [name, digest] of Object.entries(provenance.schemas))
        assert.equal(createHash('sha256').update(readFileSync(new URL(`../contracts/chain/${name}`, import.meta.url))).digest('hex'), digest, name);
});

test('C-HANASWAP ships the complete provider JSON ABI and manifest with exact hashes', async () => {
    const swap = await import('@hanamesh/api-contracts/hanaswap');
    const abi = json('../contracts/hanaswap/UniswapV2Router02.json');
    const manifest = json('../contracts/hanaswap/manifest.json');
    assert.deepEqual(swap.HANASWAP_ROUTER02_ABI, abi);
    assert.equal(abi.length, 26);
    assert.equal(abi.filter(entry => entry.type === 'function').length, 24);
    assert.equal(createHash('sha256').update(JSON.stringify(abi)).digest('hex'), manifest.abiSHA256);
    assert.equal(manifest.abiSHA256, '6e79ecda8373ea27fceeff14d4fd6c587524bf3241cd26919048d6572164cac5');
    const provenance = json('../contracts/hanaswap/provenance.json');
    assert.equal(provenance.providerCommit, 'c9e9809ea305e91b67005acbb34610f15ad7d563');
    for (const [name, digest] of Object.entries(provenance.fileSHA256))
        assert.equal(createHash('sha256').update(readFileSync(new URL(`../contracts/hanaswap/${name}`, import.meta.url))).digest('hex'), digest, name);
    assert.equal(import.meta.resolve('@hanamesh/api-contracts/hanaswap/UniswapV2Router02.json'), new URL('../contracts/hanaswap/UniswapV2Router02.json', import.meta.url).href);
    const types = ts.createSourceFile('abi.d.ts', readFileSync(new URL('../contracts/hanaswap/index.d.ts', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true);
    const declaration = types.statements.find(s => ts.isVariableStatement(s)).declarationList.declarations[0];
    function fromType(node) {
        if (ts.isTypeOperatorNode(node)) return fromType(node.type);
        if (ts.isTupleTypeNode(node)) return node.elements.map(fromType);
        if (ts.isTypeLiteralNode(node)) return Object.fromEntries(node.members.map(m => [m.name.text, fromType(m.type)]));
        if (ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal)) return node.literal.text;
        throw new Error(`Unexpected ABI declaration kind ${node.kind}`);
    }
    assert.deepEqual(fromType(declaration.type), abi, 'viem literal declarations exactly mirror every JSON field');
    assert.equal(CONTRACTS['C-HANASWAP'].definition, swap.HANASWAP_CONTRACT_DEFINITION);
    assert.deepEqual(swap.HANASWAP_CONTRACT_DEFINITION.calls.swapExactTokensForTokens.errors,
        ['UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT']);
    for (const name of ['swapExactTokensForTokens', 'addLiquidity', 'removeLiquidity']) {
        const entry = abi.find(item => item.name === name);
        const args = entry.inputs.map(input => input.type === 'address[]'
            ? ['0x0000000000000000000000000000000000000001', '0x0000000000000000000000000000000000000002']
            : input.type === 'address' ? '0x0000000000000000000000000000000000000003' : 1n);
        const data = encodeFunctionData({ abi, functionName: name, args });
        assert.deepEqual(decodeFunctionData({ abi, data }), { functionName: name, args });
        const expected = entry.outputs.length === 1 ? [1n, 2n] : entry.outputs.map(() => 1n);
        const encoded = encodeFunctionResult({ abi, functionName: name, result: expected });
        assert.deepEqual(decodeFunctionResult({ abi, functionName: name, data: encoded }), expected);
    }
});

test('Router fixture follows the supplied example, slippage and expiry errors without RPC', async () => {
    const { createHanaSwapProviderFixture, createHanaSwapContractExamples, HANASWAP_FIXTURE_LABEL } = await import('@hanamesh/api-contracts/hanaswap');
    const example = createHanaSwapContractExamples();
    assert.equal(example.label, HANASWAP_FIXTURE_LABEL);
    const fixture = createHanaSwapProviderFixture();
    assert.deepEqual(fixture.swapExactTokensForTokens(example.swap.args), example.swap.mockReturn);
    assert.throws(() => fixture.swapExactTokensForTokens({ ...example.swap.args, amountOutMin: '996901' }),
        { message: 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT' });
    assert.throws(() => fixture.swapExactTokensForTokens({ ...example.swap.args, deadline: '1899999999' }),
        { message: 'UniswapV2Router: EXPIRED' });
    assert.throws(() => fixture.swapExactTokensForTokens({ ...example.swap.args, amountIn: '2' }), /fixture supports only/);
});
