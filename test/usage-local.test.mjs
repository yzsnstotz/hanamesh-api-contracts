import test from 'node:test';
import assert from 'node:assert/strict';
import {
    USAGE_LOCAL_CONTRACT_DEFINITION, USAGE_LOCAL_FIXTURE_LABEL, USAGE_RECORD_CODES, USAGE_SERVICE_NAME,
    USAGE_LOCAL_DELIVERY_RULES, USAGE_LOCAL_SHARED_DEVICE_FIXTURE,
    createUsageLocalContractExamples, createUsageLocalCrossClientExamples, createUsageLocalProviderFixture, usageRecordEventId, usageRecordEventNonce,
} from '@hanamesh/api-contracts/usage-local';
import { USAGE_CONTRACT_DEFINITION } from '@hanamesh/api-contracts/usage';
import { validatorFor } from './schema.mjs';

const schemaUrl = new URL('../contracts/usage-local/schema.json', import.meta.url);
const check = def => validatorFor(schemaUrl, def);

test('C-USAGE-LOCAL definition matches the baseline calls and error codes', () => {
    assert.equal(USAGE_LOCAL_CONTRACT_DEFINITION.id, 'C-USAGE-LOCAL');
    assert.equal(USAGE_LOCAL_CONTRACT_DEFINITION.service, USAGE_SERVICE_NAME);
    assert.deepEqual(Object.keys(USAGE_LOCAL_CONTRACT_DEFINITION.methods), ['record', 'health']);
    assert.deepEqual(USAGE_LOCAL_CONTRACT_DEFINITION.methods.record.errors, ['RECORD_FAILED', 'CORE_UNAVAILABLE', 'EVENT_IDENTITY_CONFLICT']);
    assert.deepEqual(USAGE_LOCAL_CONTRACT_DEFINITION.methods.health.errors, ['USAGE_UNAVAILABLE']);
    const record = USAGE_LOCAL_CONTRACT_DEFINITION.methods.record;
    const returnable = [...record.errors, ...record.implementationErrors].filter(code => code !== 'CORE_UNAVAILABLE');
    assert.deepEqual([...returnable].sort(), [...USAGE_RECORD_CODES].sort(), 'record codes in the schema equal declared minus the documented non-returned CORE_UNAVAILABLE');
    assert.match(record.note, /CORE_UNAVAILABLE/);
});

test('C-USAGE-LOCAL examples validate against the schema and cover every outcome', async () => {
    const examples = await createUsageLocalContractExamples();
    assert.equal(examples.label, USAGE_LOCAL_FIXTURE_LABEL);
    assert.ok(check('RecordInput')(examples.input).ok);
    for (const [name, result] of Object.entries(examples.results)) {
        const verdict = check('RecordResult')(result);
        assert.ok(verdict.ok, `${name}: ${JSON.stringify(verdict.errors)}`);
        if (USAGE_RECORD_CODES.includes(name))
            assert.deepEqual(result, { disposition: 'rejected', code: name }, name);
    }
    assert.equal(examples.results.recorded.disposition, 'recorded');
    assert.deepEqual(examples.results.duplicate, examples.results.recorded.disposition === 'recorded' ? { disposition: 'duplicate', eventId: examples.results.recorded.eventId } : null);
    assert.deepEqual(examples.results.withheld, { disposition: 'withheld' });
    for (const health of [examples.health, examples.healthCoreAbsent]) {
        const verdict = check('HealthSnapshot')(health);
        assert.ok(verdict.ok, JSON.stringify(verdict.errors));
    }
    assert.equal(examples.healthCoreAbsent.core, 'absent');
    assert.equal(examples.healthCoreAbsent.consent, 'unknown');
});

test('C-USAGE-LOCAL schema rejects shapes the provider rejects', () => {
    const input = check('RecordInput'), result = check('RecordResult');
    const base = { hanaRef: '@hanamesh/a', action: 'open', occurredAt: '2026-10-11T00:00:00.000Z', idempotencyKey: 'k:1', sourcePlugin: '@hanamesh/dsh-app-host' };
    assert.ok(input(base).ok);
    const { occurredAt, ...noTime } = base;
    assert.equal(input(noTime).ok, false, 'Q-18: occurredAt is required');
    assert.equal(input({ ...base, extra: 1 }).ok, false);
    assert.equal(input({ ...base, action: 'install' }).ok, false);
    assert.equal(input({ ...base, idempotencyKey: 'x'.repeat(161) }).ok, false);
    assert.equal(result({ disposition: 'recorded' }).ok, false, 'recorded needs eventId');
    assert.equal(result({ disposition: 'rejected' }).ok, false, 'rejected needs code');
    assert.equal(result({ disposition: 'withheld', code: 'RECORD_FAILED' }).ok, false);
    assert.equal(result({ disposition: 'rejected', code: 'CORE_UNAVAILABLE' }).ok, false, 'not returned by the provider');
});

test('C-USAGE-LOCAL fixture: idempotency, conflict, consent and Core states', async () => {
    const at = Date.parse('2026-10-11T00:00:00.000Z');
    const fixture = createUsageLocalProviderFixture({ now: () => at, consent: 'withheld' });
    const input = { hanaRef: '@hanamesh/a', action: 'use', occurredAt: '2026-10-10T23:59:00.000Z', idempotencyKey: 'command:c1:succeeded', sourcePlugin: '@hanamesh/a', receipt: { providerId: 'deepseek', model: null, count: 1 } };
    assert.deepEqual(await fixture.service.record(input), { disposition: 'withheld' });
    fixture.setConsent('granted');
    const first = await fixture.service.record(input);
    assert.deepEqual(first, { disposition: 'recorded', eventId: usageRecordEventId('device_CONTRACT_FIXTURE', '@hanamesh/a', 'command:c1:succeeded') });
    assert.deepEqual(await fixture.service.record(input), { disposition: 'duplicate', eventId: first.eventId });
    assert.deepEqual(await fixture.service.record({ ...input, receipt: { providerId: 'deepseek', model: null, count: 2 } }), { disposition: 'rejected', code: 'EVENT_IDENTITY_CONFLICT' });
    assert.deepEqual(await fixture.service.record({ ...input, action: 'open' }), { disposition: 'rejected', code: 'INVALID_RECORD_INPUT' }, 'receipt only with use');
    assert.equal(fixture.service.health().failures.EVENT_IDENTITY_CONFLICT, 1);
    fixture.setCore('incompatible');
    assert.deepEqual(await fixture.service.record(input), { disposition: 'withheld' });
    assert.equal(fixture.service.health().core, 'incompatible');
});

test('C-USAGE-LOCAL event identity is the provider UUIDv5 over [deviceId, sourcePlugin, idempotencyKey]', () => {
    const id = usageRecordEventId('d', 'p', 'k');
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.equal(id, usageRecordEventId('d', 'p', 'k'));
    assert.notEqual(id, usageRecordEventId('d', 'p', 'k2'));
});

test('C-USAGE-LOCAL Q-18: event nonce equals the provider eventNonceForSeat and is not the HTTP request nonce', () => {
    // Vector computed with hanamesh-usage main 6f724fc lib/core/identity.js (eventIdForSeat, eventNonceForSeat).
    const eventId = usageRecordEventId('HlAvSfyQSDrZTJdDJDuNR3crDI_TxQpGO-rolZ8BfX4', '@hanamesh/example-app', 'command:source-operation-1:succeeded');
    assert.equal(eventId, '025aa670-9cf8-5127-b3ea-6e2d31930f24');
    assert.equal(usageRecordEventNonce(eventId), 'nQP2Dv7vzZRStBhOxGBz9sNX2V6-mfaKVA_jfy-LyrsI');
    assert.notEqual(usageRecordEventNonce(usageRecordEventId('d', 'p', 'k2')), usageRecordEventNonce(usageRecordEventId('d', 'p', 'k')));
    const rules = USAGE_LOCAL_CONTRACT_DEFINITION.methods.record.delivery;
    assert.equal(rules, USAGE_LOCAL_DELIVERY_RULES);
    assert.match(rules.requestNonce, /signRequest/);
    assert.match(rules.evidence, /SOURCE\/FIXTURE/);
    assert.match(USAGE_CONTRACT_DEFINITION.idempotency.precedence, /USAGE_EVENT_CONFLICT/, 'server rule the examples rely on');
});

test('C-USAGE-LOCAL Q-18: missing occurredAt is INVALID_RECORD_INPUT, never now', async () => {
    const fixture = createUsageLocalProviderFixture({ now: () => Date.parse('2026-10-11T00:00:00.000Z') });
    const input = { hanaRef: '@hanamesh/a', action: 'open', idempotencyKey: 'page:p1', sourcePlugin: '@hanamesh/a' };
    assert.deepEqual(await fixture.service.record(input), { disposition: 'rejected', code: 'INVALID_RECORD_INPUT' });
    assert.deepEqual(await fixture.service.record({ ...input, occurredAt: null }), { disposition: 'rejected', code: 'INVALID_RECORD_INPUT' });
    assert.deepEqual(fixture.uploadEvents(), []);
    const noDevice = createUsageLocalProviderFixture({ deviceId: null });
    assert.deepEqual(await noDevice.service.record(input), { disposition: 'rejected', code: 'DEVICE_UNAVAILABLE' }, 'provider checks device before time');
});

test('C-USAGE-LOCAL Q-18 cross-client examples: duplicate fact, different operation, different device, time conflict', async () => {
    const ex = await createUsageLocalCrossClientExamples();
    const input = check('RecordInput'), result = check('RecordResult');
    for (const name of ['duplicateFact', 'differentOperation', 'differentDevice', 'timeMismatchConflict'])
        for (const value of ex[name].inputs) assert.ok(input(value).ok, name);
    const all = [ex.duplicateFact, ex.differentOperation, ex.differentDevice, ex.timeMismatchConflict].flatMap(pair => pair.results).concat(ex.sameBuffer.retry, ex.sameBuffer.timeMismatchConflict, ex.missingOccurredAt.result);
    for (const value of all) assert.ok(result(value).ok, JSON.stringify(value));
    assert.equal(ex.duplicateFact.events[0].deviceId, USAGE_LOCAL_SHARED_DEVICE_FIXTURE);
    assert.match(USAGE_LOCAL_SHARED_DEVICE_FIXTURE, /^[A-Za-z0-9_-]{43}$/);

    const dup = ex.duplicateFact;
    assert.deepEqual(dup.results.map(r => r.disposition), ['recorded', 'recorded'], 'independent buffers each record');
    assert.deepEqual(dup.events[0], dup.events[1], 'same eventId, nonce and content');
    assert.equal(dup.events[0].nonce, usageRecordEventNonce(dup.events[0].eventId));
    assert.equal(dup.digests[0], dup.digests[1]);
    assert.deepEqual(dup.server, ['accepted', 'duplicate']);

    const op = ex.differentOperation;
    assert.notEqual(op.events[0].eventId, op.events[1].eventId);
    assert.notEqual(op.events[0].nonce, op.events[1].nonce);
    assert.deepEqual(op.server, ['accepted', 'accepted']);

    const device = ex.differentDevice;
    assert.notEqual(device.events[0].deviceId, device.events[1].deviceId);
    assert.notEqual(device.events[0].eventId, device.events[1].eventId);
    assert.deepEqual(device.server, ['accepted', 'accepted']);

    const time = ex.timeMismatchConflict;
    assert.equal(time.events[0].eventId, time.events[1].eventId, 'same key keeps the frozen UUIDv5');
    assert.equal(time.events[0].nonce, time.events[1].nonce);
    assert.notEqual(time.digests[0], time.digests[1]);
    assert.deepEqual(time.server, ['accepted', 'USAGE_EVENT_CONFLICT']);

    assert.deepEqual(ex.sameBuffer.retry, [{ disposition: 'recorded', eventId: dup.events[0].eventId }, { disposition: 'duplicate', eventId: dup.events[0].eventId }]);
    assert.deepEqual(ex.sameBuffer.timeMismatchConflict, { disposition: 'rejected', code: 'EVENT_IDENTITY_CONFLICT' });
    assert.equal('occurredAt' in ex.missingOccurredAt.input, false);
    assert.deepEqual(ex.missingOccurredAt.result, { disposition: 'rejected', code: 'INVALID_RECORD_INPUT' });
});
