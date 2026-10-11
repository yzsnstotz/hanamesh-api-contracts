import test from 'node:test';
import assert from 'node:assert/strict';
import {
    USAGE_LOCAL_CONTRACT_DEFINITION, USAGE_LOCAL_FIXTURE_LABEL, USAGE_RECORD_CODES, USAGE_SERVICE_NAME,
    createUsageLocalContractExamples, createUsageLocalProviderFixture, usageRecordEventId,
} from '@hanamesh/api-contracts/usage-local';
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
    const base = { hanaRef: '@hanamesh/a', action: 'open', idempotencyKey: 'k:1', sourcePlugin: '@hanamesh/dsh-app-host' };
    assert.ok(input(base).ok);
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
    const input = { hanaRef: '@hanamesh/a', action: 'use', idempotencyKey: 'command:c1:succeeded', sourcePlugin: '@hanamesh/a', receipt: { providerId: 'deepseek', model: null, count: 1 } };
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
