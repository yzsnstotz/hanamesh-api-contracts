import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { CONTRACTS } from '@hanamesh/api-contracts';

const json = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const providerDts = readFileSync(new URL('../contracts/chain/provider.d.ts', import.meta.url), 'utf8');
const source = ts.createSourceFile('provider.d.ts', providerDts, ts.ScriptTarget.Latest, true);
const declaration = name => source.statements.find(s => s.name?.text === name);
/** Own member names of a declared interface, nested object literal members excluded. */
const fields = name => declaration(name).members.map(m => m.name.text);
const union = name => declaration(name).type.types.map(t => t.literal.text).toSorted();

test('C-CHAIN createDistributionAdapter is pinned to the provider v0.3.0 tag and stays type-only', async () => {
    const chain = await import('@hanamesh/api-contracts/chain');
    const provenance = json('../contracts/chain/provenance.json');
    const definition = chain.CHAIN_CONTRACT_DEFINITION;
    assert.equal(CONTRACTS['C-CHAIN'].definition, definition);
    assert.deepEqual(definition.distribution, { providerTag: 'v0.3.0', providerCommit: 'dd0b14293aa03ca6efc905d29f560478701462cd' });
    assert.equal(provenance.distribution.providerCard, 'J4S2-CHAIN-07');
    // Provider REPORT digests for the published tag; the earlier five factories keep their own pin.
    assert.equal(provenance.distribution.sourceSHA256['index.d.ts'], '5341fb5d88e4295b26b53807155e76333af3d27b764c7083f13fbf807b6ca687');
    assert.equal(provenance.distribution.sourceSHA256['distribution.js'], '51ab5533ad71e7448e27395c985bacd26f0af34daa88bb1f92bc6cc811fb3086');
    assert.equal(provenance.providerCommit, 'f30464bef961b0f226fc3c03697cca08b7a77b5f');
    const factory = definition.factories.createDistributionAdapter;
    assert.equal(factory.signature, 'export declare function createDistributionAdapter(options: DistributionAdapterOptions): Promise<DistributionAdapter>;');
    assert.equal(factory.errorClass, 'DistributionError');
    assert.equal(factory.configurationErrorClass, 'ChainAdapterConfigurationError');
    assert.deepEqual(factory.configurationErrors, ['CHAIN_ID_MISMATCH', 'CONFIG_INVALID']);
    for (const name of ['createDistributionAdapter', 'DistributionError', 'ChainAdapterConfigurationError'])
        assert.equal(chain[name], undefined, `${name} is a provider runtime value; the contract package only types it`);
});

test('DistributionErrorCode union, the factory error catalog and the provider examples agree', () => {
    const provenance = json('../contracts/chain/provenance.json');
    const codes = union('DistributionErrorCode');
    assert.equal(codes.length, 32);
    assert.deepEqual(provenance.factories.createDistributionAdapter.errors, codes);
    assert.deepEqual(provenance.factories.createDistributionAdapter.directErrors, codes);
    assert.deepEqual(union('ChainAdapterErrorCode'), ['CHAIN_ID_MISMATCH', 'CONFIG_INVALID', 'RECEIPT_POLICY_REQUIRED_OR_INVALID', 'WALLET_CLIENT_REQUIRED']);
    for (const code of provenance.factories.createDistributionAdapter.configurationErrors) assert.ok(union('ChainAdapterErrorCode').includes(code));
    const error = declaration('DistributionError');
    assert.deepEqual(error.members.filter(ts.isPropertyDeclaration).map(m => m.name.text), ['name', 'code', 'result', 'need', 'cause']);
    assert.equal(error.members.find(ts.isConstructorDeclaration).getText(source),
        'constructor(code: DistributionErrorCode, message: string, details?: { result?: DistributionResult; need?: string; cause?: unknown });');
    assert.equal(declaration('ChainAdapterConfigurationError').members.find(ts.isConstructorDeclaration).getText(source),
        'constructor(code: ChainAdapterErrorCode, message: string);');
    const examples = json('../contracts/chain/distribution-examples.json');
    for (const e of [examples.partial.execute, ...Object.values(examples.failure)])
        assert.ok((e.name === 'DistributionError' ? codes : union('ChainAdapterErrorCode')).includes(e.code), `${e.name} ${e.code}`);
    assert.equal(examples.failure.configurationInvalid.name, 'ChainAdapterConfigurationError');
    assert.equal(examples.failure.policyModeRequired.name, 'DistributionError');
    assert.match(examples.partial.execute.need, /RootAuthorization/);
});

test('distribution examples are the provider FIXTURE bytes and every DTO matches the declared fields', async () => {
    const { createChainDistributionExamples, CHAIN_DISTRIBUTION_FIXTURE_LABEL } = await import('@hanamesh/api-contracts/chain');
    const provenance = json('../contracts/chain/provenance.json');
    const bytes = readFileSync(new URL('../contracts/chain/distribution-examples.json', import.meta.url));
    assert.equal(sha(bytes), provenance.distribution.sourceSHA256['docs/distribution/contract-examples.json']);
    assert.equal(provenance.distribution.examples['distribution-examples.json'], sha(bytes));
    assert.equal(import.meta.resolve('@hanamesh/api-contracts/chain/distribution-examples.json'),
        new URL('../contracts/chain/distribution-examples.json', import.meta.url).href);
    const examples = createChainDistributionExamples();
    assert.match(CHAIN_DISTRIBUTION_FIXTURE_LABEL, /^FIXTURE/);
    assert.equal(examples.evidence, 'FIXTURE');
    assert.equal(examples.frozenInputs.tag, 'v0.11.0');
    const keys = value => Object.keys(value).toSorted();
    const { success, partial, call } = examples;
    assert.deepEqual(keys(call.options), fields('DistributionAdapterOptions').toSorted());
    assert.equal(call.options.policyMode, 'test-only');
    assert.deepEqual(call.methods, fields('DistributionAdapter').map(name => name === 'execute' || name === 'verify' ? `${name}(snapshot)` : `${name}(intentId)`));
    for (const key of fields('DistributionSnapshot')) assert.ok(key in call.snapshot, key);
    assert.deepEqual(keys(success.verify), fields('DistributionVerifyResult').toSorted());
    assert.deepEqual(keys(success.canonicalReadback), ['readback', 'result']);
    assert.deepEqual(keys(success.canonicalReadback.readback), fields('DistributionCanonicalReadback').toSorted());
    for (const result of [success.result, success.canonicalReadback.result, partial.result, partial.execute.result]) {
        assert.deepEqual(keys(result), fields('DistributionResult').toSorted());
        assert.deepEqual(keys(result.issuance), fields('IssuanceFact').toSorted());
        for (const root of [result.ordinary, result.reserved]) assert.deepEqual(keys(root), fields('DistributionRootResult').toSorted());
        assert.deepEqual(result.steps.map(s => s.step), ['ordinary-root', 'reserved-funding', 'reserved-opening']);
        for (const step of result.steps) for (const key of keys(step)) assert.ok(fields('DistributionStepResult').includes(key), key);
    }
    assert.equal(success.result.status, 'complete');
    assert.deepEqual(keys(success.result.reservedOpening), fields('ReservedOpeningFact').toSorted());
    assert.equal(partial.result.status, 'partial');
    assert.equal(partial.result.reservedOpening, null);
    assert.deepEqual(partial.result.steps.map(s => s.status), ['confirmed', 'confirmed', 'not-sent']);
    assert.equal(partial.execute.code, 'AUTHORIZATION_EXPIRED');
    assert.equal(partial.execute.result.status, 'partial');
});

test('minimal distribution read FIXTURE replays result/readback in isolation and rejects unknown intents', async () => {
    const { createChainDistributionExamples, createDistributionReadFixture, CHAIN_DISTRIBUTION_FIXTURE_LABEL } = await import('@hanamesh/api-contracts/chain');
    const examples = createChainDistributionExamples();
    const fixture = createDistributionReadFixture(examples);
    assert.equal(fixture.label, CHAIN_DISTRIBUTION_FIXTURE_LABEL);
    assert.deepEqual(Object.keys(fixture.adapter).toSorted(), ['canonicalReadback', 'result'], 'never verifies, signs or sends');
    const intentId = examples.success.result.intentId;
    const result = await fixture.adapter.result(intentId);
    assert.deepEqual(result, examples.success.result);
    result.status = 'reverted';
    examples.success.result.status = 'unknown';
    assert.equal((await fixture.adapter.result(intentId)).status, 'complete');
    assert.deepEqual(await fixture.adapter.canonicalReadback(intentId), createChainDistributionExamples().success.canonicalReadback);
    for (const read of [fixture.adapter.result, fixture.adapter.canonicalReadback])
        await assert.rejects(read('unknown-intent'), { name: 'DistributionError', code: 'INTENT_NOT_FOUND', message: examples.failure.intentNotFound.message });
});
