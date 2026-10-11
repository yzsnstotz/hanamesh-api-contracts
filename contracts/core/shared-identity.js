import { randomBytes } from 'node:crypto';
import { CORE_FIXTURE_LABEL, createCoreProviderFixture } from './fixtures.js';

/** FIXTURE only: models one resolved shared root in memory, never opens a home or credential file.
 * Controls live on the fixture, never on the protocol-v1 service. This is not a filesystem implementation.
 */
export function createCoreSharedIdentityFixture() {
    let sharedIdentity = null;
    let failure = null;
    return Object.freeze({
        label: CORE_FIXTURE_LABEL,
        setFailure(reason) {
            if (!['CORE_DEVICE_STORE_UNAVAILABLE', 'CORE_DEVICE_CORRUPT'].includes(reason))
                throw new TypeError('Unknown FIXTURE identity failure');
            failure = reason;
        },
        repair() { failure = null; },
        createProvider(options = {}) {
            const base = createCoreProviderFixture({ ...options, deviceId: `device_FIXTURE_${randomBytes(8).toString('hex')}` });
            let localIdentity = options.existingIdentity ?? null;
            let session = localIdentity?.getSession() ?? base.service.getSession();
            const replaced = []; // Keep old signing handles private; never expose private key material.
            let resolved = null;
            let observation;
            const resolve = () => {
                if (failure !== null) {
                    resolved = null;
                    observation = { status: 'failed', source: null, reason: failure };
                    return; // No shared claim, local replacement or registration reset on failure.
                }
                let source;
                if (sharedIdentity === null) {
                    sharedIdentity = localIdentity ?? base.service;
                    source = localIdentity === null ? 'created' : 'migrated';
                } else if (localIdentity === null) {
                    source = 'adopted';
                } else if (localIdentity.getDeviceId() === sharedIdentity.getDeviceId() && localIdentity.getPublicKey() === sharedIdentity.getPublicKey()) {
                    source = 'existing';
                } else {
                    source = 'conflict';
                    replaced.push(localIdentity);
                    session = base.service.getSession(); // Old registration belongs to the replaced key.
                }
                resolved = sharedIdentity;
                localIdentity = sharedIdentity;
                observation = { status: 'shared', source, reason: null };
            };
            const ready = () => {
                if (resolved === null)
                    throw Object.assign(new Error('CORE_NOT_READY'), { code: 'CORE_NOT_READY', status: 503 });
                return resolved;
            };
            resolve();
            const service = Object.freeze({
                ...base.service,
                getDeviceId: () => ready().getDeviceId(),
                getPublicKey: () => ready().getPublicKey(),
                sign: bytes => ready().sign(bytes),
                async signRequest(input) { return ready().signRequest(input); },
                getSession: () => Object.freeze({ ...session, deviceId: ready().getDeviceId() }),
            });
            return Object.freeze({
                label: CORE_FIXTURE_LABEL,
                service,
                setConsent: base.setConsent,
                identity: () => Object.freeze({ ...observation, replacedDeviceIds: Object.freeze(replaced.map(identity => identity.getDeviceId())) }),
                async refresh() { if (observation.status === 'failed') resolve(); },
            });
        },
    });
}

/** FIXTURE sample data: two independent clients, one public identity, verifiable signatures and readiness failure. */
export async function createCoreSharedIdentityExamples() {
    const shared = createCoreSharedIdentityFixture();
    const dsh = shared.createProvider(), desktop = shared.createProvider();
    const request = { method: 'POST', path: '/v1/usage/events?fixture=1', body: new TextEncoder().encode('[]') };
    const sample = async provider => ({
        deviceId: provider.service.getDeviceId(), publicKey: provider.service.getPublicKey(),
        signature: provider.service.sign(request.body), headers: await provider.service.signRequest(request),
    });
    const examples = { label: CORE_FIXTURE_LABEL, request, dsh: await sample(dsh), desktop: await sample(desktop) };
    shared.setFailure('CORE_DEVICE_CORRUPT');
    const failed = shared.createProvider();
    try { failed.service.getDeviceId(); }
    catch (error) { examples.failure = { reason: failed.identity().reason, code: error.code, status: error.status }; }
    return examples;
}
