import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '@hanamesh/api-contracts/core';
import { validatorFor } from './schema.mjs';

const request = { method: 'post', path: '/v1/usage/events?fixture=1#ignored', body: new TextEncoder().encode('[]') };
const schema = new URL('../contracts/core/schema.json', import.meta.url);

test('FIXTURE: two independent Core providers share one identity and verifiable signatures', async () => {
    assert.equal(typeof core.createCoreSharedIdentityFixture, 'function');
    const shared = core.createCoreSharedIdentityFixture();
    const dsh = shared.createProvider({ initialConsent: 'granted' });
    const desktop = shared.createProvider({ initialConsent: 'withheld' });
    assert.equal(shared.label, core.CORE_FIXTURE_LABEL);
    assert.equal(dsh.label, core.CORE_FIXTURE_LABEL);
    assert.equal(desktop.label, core.CORE_FIXTURE_LABEL);
    assert.notEqual(dsh.service, desktop.service);
    assert.equal(dsh.identity().source, 'created');
    assert.equal(desktop.identity().source, 'adopted');
    assert.equal(dsh.service.getDeviceId(), desktop.service.getDeviceId());
    assert.equal(dsh.service.getPublicKey(), desktop.service.getPublicKey());
    await dsh.setConsent('withheld');
    await desktop.setConsent('granted');
    assert.equal(dsh.service.getConsent(), 'withheld');
    assert.equal(desktop.service.getConsent(), 'granted');
    const bytes = new TextEncoder().encode('FIXTURE shared identity');
    for (const provider of [dsh, desktop]) {
        assert.ok(core.verifyCoreSignature(desktop.service.getPublicKey(), bytes, provider.service.sign(bytes)));
        const headers = await provider.service.signRequest(request);
        assert.ok(validatorFor(schema, 'DeviceAuthHeaders')(headers).ok);
        assert.equal(headers['x-hm-device-id'], desktop.service.getDeviceId());
        const canonical = core.coreCanonicalRequest(request, headers['x-hm-timestamp'], headers['x-hm-nonce']);
        assert.ok(core.verifyCoreSignature(dsh.service.getPublicKey(), canonical, Buffer.from(headers['x-hm-signature'], 'base64url')));
        assert.equal(core.verifyCoreSignature(dsh.service.getPublicKey(), new Uint8Array([0]), Buffer.from(headers['x-hm-signature'], 'base64url')), false);
        assert.ok(validatorFor(schema, 'SessionSnapshot')(provider.service.getSession()).ok);
        assert.equal(core.checkCoreService(provider.service).status, 'present');
        assert.deepEqual(Object.keys(provider.service).sort(), Object.keys(core.createCoreProviderFixture().service).sort());
    }
});

test('FIXTURE: concurrent first claims converge; existing identity and conflict follow the shared winner', async () => {
    assert.equal(typeof core.createCoreSharedIdentityFixture, 'function');
    const local = core.createCoreProviderFixture({ deviceId: 'device_FIXTURE_existing' }).service;
    const old = core.createCoreProviderFixture({ deviceId: 'device_FIXTURE_replaced' }).service;
    const registeredOld = { ...old, getSession: () => ({ ...old.getSession(), registration: 'registered', principalId: 'p_FIXTURE', bound: true }) };
    const shared = core.createCoreSharedIdentityFixture();
    const [first, second] = await Promise.all([
        Promise.resolve().then(() => shared.createProvider({ existingIdentity: local })),
        Promise.resolve().then(() => shared.createProvider({ existingIdentity: registeredOld })),
    ]);
    assert.equal(first.identity().source, 'migrated');
    assert.equal(second.identity().source, 'conflict');
    assert.equal(second.service.getDeviceId(), local.getDeviceId());
    assert.equal(second.service.getPublicKey(), local.getPublicKey());
    assert.deepEqual(second.identity().replacedDeviceIds, [old.getDeviceId()]);
    assert.equal(second.service.getSession().registration, 'unregistered');
    assert.equal(second.service.getSession().principalId, null);
    assert.equal(second.service.getSession().bound, null);
    assert.equal(old.getDeviceId(), 'device_FIXTURE_replaced');
    assert.ok(core.verifyCoreSignature(old.getPublicKey(), request.body, old.sign(request.body)));
    assert.equal(shared.createProvider({ existingIdentity: local }).identity().source, 'existing');
    assert.equal(shared.createProvider().identity().source, 'adopted');
});

for (const reason of ['CORE_DEVICE_STORE_UNAVAILABLE', 'CORE_DEVICE_CORRUPT']) {
    test(`FIXTURE: ${reason} fails closed and explicit refresh recovers the same identity`, async () => {
        assert.equal(typeof core.createCoreSharedIdentityFixture, 'function');
        const shared = core.createCoreSharedIdentityFixture();
        const winner = shared.createProvider();
        const id = winner.service.getDeviceId(), key = winner.service.getPublicKey();
        shared.setFailure(reason);
        const failed = shared.createProvider();
        assert.equal(failed.identity().status, 'failed');
        assert.equal(failed.identity().reason, reason);
        assert.deepEqual(failed.identity().replacedDeviceIds, []);
        assert.equal(core.checkCoreService(failed.service).status, 'present', 'handshake is shape compatibility, not readiness');
        const notReady = error => error.code === 'CORE_NOT_READY' && error.status === 503;
        for (const method of ['getDeviceId', 'getPublicKey', 'getSession'])
            assert.throws(() => failed.service[method](), notReady);
        assert.throws(() => failed.service.sign(request.body), notReady);
        await assert.rejects(failed.service.signRequest(request), notReady);
        assert.equal(failed.service.getConsent(), 'withheld');
        assert.equal(failed.service.getServerOrigin(), null);
        await failed.refresh();
        assert.equal(failed.identity().status, 'failed', 'refresh does not hide an unrepaired failure');
        shared.repair();
        assert.throws(() => failed.service.getDeviceId(), notReady, 'repair requires explicit refresh of the failed client');
        await failed.refresh();
        assert.equal(failed.identity().source, 'adopted');
        assert.equal(failed.service.getDeviceId(), id);
        assert.equal(failed.service.getPublicKey(), key);
        assert.ok(core.verifyCoreSignature(key, request.body, failed.service.sign(request.body)));
        assert.equal(shared.createProvider().service.getPublicKey(), key, 'no replacement key was created');
    });
}

test('FIXTURE: shared identity examples contain schema-valid data and verifiable signatures', async () => {
    assert.equal(typeof core.createCoreSharedIdentityExamples, 'function');
    const examples = await core.createCoreSharedIdentityExamples();
    assert.equal(examples.label, core.CORE_FIXTURE_LABEL);
    assert.equal(examples.dsh.deviceId, examples.desktop.deviceId);
    assert.equal(examples.dsh.publicKey, examples.desktop.publicKey);
    for (const client of [examples.dsh, examples.desktop]) {
        assert.ok(validatorFor(schema, 'DeviceId')(client.deviceId).ok);
        assert.ok(validatorFor(schema, 'PublicKey')(client.publicKey).ok);
        assert.ok(validatorFor(schema, 'DeviceAuthHeaders')(client.headers).ok);
        assert.ok(core.verifyCoreSignature(client.publicKey, examples.request.body, client.signature));
        assert.ok(core.verifyCoreSignature(client.publicKey, core.coreCanonicalRequest(examples.request, client.headers['x-hm-timestamp'], client.headers['x-hm-nonce']), Buffer.from(client.headers['x-hm-signature'], 'base64url')));
    }
    assert.deepEqual(examples.failure, { reason: 'CORE_DEVICE_CORRUPT', code: 'CORE_NOT_READY', status: 503 });
    assert.equal(JSON.stringify(examples).includes('privateKey'), false);
});

test('FIXTURE: a failed first resolution preserves the existing local identity and registration', async () => {
    const original = core.createCoreProviderFixture({ deviceId: 'device_FIXTURE_local' }).service;
    const local = { ...original, getSession: () => ({ ...original.getSession(), registration: 'registered', principalId: 'p_FIXTURE', bound: true }) };
    const shared = core.createCoreSharedIdentityFixture();
    shared.setFailure('CORE_DEVICE_CORRUPT');
    const failed = shared.createProvider({ existingIdentity: local });
    assert.equal(failed.identity().status, 'failed');
    assert.throws(() => failed.service.sign(request.body), { code: 'CORE_NOT_READY', status: 503 });
    shared.repair();
    await failed.refresh();
    assert.equal(failed.identity().source, 'migrated', 'failure never claimed a replacement shared identity');
    assert.equal(failed.service.getPublicKey(), local.getPublicKey());
    assert.equal(failed.service.getSession().registration, 'registered', 'failure did not reset the old registration');
    assert.equal(failed.service.getSession().principalId, 'p_FIXTURE');
    assert.equal(failed.service.getSession().bound, true);
    assert.deepEqual(failed.identity().replacedDeviceIds, []);
});

test('FIXTURE: concurrent empty clients converge while distinct resolved roots stay independent', async () => {
    const shared = core.createCoreSharedIdentityFixture();
    const providers = await Promise.all(Array.from({ length: 6 }, () => Promise.resolve().then(() => shared.createProvider())));
    assert.deepEqual(providers.map(provider => provider.identity().source), ['created', ...Array(5).fill('adopted')]);
    assert.equal(new Set(providers.map(provider => provider.service.getDeviceId())).size, 1);
    assert.equal(new Set(providers.map(provider => provider.service.getPublicKey())).size, 1);
    const other = core.createCoreSharedIdentityFixture().createProvider();
    assert.notEqual(other.service.getPublicKey(), providers[0].service.getPublicKey());
    assert.equal(core.verifyCoreSignature(other.service.getPublicKey(), request.body, providers[0].service.sign(request.body)), false);
});
