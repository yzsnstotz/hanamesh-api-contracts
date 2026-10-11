import test from 'node:test';
import assert from 'node:assert/strict';
import {CONTRACTS} from '@hanamesh/api-contracts';
import * as usage from '@hanamesh/api-contracts/usage';
import {validatorFor} from './schema.mjs';
const make = () => usage.createUsageProviderFixture();
const schema = def => validatorFor(new URL('../contracts/usage/schema.json', import.meta.url), def);

test('C-USAGE is published with provider schema and three HTTP calls', async () => {
  assert.equal(CONTRACTS['C-USAGE'].definition.id, 'C-USAGE');
  assert.equal(usage.USAGE_CONTRACT_DEFINITION.calls.ingestEvents.path, '/v1/usage/events');
  assert.equal(usage.USAGE_CONTRACT_DEFINITION.calls.withdrawEvents.method, 'DELETE');
  const examples = await usage.createUsageContractExamples();
  for (const [def, values] of Object.entries(examples.wire)) for (const value of values) assert.equal(schema(def)(value).ok, true, def);
  assert.match(examples.label, /^FIXTURE/);
});

test('two clients sharing device and original event accept once, then duplicate with fresh HTTP auth', async () => {
  const f = await make(), event = f.event(), inputA = structuredClone([event]), inputB = structuredClone([event]);
  const a = f.request('POST', '/v1/usage/events', inputA), b = f.request('POST', '/v1/usage/events', inputB);
  assert.notEqual(a.headers['x-hm-nonce'], b.headers['x-hm-nonce']);
  assert.equal(inputA[0].nonce, inputB[0].nonce);
  assert.deepEqual(await f.service.ingestEvents(a, inputA), {accepted:1, duplicates:0, rejected:[], durability:'committed'});
  assert.deepEqual(await f.service.ingestEvents(b, inputB), {accepted:0, duplicates:1, rejected:[], durability:'committed'});
  const c = await f.service.getContributions({deviceRequest:f.request('GET', '/v1/usage/me/contributions')}, f.window);
  assert.equal(c.sources.events, 1); assert.equal(c.byHana[0].actions.use, 1);
  assert.equal(c.deviceCount, 1); assert.equal(c.bound, false);
});

test('event digest includes nonce and optional fields, excludes signature, preserves provider field order', async () => {
  const event = {"deviceId":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","hanaRef":"fixture.hana","action":"use","occurredAt":"2026-10-11T00:00:00.000Z","eventId":"11111111-1111-4111-8111-111111111111","nonce":"fixed-event-nonce","signature":"unused","sourceHanaRef":"fixture.source","targetRef":"fixture.target","receipt":{"providerId":"fixture","model":null,"count":2}};
  // Frozen digest computed from provider src/events.ts at 70c480e, independent of this package implementation.
  const expected = '3c7a98a1a85e868e1bb8918d67e2e05e029e509df0598ecdf93d23f6841b3527';
  assert.equal(usage.eventDigest(event), expected);
  assert.equal(usage.eventDigest({...event,signature:'other'}), expected);
  for (const change of [{nonce:'other-event-nonce'}, {action:'open'}, {occurredAt:'2026-10-11T00:00:01.000Z'}, {hanaRef:'other'}, {sourceHanaRef:'other'}, {targetRef:'other'}, {receipt:{...event.receipt,count:3}}]) assert.notEqual(usage.eventDigest({...event,...change}), expected);
});

test('same id with changed nonce or digest conflicts; different id reusing device nonce rejects', async () => {
  const f = await make(), original = f.event();
  await f.service.ingestEvents(f.request('POST','/v1/usage/events',[original]), [original]);
  const conflicts = [f.event({...original,nonce:'new-event-nonce'}), f.event({...original,hanaRef:'other.hana'}), f.event({...original,targetRef:'different'})];
  for (const event of conflicts) {
    const result = await f.service.ingestEvents(f.request('POST','/v1/usage/events',[event]), [event]);
    assert.deepEqual(result.rejected, [{eventId:original.eventId,code:'USAGE_EVENT_CONFLICT'}]); assert.equal(result.accepted,0);
  }
  const reused = f.event({nonce:original.nonce});
  const result = await f.service.ingestEvents(f.request('POST','/v1/usage/events',[reused]), [reused]);
  assert.deepEqual(result.rejected,[{eventId:reused.eventId,code:'USAGE_NONCE_REUSED'}]);
  const fresh = f.event(); assert.equal((await f.service.ingestEvents(f.request('POST','/v1/usage/events',[fresh]),[fresh])).accepted,1);
});

test('reusing signed HTTP request is Identity replay mapped by Usage to auth-required', async () => {
  const f = await make(), input = [f.event()], request = f.request('POST','/v1/usage/events',input);
  await f.service.ingestEvents(request, input);
  await assert.rejects(f.identity.deviceAuth.authenticateDevice(request), {code:'IDENTITY_DEVICE_REPLAY'});
  await assert.rejects(f.service.ingestEvents(request,input), {code:'USAGE_AUTH_REQUIRED',statusCode:401});
  assert.equal((await f.service.ingestEvents(f.request('POST','/v1/usage/events',input),input)).duplicates,1);
});

test('event and HTTP signature failures or wrong device do not become duplicates', async () => {
  const f = await make(), event = f.event();
  const tampered = {...event,nonce:'tampered'};
  await assert.rejects(f.service.ingestEvents(f.request('POST','/v1/usage/events',[tampered]),[tampered]),{code:'USAGE_SIGNATURE_INVALID'});
  const changed = f.request('POST','/v1/usage/events',[event]); changed.bodyHash = '0'.repeat(64);
  await assert.rejects(f.service.ingestEvents(changed,[event]),{code:'USAGE_AUTH_REQUIRED'});
  const other = f.event({deviceId:'A'.repeat(43)});
  await assert.rejects(f.service.ingestEvents(f.request('POST','/v1/usage/events',[other]),[other]),{code:'USAGE_DEVICE_MISMATCH'});
});

test('invalid items and clock skew remain batch rejections; invalid batch fails', async () => {
  const f = await make(), event = f.event({occurredAt:'2026-10-11T00:06:00.000Z'}), bad = {...f.event(),prompt:'forbidden'};
  const result = await f.service.ingestEvents(f.request('POST','/v1/usage/events',[event,bad]),[event,bad]);
  assert.equal(result.accepted,0); assert.deepEqual(result.rejected,[{eventId:bad.eventId,code:'USAGE_INPUT_INVALID'},{eventId:event.eventId,code:'USAGE_CLOCK_SKEW'}]);
  await assert.rejects(f.service.ingestEvents(f.request('POST','/v1/usage/events',[]),[]),{code:'USAGE_INPUT_INVALID'});
});

test('contributions use [from,to), withdrawal is device-owned and HTTP response omits durability', async () => {
  const f = await make(), events = [f.event(),f.event({occurredAt:f.window.to})];
  await f.service.ingestEvents(f.request('POST','/v1/usage/events',events),events);
  const before = await f.service.getContributions({deviceRequest:f.request('GET','/v1/usage/me/contributions')},f.window);
  assert.equal(before.sources.events,1);
  const path = `/v1/usage/me/devices/${f.key.deviceId}/events`;
  const removed = await f.service.withdrawEvents({deviceRequest:f.request('DELETE',path)},f.key.deviceId);
  assert.deepEqual(usage.usageWithdrawWire(removed),{deletedEvents:2});
  assert.equal((await f.service.getContributions({deviceRequest:f.request('GET','/v1/usage/me/contributions')},f.window)).sources.events,0);
  await assert.rejects(f.service.withdrawEvents({deviceRequest:f.request('DELETE',path)},'A'.repeat(43)),{code:'USAGE_DEVICE_MISMATCH'});
  await assert.rejects(f.service.getContributions({deviceRequest:f.request('GET','/v1/usage/me/contributions')},{...f.window,to:f.window.from}),{code:'USAGE_INPUT_INVALID'});
});

test('fresh HTTP auth handles original duplicates inside one batch without counting twice', async () => {
  const f = await make(), event = f.event(), input = [event,structuredClone(event)];
  assert.deepEqual(await f.service.ingestEvents(f.request('POST','/v1/usage/events',input),input),{accepted:1,duplicates:1,rejected:[],durability:'committed'});
});

test('cookie-bound account can read and withdraw its device, unrelated account sees no contribution', async () => {
  const f = await make(), input = [f.event()];
  await f.service.ingestEvents(f.request('POST','/v1/usage/events',input),input);
  assert.equal((await f.service.getContributions(f.credentials,f.window)).sources.events,0);
  const actor = await f.identity.authenticate(f.credentials);
  const challenge = await f.identity.deviceRegistration.createChallenge('bind');
  await f.identity.principalLinks.bindDevice(actor,{deviceId:f.key.deviceId,nonce:challenge.nonce,signature:f.key.sign(challenge.nonce)});
  const bound = await f.service.getContributions(f.credentials,f.window);
  assert.equal(bound.sources.events,1); assert.equal(bound.bound,true); assert.equal(bound.deviceCount,1);
  assert.deepEqual(usage.usageWithdrawWire(await f.service.withdrawEvents(f.credentials,f.key.deviceId)),{deletedEvents:1});
});

test('published C-USAGE artifact hashes and original schema agree with provider provenance', async () => {
  const {readFileSync} = await import('node:fs'), {createHash} = await import('node:crypto');
  const manifest = JSON.parse(readFileSync(new URL('../contracts/usage/provenance.json',import.meta.url),'utf8'));
  assert.equal(manifest.commit,'70c480e42d68d8ff338e40e888a239e887d3f1ed');
  assert.equal(manifest.card,'J2S3-SUSAGE-01');
  for (const [file,expected] of Object.entries(manifest.contractFiles)) assert.equal(createHash('sha256').update(readFileSync(new URL(`../contracts/usage/${file}`,import.meta.url))).digest('hex'),expected,file);
  assert.equal(manifest.contractFiles['schema.json'],manifest.sourceFiles['contract/usage-contract.schema.json']);
  assert.ok(!usage.USAGE_ERRORS.includes('IDENTITY_DEVICE_REPLAY'));
  assert.equal(usage.identityError({code:'IDENTITY_DEVICE_REPLAY'}).code,'USAGE_AUTH_REQUIRED');
});
