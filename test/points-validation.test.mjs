import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as p from '@hanamesh/api-contracts/points';

const read = name => JSON.parse(readFileSync(new URL(`../contracts/points/${name}`,import.meta.url)));
test('Q-50 publishes callable metadata and all existing calls without a product implementation', () => {
  const d = p.POINTS_CONTRACT_DEFINITION;
  assert.deepEqual(d.calls.checkBeneficiaryView,{input:'BeneficiaryEntitlementView, BeneficiaryViewExpected',output:'string[] (failed rule IDs; empty means consumable)',errors:[]});
  assert.deepEqual(d.beneficiaryValidation.rules,['SCHEMA','CONTEXT','POLICY_LABEL','ONE_WALLET','NO_PER_ENTITLEMENT_AMOUNT','PENDING_ZERO_ACCOUNT','BOUND_ACCOUNT','ISOLATION','CLAIMABLE','LEAF','PROOF']);
  for (const name of ['checkBeneficiaryView','createCustodyModule','createCustodyService','createCustodyStore','createSnapshotService','createProductionAllocationPolicy']) assert.equal(name in p,false,name);
  assert.equal(Object.keys(d.calls).length,10);
});
test('independent validation FIXTURE preserves synchronous delegation, failure IDs and exceptions', () => {
  const examples=p.createBeneficiaryValidationExamples();
  assert.deepEqual(examples,read('beneficiary-validation-examples.json'));
  assert.throws(()=>p.createBeneficiaryValidationPortFixture(),TypeError);
  let seen;
  const failed=['CONTEXT','FUTURE_PROVIDER_RULE'];
  const checker=(view,expected)=>{seen=[view,expected];return failed;};
  const f=p.createBeneficiaryValidationPortFixture(checker);
  assert.match(f.label,/FIXTURE/);
  assert.equal(f.port.checkBeneficiaryView,checker);
  assert.equal(f.port.checkBeneficiaryView(examples.ordinary.view,examples.ordinary.expected),failed);
  assert.deepEqual(seen,[examples.ordinary.view,examples.ordinary.expected]);
  const good=p.createBeneficiaryValidationPortFixture(()=>[]);
  for (const scenario of [examples.ordinary,examples.reserved]) assert.deepEqual(good.port.checkBeneficiaryView(scenario.view,scenario.expected),[]);
  for (const error of [new TypeError('nested'),new SyntaxError('integer'),new Error('ABI')]) {
    const denied=p.createBeneficiaryValidationPortFixture(()=>{throw error;});
    assert.throws(()=>denied.port.checkBeneficiaryView(examples.ordinary.view,examples.ordinary.expected),e=>e===error);
  }
  examples.ordinary.view.ordinary.entries[0].cumulativeAmount='tampered';
  assert.equal(p.createBeneficiaryValidationExamples().ordinary.view.ordinary.entries[0].cumulativeAmount,'13');
  assert.equal(examples.reserved.view.reserved.entries[0].claimable,false);
});
test('named configuration error examples retain exact provider envelope and no new codes', () => {
  const e=p.createSnapshotSettingsExamples();
  assert.deepEqual(e,read('snapshot-settings-examples.json'));
  assert.deepEqual(Object.keys(e.missingInputs),['rootAuthorizationValiditySeconds','allocationRemainderRule','platformDust','reservedDust']);
  for (const [name,value] of Object.entries(e.missingInputs)) {
    assert.equal(value.status,503);
    assert.equal(value.body.error.code,'CUSTODY_ALLOCATION_POLICY_REQUIRED');
    assert.equal(value.body.error.need.input,name);
    const error=new p.CustodyError(value.body.error.code,value.body.error.message,value.body.error.need);
    assert.deepEqual(error.toJSON(),value.body);
  }
  assert.equal(e.remainderUnset[0].value,null);
  assert.equal(e.remainderConfigured[0].default,null);
});
test('Q-50 source pin and published SHA256 inventory are auditable', () => {
  const m=read('validation-provenance.json');
  assert.equal(m.commit,'c93e7a6efa0d080f0b481b8d4f2577fe78cbd33a');
  assert.equal(m.card,'J4S3-CUST-05');
  assert.equal(m.publicationCard,'J4S3-APIC-18');
  for (const [file,sha] of Object.entries(m.publishedFiles)) assert.equal(createHash('sha256').update(readFileSync(new URL(`../contracts/points/${file}`,import.meta.url))).digest('hex'),sha,file);
  assert.equal(m.sourceFiles['examples/beneficiary-validation-examples.json'],m.publishedFiles['beneficiary-validation-examples.json']);
  assert.equal(m.sourceFiles['examples/snapshot-settings-examples.json'],m.publishedFiles['snapshot-settings-examples.json']);
});
