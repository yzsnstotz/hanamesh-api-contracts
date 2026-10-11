import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { keccak256 } from 'viem';
import { CONTRACTS } from '@hanamesh/api-contracts';
import * as bundle from '@hanamesh/api-contracts/contracts-abi';
const root = new URL('../contracts/contracts-abi/', import.meta.url);
const read = path => readFileSync(new URL(path, root));
test('CTR-08 byte hashes, ABI, runtime templates and immutable ranges', () => {
    const provenance = JSON.parse(read('provenance.json'));
    assert.equal(provenance.providerCommit, 'fdfc672d81af286e8f118ccab29eb2a5386ba5ca');
    for (const file of Object.values(provenance.files)) {
        assert.equal(createHash('sha256').update(read(file.path)).digest('hex'), file.sha256);
    }
    for (const [name, entry] of Object.entries(bundle.CONTRACTS_ABI_FROZEN_MANIFEST.contracts)) {
        const artifact = JSON.parse(read(`frozen/${name}.json`));
        assert.equal(createHash('sha256').update(read(`frozen/${name}.json`)).digest('hex'), entry.fileSHA256);
        assert.equal(keccak256(artifact.creationBytecode), entry.creationKeccak);
        assert.equal(keccak256(artifact.runtimeTemplate), entry.runtimeTemplateKeccak);
        const bytes = Buffer.from(artifact.runtimeTemplate.slice(2), 'hex');
        assert.equal(bytes.length, entry.runtimeBytes);
        const ranges = Object.values(artifact.immutableReferences).flat();
        assert.equal(ranges.length, entry.immutableSlots);
        for (const {start, length} of ranges) {
            assert.ok(start >= 0 && start + length <= bytes.length);
            assert.ok(bytes.subarray(start, start + length).every(byte => byte === 0));
        }
        if (name !== 'HanaToken') assert.deepEqual(artifact.abi, JSON.parse(read(`${name}.json`)));
    }
    assert.equal(CONTRACTS['C-CONTRACTS-ABI'].definition, bundle.CONTRACTS_ABI_DEFINITION);
    assert.equal(bundle.createContractsAbiContractExamples().evidence, 'FIXTURE');
    assert.ok(bundle.HANA_LAUNCHER_ABI.some(item => item.name === 'launch'));
    assert.ok(bundle.LAUNCH_FEE_ABI.some(item => item.name === 'pay'));
    assert.ok(bundle.HANA_TOKEN_ABI.some(item => item.name === 'transfer'));
});
