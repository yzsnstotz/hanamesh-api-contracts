import test from 'node:test';
import assert from 'node:assert/strict';
import {
    CORE_CONTRACT_DEFINITION, CORE_EVENTS, CORE_FIXTURE_LABEL, CORE_REQUIRED_METHODS, CORE_SERVICE_NAME,
    checkCoreService, coreCanonicalRequest, coreHandshakeCases, createCoreConsumerFixture, createCoreContractExamples, createCoreProviderFixture, verifyCoreSignature,
} from '@hanamesh/api-contracts/core';
import { validatorFor } from './schema.mjs';

const schemaUrl = new URL('../contracts/core/schema.json', import.meta.url);
const check = def => validatorFor(schemaUrl, def);

test('C-CORE definition matches the baseline calls and error codes', () => {
    assert.equal(CORE_CONTRACT_DEFINITION.id, 'C-CORE');
    assert.equal(CORE_CONTRACT_DEFINITION.service, CORE_SERVICE_NAME);
    assert.deepEqual(Object.keys(CORE_CONTRACT_DEFINITION.methods).sort(), ['getConsent', 'getDeviceId', 'getServerOrigin', 'getSession', 'signRequest']);
    assert.deepEqual(CORE_CONTRACT_DEFINITION.methods.getConsent.errors, ['CORE_ABSENT', 'CORE_PROTOCOL_UNSUPPORTED', 'CORE_METHOD_MISSING']);
    assert.deepEqual(CORE_CONTRACT_DEFINITION.methods.signRequest.errors, ['CORE_NOT_READY', 'CORE_DEVICE_CORRUPT']);
    for (const name of ['getSession', 'getServerOrigin', 'getDeviceId'])
        assert.deepEqual(CORE_CONTRACT_DEFINITION.methods[name].errors, ['CORE_NOT_READY']);
    assert.ok(CORE_EVENTS.onConsentChange);
    for (const type of Object.values(CORE_CONTRACT_DEFINITION.types))
        assert.ok(type, 'every listed type resolves in the v1 schema');
});

test('C-CORE examples validate against the v1 schema and carry the fixture label', async () => {
    const examples = await createCoreContractExamples();
    assert.equal(examples.label, CORE_FIXTURE_LABEL);
    for (const [def, value] of [['ConsentState', examples.consent], ['DeviceId', examples.deviceId], ['PublicKey', examples.publicKey], ['SessionSnapshot', examples.session], ['ServerOrigin', examples.serverOrigin], ['DeviceAuthHeaders', examples.headers]]) {
        const result = check(def)(value);
        assert.ok(result.ok, `${def}: ${JSON.stringify(result.errors)}`);
    }
    assert.deepEqual(examples.errors.CORE_ABSENT, { status: 'absent', reason: 'CORE_ABSENT' });
    assert.equal(examples.errors.CORE_PROTOCOL_UNSUPPORTED.reason, 'CORE_PROTOCOL_UNSUPPORTED');
    assert.deepEqual(examples.errors.CORE_METHOD_MISSING.missing, ['signRequest']);
    const declared = Object.values(CORE_CONTRACT_DEFINITION.methods).flatMap(method => method.errors);
    assert.deepEqual([...new Set(declared)].sort(), Object.keys(examples.errors).sort(), 'every declared error code has an example');
});

test('C-CORE handshake matrix: the reference consumer classifies all 13 cases as specified', () => {
    const cases = coreHandshakeCases();
    assert.equal(cases.length, 6 + CORE_REQUIRED_METHODS.length);
    assert.equal(cases.length, 13);
    const consumer = createCoreConsumerFixture();
    for (const { id, value, expected } of cases)
        assert.deepEqual(consumer.accept(value), expected, id);
});

test('C-CORE signRequest headers verify against the canonical v1 bytes', async () => {
    const { service } = createCoreProviderFixture();
    const input = { method: 'post', path: '/v1/usage/events?x=1#f', body: new TextEncoder().encode('[1]') };
    const headers = await service.signRequest(input);
    assert.ok(check('DeviceAuthHeaders')(headers).ok);
    const bytes = coreCanonicalRequest(input, headers['x-hm-timestamp'], headers['x-hm-nonce']);
    assert.match(new TextDecoder().decode(bytes), /^POST\|\/v1\/usage\/events\|\d{13,}\|[A-Za-z0-9_-]+\|[0-9a-f]{64}$/);
    assert.ok(verifyCoreSignature(service.getPublicKey(), bytes, Buffer.from(headers['x-hm-signature'], 'base64url')));
    const tampered = coreCanonicalRequest({ ...input, path: '/v1/usage/other' }, headers['x-hm-timestamp'], headers['x-hm-nonce']);
    assert.equal(verifyCoreSignature(service.getPublicKey(), tampered, Buffer.from(headers['x-hm-signature'], 'base64url')), false);
    await assert.rejects(service.signRequest({ method: 'POST', path: 'no-slash', body: null }), /CORE_INPUT_INVALID/);
});

test('C-CORE consumer exercise against the provider fixture, and consent change event', async () => {
    const provider = createCoreProviderFixture({ initialConsent: 'withheld' });
    const observation = await createCoreConsumerFixture().exercise(provider.service);
    assert.deepEqual({ ...observation, handshake: observation.handshake.status }, { handshake: 'present', signatureVerified: true, requestVerified: true, consent: 'withheld', sessionDeviceMatches: true });
    const seen = [];
    const stop = provider.service.onConsentChange((state, changedAt) => seen.push({ state, changedAt }));
    await provider.setConsent('granted');
    stop();
    await provider.setConsent('withheld');
    assert.equal(seen.length, 1);
    assert.equal(seen[0].state, 'granted');
    assert.equal(new Date(seen[0].changedAt).toISOString(), seen[0].changedAt);
    assert.equal(checkCoreService(provider.service).status, 'present');
});
