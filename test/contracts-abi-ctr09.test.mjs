import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {keccak256, encodeDeployData, encodeAbiParameters} from 'viem';
const root = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, root));
const json = p => JSON.parse(read(p));
const sha = b => createHash('sha256').update(b).digest('hex');
const prefix = 'contracts/contracts-abi/frozen/oz-ctr09/';
const names = ['HanaLauncher', 'LaunchFee', 'HanaToken', 'Distributor', 'ReservedDistributor'];
const symbols = ['HANA_LAUNCHER', 'LAUNCH_FEE', 'HANA_TOKEN', 'DISTRIBUTOR', 'RESERVED_DISTRIBUTOR'];
test('CTR-09 publishes an independent complete frozen collection', async () => {
    const pkg = json('package.json');
    assert.ok(pkg.exports['./contracts-abi/frozen/oz-ctr09'], 'missing complete collection export');
    const bundle = await import('@hanamesh/api-contracts/contracts-abi/frozen/oz-ctr09');
    const manifest = json(prefix + 'manifest.json');
    const provenance = json(prefix + 'provenance.json');
    assert.deepEqual(Object.keys(manifest.contracts), names);
    assert.equal(provenance.providerCard, 'J4S3-CTR-09');
    assert.equal(provenance.providerCommit, '2ca2fb07b8b94804ac5c8b336d26dfb9f195253a');
    assert.equal(provenance.evidence, 'SOURCE_BUILD');
    assert.deepEqual(bundle.CONTRACTS_ABI_FROZEN_MANIFEST, manifest);
    assert.deepEqual(bundle.CONTRACTS_ABI_PROVENANCE, provenance);
    assert.equal(bundle.CONTRACTS_ABI_DEFINITION.providerCommit, provenance.providerCommit);
    assert.equal(bundle.createDistributorContractExamples().evidence, 'FIXTURE');
    for (const [sourcePath, file] of Object.entries(provenance.files)) {
        assert.ok(sourcePath.startsWith('abi/'));
        assert.equal(sha(read(file.path)), file.sha256, sourcePath);
        const subpath = './' + file.path.replace(/^contracts\//, '');
        assert.equal(pkg.exports[subpath], './' + file.path);
        assert.equal(import.meta.resolve('@hanamesh/api-contracts/' + subpath.slice(2)), new URL(file.path, root).href);
    }
    names.forEach((name, i) => {
        const entry = manifest.contracts[name];
        const bytes = read(prefix + entry.path);
        const a = JSON.parse(bytes);
        assert.deepEqual(Object.keys(a), manifest.format);
        assert.equal(a.contract, name);
        assert.equal(a.version, manifest.version);
        assert.match(a.creationBytecode, /^0x(?:[0-9a-f]{2})+$/);
        assert.match(a.runtimeTemplate, /^0x(?:[0-9a-f]{2})+$/);
        if (i < 3) {
            const legacy = json('contracts/contracts-abi/frozen/' + name + '.json');
            for (const key of ['abi', 'creationBytecode', 'runtimeTemplate', 'metadata']) assert.deepEqual(a[key], legacy[key]);
            const offsets = refs => Object.values(refs).flat().sort((a, b) => a.start - b.start);
            assert.deepEqual(offsets(a.immutableReferences), offsets(legacy.immutableReferences));
            assert.notEqual(sha(bytes), sha(read('contracts/contracts-abi/frozen/' + name + '.json')));
        }
        assert.equal(sha(bytes), entry.fileSHA256);
        assert.equal(sha(JSON.stringify(a.abi)), entry.abiSHA256);
        assert.equal(keccak256(a.creationBytecode), entry.creationKeccak);
        assert.equal(keccak256(a.runtimeTemplate), entry.runtimeTemplateKeccak);
        assert.deepEqual(bundle[symbols[i] + '_FROZEN'], a);
        assert.deepEqual(bundle[symbols[i] + '_ABI'], a.abi);
        const runtime = Buffer.from(a.runtimeTemplate.slice(2), 'hex');
        assert.equal(runtime.length, entry.runtimeBytes);
        const ranges = Object.values(a.immutableReferences).flat();
        assert.equal(ranges.length, entry.immutableSlots);
        const deployedFixture = Buffer.from(runtime);
        for (const {start, length} of ranges) {
            assert.ok(Number.isInteger(start) && start >= 0 && length === 32 && start + length <= runtime.length);
            assert.ok(runtime.subarray(start, start + length).every(b => b === 0));
            deployedFixture.fill(0xa5, start, start + length);
        }
        for (const {start, length} of ranges) deployedFixture.fill(0, start, start + length);
        assert.equal(keccak256('0x' + deployedFixture.toString('hex')), entry.runtimeTemplateKeccak);
        if (i >= 3) assert.deepEqual(a.abi, json('contracts/contracts-abi/' + name + '.json'));
    });
    assert.equal(manifest.compiler, '0.8.26+commit.8a97fa7a');
    assert.equal(manifest.openzeppelin.commit, 'e4f70216d759d8e6a64144a9e1f7bbeed78e7079');
    assert.equal(manifest.contracts.Distributor.fileSHA256, 'fb2651d1222485f60b165236a9010320b991581b64348fb3ff52ac836a1487b3');
    assert.equal(manifest.contracts.ReservedDistributor.fileSHA256, '7ce2b78d7a69090b1f083ed852a572dc3f8b21f8e50ccccc5d987c5f9f9ec951');
});
test('Distributor constructor models append exactly signer or signer plus treasury', async () => {
    const pkg = json('package.json');
    assert.ok(pkg.exports['./contracts-abi/frozen/oz-ctr09'], 'missing complete collection export');
    const bundle = await import('@hanamesh/api-contracts/contracts-abi/frozen/oz-ctr09');
    const signer = '0x0000000000000000000000000000000000000001';
    const treasury = '0x0000000000000000000000000000000000000002';
    for (const [symbol, args, inputNames] of [['DISTRIBUTOR', [signer], ['signer_']], ['RESERVED_DISTRIBUTOR', [signer, treasury], ['signer_', 'treasury_']]]) {
        const artifact = bundle[symbol + '_FROZEN'];
        const inputs = artifact.abi.find(x => x.type === 'constructor').inputs;
        assert.deepEqual(inputs.map(x => x.name), inputNames);
        assert.deepEqual(inputs.map(x => x.type), args.map(() => 'address'));
        assert.equal(encodeDeployData({abi: artifact.abi, bytecode: artifact.creationBytecode, args}), artifact.creationBytecode + encodeAbiParameters(inputs, args).slice(2));
    }
});
test('all legacy source bytes and export targets stay unchanged', () => {
    const baseline = json('test/ctr09-legacy.json');
    const pkg = json('package.json');
    for (const [p, hash] of Object.entries(baseline.files)) assert.equal(sha(read(p)), hash, p);
    for (const [p, target] of Object.entries(baseline.exports)) assert.deepEqual(pkg.exports[p], target, p);
});
