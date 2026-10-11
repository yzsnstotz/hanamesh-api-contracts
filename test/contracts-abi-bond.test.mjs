import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {keccak256, encodeFunctionData, encodeEventTopics, encodeErrorResult} from 'viem';
import * as bond from '@hanamesh/api-contracts/contracts-abi';
const read = p => readFileSync(new URL('../' + p, import.meta.url));
const json = p => JSON.parse(read(p));
const sha = b => createHash('sha256').update(b).digest('hex');
const prefix = 'contracts/contracts-abi/';
test('CTR-05 exact-byte exports, frozen integrity and provider manifest entries', () => {
 const provenance = bond.BOND_PROVENANCE;
 assert.equal(provenance.providerCommit, 'b03f0f0da3f7e62f3f127795e894b115de38ebba');
 const pkg = json('package.json');
 for (const file of Object.values(provenance.files)) {
  assert.equal(sha(read(file.path)), file.sha256);
  assert.equal(pkg.exports['./' + file.path.replace(/^contracts\//, '')], './' + file.path);
 }
 const source = json(prefix+'bond-frozen-manifest.json');
 for (const name of ['HanaBond','HanaBondFactory']) {
  const frozen = json(prefix+'frozen/'+name+'.json');
  const entry = bond.CONTRACTS_ABI_FROZEN_MANIFEST.contracts[name];
  const {sha256, immutableReferences, ...providerEntry} = entry;
  assert.deepEqual(providerEntry, source.contracts[name]);
  assert.equal(sha256, entry.fileSHA256);
  assert.deepEqual(immutableReferences, frozen.immutableReferences);
  assert.deepEqual(Object.keys(frozen), ['contract','version','abi','creationBytecode','runtimeTemplate','metadata','immutableReferences']);
  assert.equal(sha(read(prefix+'frozen/'+name+'.json')), entry.fileSHA256);
  assert.equal(sha(JSON.stringify(frozen.abi)), entry.abiSHA256);
  assert.equal(keccak256(frozen.runtimeTemplate), entry.runtimeTemplateKeccak);
  assert.equal((frozen.runtimeTemplate.length-2)/2, entry.runtimeBytes);
  assert.deepEqual(frozen.abi, json(prefix+name+'.json'));
  const ranges=Object.values(frozen.immutableReferences).flat();
  assert.equal(ranges.length, entry.immutableSlots);
  const bytes=Buffer.from(frozen.runtimeTemplate.slice(2),'hex');
  for (const {start,length} of ranges) assert.ok(bytes.subarray(start,start+length).every(x=>x===0));
 }
 assert.deepEqual(bond.HANA_BOND_ABI,bond.HANA_BOND_FROZEN.abi);
 assert.deepEqual(bond.HANA_BOND_FACTORY_ABI,bond.HANA_BOND_FACTORY_FROZEN.abi);
});
test('trade fixtures encode against published ABI including events and OZ errors', () => {
 const example = bond.createBondContractExamples();
 assert.deepEqual(example,json(prefix+'bond-example.json'));
 assert.equal(example.evidence,'FIXTURE');
 for (const name of ['buyExact','buyBudget','sell']) {
  const fn=bond.HANA_BOND_ABI.find(x=>x.type==='function' && x.name===name);
  const args=fn.inputs.map(x=>x.type==='uint256'?BigInt(example[name].args[x.name]):example[name].args[x.name]);
  assert.ok(encodeFunctionData({abi:bond.HANA_BOND_ABI,functionName:name,args}).startsWith('0x'));
  assert.ok(encodeEventTopics({abi:bond.HANA_BOND_ABI,eventName:example[name].event.name}).length);
 }
 assert.ok(bond.HANA_BOND_ABI.some(x=>x.type==='event'&&x.name==='Migrated'));
 for (const name of ['Closed','InvalidTrade','Slippage','ReentrancyGuardReentrantCall','SafeERC20FailedOperation']) {
  const error=bond.HANA_BOND_ABI.find(x=>x.type==='error'&&x.name===name);
  assert.ok(error,name);
  assert.ok(encodeErrorResult({abi:bond.HANA_BOND_ABI,errorName:name,args:error.inputs.map(x=>x.type==='address'?example.payer:0n)}).startsWith('0x'));
 }
 const another=bond.createBondContractExamples();example.sell.return='changed';assert.notEqual(another.sell.return,'changed');
});
