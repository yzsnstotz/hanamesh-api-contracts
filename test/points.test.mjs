import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import Ajv from 'ajv';
import Ajv2020 from 'ajv/dist/2020.js';
import {CONTRACTS} from '@hanamesh/api-contracts';

const points = () => import('@hanamesh/api-contracts/points');
test('C-POINTS is published under its provider and subpath', async () => {
  assert.ok(CONTRACTS['C-POINTS'], 'C-POINTS must be published');
  const p = await points();
  assert.equal(CONTRACTS['C-POINTS'].provider, 'server-custody');
  assert.deepEqual(CONTRACTS['C-POINTS'].consumers,['core','web-market','server-host']);
  assert.equal(CONTRACTS['C-POINTS'].definition, p.POINTS_CONTRACT_DEFINITION);
  assert.equal(CONTRACTS['C-POINTS'].entry, '@hanamesh/api-contracts/points');
  assert.equal(Object.keys(p.POINTS_CONTRACT_DEFINITION.calls).length, 10);
});

test('Q-13 zero scenarios differ only in bindingStatus and retain all old fields', async () => {
  const p = await points(), e = p.createPointsContractExamples();
  assert.match(e.label, /^FIXTURE/);
  const {bindingStatus:a, ...oldA} = e.unboundZero;
  const {bindingStatus:b, ...oldB} = e.boundZero;
  assert.deepEqual([a,b], ['UNBOUND','BOUND']);
  assert.deepEqual(oldA, oldB);
  assert.deepEqual(oldA, {hanas:[],totalPoints:0,subtotals:{userPoints:0,pendingUserPoints:0,creatorReward:0,unclassified:0}});
  assert.equal(p.POINTS_CONTRACT_DEFINITION.bindingStatus.UNBOUND,'只累计、暂不可领');
  assert.match(p.POINTS_CONTRACT_DEFINITION.bindingStatus.BOUND,/不承诺链上领取资格/);
  const validate = new Ajv().compile(JSON.parse(readFileSync(new URL('../contracts/points/schema.json',import.meta.url))));
  for (const scenario of [e.unboundZero,e.boundZero,e.unboundPending,e.boundPoints]) assert.equal(validate(scenario),true,JSON.stringify(validate.errors));
  assert.equal(e.unboundPending.hanas[0].pending,5);
  assert.equal(e.boundPoints.hanas[0].pending,0);
  assert.deepEqual(e.unboundPending.hanas[0].pendingUserPoints,e.boundPoints.hanas[0].userPoints);
  const invalid = structuredClone(e.boundZero); delete invalid.bindingStatus;
  assert.equal(validate(invalid),false);
  assert.equal(validate({...e.boundZero,bindingStatus:'CLAIMABLE'}),false);
  e.boundZero.hanas.push({}); assert.deepEqual(p.createPointsContractExamples().boundZero.hanas,[]);
});

test('every declared error has its provider status and envelope, including optional need', async () => {
  const p = await points(), e = p.createPointsContractExamples();
  for (const call of Object.values(p.POINTS_CONTRACT_DEFINITION.calls)) for (const code of call.errors) {
    const error = new p.CustodyError(code);
    assert.deepEqual(e.errors[code],{status:error.statusCode,body:error.toJSON()});
  }
  assert.deepEqual(new p.CustodyError('CUSTODY_ALLOCATION_POLICY_REQUIRED','missing policy',{allocation:'host'}).toJSON(),{error:{code:'CUSTODY_ALLOCATION_POLICY_REQUIRED',message:'missing policy',need:{allocation:'host'}}});
  assert.equal(new p.CustodyError('CUSTODY_AUTH_REQUIRED').statusCode,401);
  assert.equal(new p.CustodyError('CUSTODY_HOST_TRANSACTION_REQUIRED').statusCode,500);
  assert.equal(new p.CustodyError('CUSTODY_WALLET_BINDING_CONFLICT').statusCode,409);
});

test('programmable fixture forwards existing port order and host context without deciding behavior', async () => {
  const p = await points(), e = p.createPointsContractExamples();
  const context = {executor:{query:async()=>({rows:[],rowCount:0})}}, credentials = {cookie:'FIXTURE'};
  const handlers = {
    getOwnPoints: async () => e.boundZero,
    listOwnLedger: async () => e.ledger.items,
    listOwnBalances: async () => e.balance.balances,
    getHanaClaimSummary: async () => e.summary,
    recordUsagePoints: async (ctx,event) => {assert.equal(ctx,context);assert.equal(event,e.usage.input);return e.usage.result;},
    recordClaimCredit: async (event,ctx) => {assert.equal(ctx,context);assert.equal(event,e.claim.input);return e.claim.result;},
    onDeviceBound: async (ctx,deviceId,principalId) => {assert.equal(ctx,context);assert.equal(deviceId,e.bound.input.deviceId);assert.equal(principalId,e.bound.input.principalId);return e.bound.result;},
    admit: async () => e.snapshot.result,
    readEntitlements: async () => e.entitlements.pending.view
  };
  const f = p.createPointsProviderFixture(handlers);
  assert.match(f.label,/FIXTURE/);
  assert.deepEqual(await f.service.recordUsagePoints(context,e.usage.input),e.usage.result);
  assert.deepEqual(await f.service.recordClaimCredit(e.claim.input,context),e.claim.result);
  assert.deepEqual(await f.service.onDeviceBound(context,e.bound.input.deviceId,e.bound.input.principalId),e.bound.result);
  assert.deepEqual(await f.service.getOwnPoints(credentials),e.boundZero);
  assert.deepEqual(await f.service.listOwnLedger(credentials,'cursor',10),e.ledger.items);
  assert.deepEqual(await f.service.listOwnBalances(credentials),e.balance.balances);
  assert.deepEqual(await f.service.getHanaClaimSummary(e.summary.hanaId),e.summary);
  assert.deepEqual(await f.snapshots.admit(credentials,e.snapshot.input.requestId),e.snapshot.result);
  assert.deepEqual(await f.snapshots.readEntitlements(credentials,e.snapshot.input.requestId),e.entitlements.pending.view);
  assert.deepEqual(f.calls[0].args,[context,e.usage.input]);
  assert.deepEqual(f.calls[1].args,[e.claim.input,context]);
  assert.deepEqual(f.calls[4].args,[credentials,'cursor',10]);
  assert.equal(f.calls.length,9);
  await assert.rejects(p.createPointsProviderFixture().service.getOwnPoints(credentials),/scenario handler required/);
  for (const code of Object.keys(e.errors)) {
    const error = new p.CustodyError(code);
    const denied = p.createPointsProviderFixture({getOwnPoints:async()=>{throw error;}});
    await assert.rejects(denied.service.getOwnPoints(credentials),value=>value===error);
  }
});

test('snapshot example and entitlements preserve provider frozen data and pending rights', async () => {
  const p = await points(), e = p.createPointsContractExamples(), s = e.snapshot.result;
  assert.equal(s.rootAuthorization.setting,'rootAuthorizationValiditySeconds');
  assert.equal(BigInt(s.rootAuthorization.validitySeconds)+BigInt(Date.parse(s.acceptedAt)/1000),BigInt(s.launch.rootValidUntil));
  assert.equal(s.rootAuthorization.validUntil,s.launch.rootValidUntil);
  assert.equal(s.distribution.ordinary.payload.message.deadline,s.launch.rootValidUntil);
  const validate = new Ajv2020({strict:false}).compile(JSON.parse(readFileSync(new URL('../contracts/points/entitlements.schema.json',import.meta.url))));
  for (const name of ['issuer','pending']) assert.equal(validate(e.entitlements[name].view),true,JSON.stringify(validate.errors));
  const v = e.entitlements.pending.view;
  assert.equal(v.ordinary.entries.length,0);
  assert.equal(v.reserved.entries[0].claimable,false);
  assert.equal(v.wallet.currentBindingMatches,null);
  assert.ok(v.entitlements.every(x=>x.status==='pending'));
  assert.ok(e.entitlements.issuer.view.entitlements.every(x=>!('amount' in x)));
});

test('provenance pins provider card and every published artifact', () => {
  const manifest = JSON.parse(readFileSync(new URL('../contracts/points/provenance.json',import.meta.url)));
  assert.equal(manifest.commit,'bee5d8219a6bdc70adbb14f72d9d637e21e29d77');
  assert.equal(manifest.card,'J2S4-CUST-01');
  for (const [file,expected] of Object.entries(manifest.publishedFiles)) assert.equal(createHash('sha256').update(readFileSync(new URL(`../contracts/points/${file}`,import.meta.url))).digest('hex'),expected,file);
  assert.equal(manifest.sourceFiles['docs/beneficiary/beneficiary-entitlements.schema.json'],manifest.publishedFiles['entitlements.schema.json']);
});
