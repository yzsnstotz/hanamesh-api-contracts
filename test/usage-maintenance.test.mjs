// Q-33 C-USAGE host maintenance port (J2S3-APIC-16). FIXTURE evidence only: in-memory SQL emulation, not PostgreSQL or a host job.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CONTRACTS} from '@hanamesh/api-contracts';
import * as usage from '@hanamesh/api-contracts/usage';
import {validatorFor} from './schema.mjs';
const result = validatorFor(new URL('../contracts/usage/schema.json', import.meta.url), 'RollupAndPurgeResult');
const AT = new Date('2026-09-19T00:00:00.000Z'), DAY = 86400000, DEVICE = 'A'.repeat(43), P = '11111111-1111-4111-8111-111111111111';
const ZERO = '00000000-0000-4000-8000-000000000000';
const iso = ms => new Date(ms).toISOString();
const seedOld = (f, n = 3, ageDays = 91) => f.seed(Array.from({length:n}, () => ({deviceId:DEVICE, principalId:P, hanaRef:'h', action:'use', occurredAt:iso(AT - ageDays * DAY), receivedAt:iso(AT - ageDays * DAY)})));
const sql = f => f.statements.map(s => s.sql);

test('Q-33 without context: one client, provider GUC/LOCK/statement order, committed, released', async () => {
  const f = usage.createUsageMaintenanceFixture({deploymentId:'test-deployment'}); seedOld(f);
  const r = await f.port.rollupAndPurge(AT);
  assert.deepEqual(r, {rolled:3, purged:3, durability:'committed'}); assert.equal(result(r).ok, true);
  assert.equal(f.connects, 1); assert.equal(f.releases, 1);
  // Same assertions as provider test/maintenance-port.test.mjs at 5ff545a.
  assert.deepEqual(sql(f).map(s => s.slice(0, 40)), ['BEGIN', "SELECT set_config('hanamesh_usage.princi", "SELECT set_config('hanamesh_usage.princi", 'LOCK TABLE usage.events IN SHARE UPDATE ', 'WITH expired AS MATERIALIZED (', 'COMMIT']);
  assert.deepEqual(f.statements[1].args, [ZERO, 'test-deployment']);
  assert.deepEqual(f.statements[2].args, ['', '', 'on']);
  assert.deepEqual(f.statements[4].args, ['test-deployment', iso(AT - 90 * DAY)], 'default retention 90 days');
  assert.deepEqual(f.rollups(), [{principalId:P, deviceId:DEVICE, hanaRef:'h', action:'use', day:iso(AT - 91 * DAY).slice(0, 10), count:3}]);
  assert.deepEqual(await f.port.rollupAndPurge(AT), {rolled:0, purged:0, durability:'committed'}, 'rerun is 0/0');
});

test('Q-33 retentionDays sets the received_at cutoff; integers 0..90 only, rejected at construction', async () => {
  for (const days of [0, 7, 90]) { const f = usage.createUsageMaintenanceFixture({retentionDays:days}); await f.port.rollupAndPurge(AT); assert.equal(f.statements[4].args[1], iso(AT - days * DAY)); }
  for (const days of [-1, 91, 1.5, '90', Number.NaN]) assert.throws(() => usage.createUsageMaintenanceFixture({retentionDays:days}), {code:'USAGE_CONFIG_INVALID'});
  const f = usage.createUsageMaintenanceFixture({retentionDays:30});
  f.seed([{deviceId:DEVICE, principalId:P, hanaRef:'h', action:'open', occurredAt:iso(AT - 60 * DAY), receivedAt:iso(AT - DAY)}]);
  assert.deepEqual(await f.port.rollupAndPurge(AT), {rolled:0, purged:0, durability:'committed'}, 'old occurredAt but fresh receivedAt is kept');
  const d = usage.USAGE_MAINTENANCE_DEFINITION.retention;
  assert.deepEqual([d.min, d.max, d.default, d.field, d.invalid], [0, 90, 90, 'received_at', 'USAGE_CONFIG_INVALID']);
});

test('Q-33 with a C-UOW context: only context.executor, no transaction control, host commit or rollback decides', async () => {
  const f = usage.createUsageMaintenanceFixture(); seedOld(f);
  const tx = await f.beginHostTransaction(), before = f.statements.length;
  const r = await f.port.rollupAndPurge(AT, tx.context);
  assert.deepEqual(r, {rolled:3, purged:3, durability:'pending-host-commit'}); assert.equal(result(r).ok, true);
  assert.equal(f.connects, 0); assert.equal(f.releases, 0);
  const job = sql(f).slice(before);
  assert.ok(!job.some(s => /^(BEGIN|COMMIT|ROLLBACK)/.test(s)), 'no transaction control on a host executor');
  assert.ok(job.some(s => s.startsWith('LOCK TABLE usage.events')));
  await tx.rollback(); assert.equal(f.events().length, 3); assert.deepEqual(f.rollups(), []);
  const tx2 = await f.beginHostTransaction(); await f.port.rollupAndPurge(AT, tx2.context); await tx2.commit();
  assert.equal(f.events().length, 0); assert.equal(f.rollups()[0].count, 3);
});

test('Q-33 actual errors: USAGE_INPUT_INVALID, USAGE_CONFIG_INVALID, USAGE_STORAGE_UNAVAILABLE', async () => {
  for (const at of ['2026-09-19T00:00:00.000Z', AT.valueOf(), undefined, new Date(Number.NaN)]) { const f = usage.createUsageMaintenanceFixture(); await assert.rejects(() => f.port.rollupAndPurge(at), {code:'USAGE_INPUT_INVALID', statusCode:400}); assert.equal(f.connects, 0); }
  for (const context of [null, {}, {executor:{}}]) { const f = usage.createUsageMaintenanceFixture(); await assert.rejects(() => f.port.rollupAndPurge(AT, context), {code:'USAGE_CONFIG_INVALID'}); assert.equal(f.connects, 0); }
  const owned = usage.createUsageMaintenanceFixture(); seedOld(owned); owned.failNext('LOCK TABLE');
  await assert.rejects(() => owned.port.rollupAndPurge(AT), {code:'USAGE_STORAGE_UNAVAILABLE', statusCode:503});
  assert.deepEqual(sql(owned).slice(-2), ['LOCK TABLE usage.events IN SHARE UPDATE EXCLUSIVE MODE', 'ROLLBACK']); assert.equal(owned.releases, 1); assert.equal(owned.events().length, 3);
  const hosted = usage.createUsageMaintenanceFixture(), tx = await hosted.beginHostTransaction(); hosted.failNext('WITH expired');
  await assert.rejects(() => hosted.port.rollupAndPurge(AT, tx.context), {code:'USAGE_STORAGE_UNAVAILABLE'});
  assert.ok(!sql(hosted).includes('ROLLBACK'), 'the host rolls back its own transaction');
  const connectFail = usage.createUsageMaintenanceFixture(); connectFail.failNext('connect');
  await assert.rejects(() => connectFail.port.rollupAndPurge(AT), {code:'USAGE_STORAGE_UNAVAILABLE'});
  // Host executor outside BEGIN: the emulation rejects LOCK like PostgreSQL (provider inference, not a real-database result).
  const outside = usage.createUsageMaintenanceFixture(), client = await outside.pool.connect();
  await assert.rejects(() => outside.port.rollupAndPurge(AT, {executor:client}), {code:'USAGE_STORAGE_UNAVAILABLE'});
  const errors = usage.USAGE_MAINTENANCE_DEFINITION.errors;
  assert.deepEqual(Object.keys(errors), ['USAGE_INPUT_INVALID', 'USAGE_CONFIG_INVALID', 'USAGE_STORAGE_UNAVAILABLE']);
  for (const [code, value] of Object.entries(errors)) { assert.ok(usage.USAGE_ERRORS.includes(code)); assert.equal(value.status, usage.USAGE_CONTRACT_DEFINITION.errors[code].status); }
});

test('Q-33 executable examples are FIXTURE and match the provider schema', async () => {
  const e = await usage.createUsageMaintenanceExamples();
  assert.match(e.label, /^FIXTURE/);
  for (const r of [e.committed, e.rerun, e.hostCommit.result, e.hostRollback.result]) assert.equal(result(r).ok, true);
  assert.deepEqual(e.committed, {rolled:2, purged:2, durability:'committed'});
  assert.deepEqual(e.rerun, {rolled:0, purged:0, durability:'committed'});
  assert.equal(e.hostCommit.result.durability, 'pending-host-commit'); assert.equal(e.hostCommit.rollups[0].count, 2);
  assert.equal(e.hostRollback.eventsAfterRollback, 3);
  assert.deepEqual(e.errors.map(x => x.code), ['USAGE_INPUT_INVALID', 'USAGE_CONFIG_INVALID', 'USAGE_CONFIG_INVALID', 'USAGE_STORAGE_UNAVAILABLE']);
  assert.equal(usage.USAGE_MAINTENANCE_DEFINITION.http, null);
  assert.deepEqual(usage.USAGE_MAINTENANCE_DEFINITION.shutdown.length, 4);
});

test('Q-33 is additive: original fixture still declares no rollups/host commit, three HTTP calls unchanged', async () => {
  assert.equal(usage.USAGE_FIXTURE_LABEL, 'FIXTURE · C-USAGE · synthetic memory events and C-IDENTITY; no SQL, HTTP server, rollups or host commit');
  assert.deepEqual(Object.keys(usage.USAGE_CONTRACT_DEFINITION.calls), ['ingestEvents', 'withdrawEvents', 'getContributions']);
  assert.ok(!('rollupAndPurge' in usage.USAGE_CONTRACT_DEFINITION.calls));
  assert.equal(CONTRACTS['C-USAGE'].definition, usage.USAGE_CONTRACT_DEFINITION);
  const f = await usage.createUsageProviderFixture();
  assert.ok(!('rollupAndPurge' in f.service));
  const input = [f.event()];
  await assert.rejects(f.service.ingestEvents(f.request('POST', '/v1/usage/events', input), input, {executor:{query:async () => ({rows:[]})}}), {code:'USAGE_STORAGE_UNAVAILABLE'}, 'original fixture still refuses host contexts');
  assert.equal((await f.service.getContributions({deviceRequest:f.request('GET', '/v1/usage/me/contributions')}, f.window)).sources.rollups, 0);
  assert.notEqual(usage.USAGE_MAINTENANCE_FIXTURE_LABEL, usage.USAGE_FIXTURE_LABEL);
});

test('Q-33 provenance: provider 5ff545a, appended files keep their v0.9.0 bytes as prefix, new files hashed', () => {
  const manifest = JSON.parse(readFileSync(new URL('../contracts/usage/provenance.json', import.meta.url), 'utf8'));
  const m = manifest.maintenance, sha = buf => createHash('sha256').update(buf).digest('hex');
  assert.equal(m.commit, '5ff545afd9d4da7cbb589d37492e7446f65c73eb'); assert.equal(m.card, 'J2S3-SUSAGE-02'); assert.equal(m.contractCard, 'J2S3-APIC-16');
  for (const runtime of ['src/service.ts', 'src/database/events-repository.ts', 'contract/usage-contract.schema.json']) assert.equal(m.sourceFiles[runtime], manifest.sourceFiles[runtime], `${runtime} unchanged since 70c480e`);
  for (const [file, expected] of Object.entries(m.contractFiles)) assert.equal(sha(readFileSync(new URL(`../contracts/usage/${file}`, import.meta.url))), expected, file);
  for (const [file, {previousBytes, previousSha256}] of Object.entries(m.appendedFiles)) {
    assert.equal(previousSha256, manifest.contractFiles[file], file);
    assert.equal(sha(readFileSync(new URL(`../contracts/usage/${file}`, import.meta.url)).subarray(0, previousBytes)), previousSha256, `${file} only appended`);
  }
});
