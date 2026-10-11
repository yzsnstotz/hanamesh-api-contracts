import { createHash } from 'node:crypto';
import { usageRecordEventId, usageRecordEventNonce } from './definition.js';
import { eventDigest } from '../usage/events.js';
/** Every fixture carries this label so no screen, log or report can mistake it for the product provider. */
export const USAGE_LOCAL_FIXTURE_LABEL = 'FIXTURE · hanamesh-usage local contract (not the product provider)';
const hana = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i;
const secretLike = /(?:sk-|ghp_|github_pat_|xox[baprs]-|eyJ|bearer|private.?key|password|secret|api.?key)/i;
const validHana = value => typeof value === 'string' && value.length <= 128 && hana.test(value) && !/(?:sk-|ghp_|secret|password|api.?key)/i.test(value);
const validKey = value => typeof value === 'string' && value.length > 0 && value.length <= 160 && /^[A-Za-z0-9][A-Za-z0-9._:@/+\-]*$/.test(value) && !secretLike.test(value);
const validTarget = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,159}$/.test(value) && !secretLike.test(value);
const validReceipt = value => value !== null && typeof value === 'object' && Object.keys(value).sort().join('|') === 'count|model|providerId'
    && typeof value.providerId === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/.test(value.providerId)
    && (value.model === null || (typeof value.model === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:/@+-]{0,127}$/.test(value.model)))
    && Number.isSafeInteger(value.count) && value.count >= 1 && value.count <= 2147483647;
const INPUT_KEYS = ['hanaRef', 'action', 'occurredAt', 'idempotencyKey', 'sourcePlugin', 'sourceHanaRef', 'targetRef', 'receipt'];
/** In-memory provider of hanameshUsage.record/health for consumers (app-host) to test against. No storage, no upload, no signing. */
export function createUsageLocalProviderFixture(options = {}) {
    let consent = options.consent ?? 'granted';
    let core = options.core ?? 'present';
    const deviceId = options.deviceId === undefined ? 'device_CONTRACT_FIXTURE' : options.deviceId;
    const maxEvents = options.maxEvents ?? 1000;
    const now = options.now ?? Date.now;
    const events = new Map();
    const wire = [];
    const failures = {};
    const reject = code => { failures[code] = (failures[code] ?? 0) + 1; return { disposition: 'rejected', code }; };
    const service = Object.freeze({
        async record(input) {
            if (consent !== 'granted' || core !== 'present')
                return { disposition: 'withheld' };
            if (input === null || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !INPUT_KEYS.includes(key)))
                return reject('INVALID_RECORD_INPUT');
            const { hanaRef, action, idempotencyKey, sourcePlugin } = input;
            const sourceHanaRef = input.sourceHanaRef ?? null, targetRef = input.targetRef ?? null, receipt = input.receipt ?? null;
            if (!validHana(hanaRef) || !['open', 'use'].includes(action) || !validKey(idempotencyKey) || !validHana(sourcePlugin)
                || (sourceHanaRef !== null && !validHana(sourceHanaRef)) || (targetRef !== null && !validTarget(targetRef)) || (receipt !== null && (action !== 'use' || !validReceipt(receipt))))
                return reject('INVALID_RECORD_INPUT');
            if (deviceId === null)
                return reject('DEVICE_UNAVAILABLE');
            // Q-18: the source supplies the original fact time; never default to now.
            if (typeof input.occurredAt !== 'string')
                return reject('INVALID_RECORD_INPUT');
            const current = now();
            const occurredAt = input.occurredAt;
            const time = Date.parse(occurredAt);
            if (!Number.isFinite(time) || new Date(time).toISOString() !== occurredAt || time < current - 90 * 24 * 60 * 60 * 1000 || time > current + 5 * 60 * 1000)
                return reject('INVALID_RECORD_INPUT');
            const eventId = usageRecordEventId(deviceId, sourcePlugin, idempotencyKey);
            const identity = JSON.stringify([hanaRef, action, occurredAt, sourceHanaRef, targetRef, receipt === null ? null : [receipt.providerId, receipt.model, receipt.count]]);
            const existing = events.get(eventId);
            if (existing !== undefined)
                return existing === identity ? { disposition: 'duplicate', eventId } : reject('EVENT_IDENTITY_CONFLICT');
            if (events.size >= maxEvents)
                return reject('EVENTS_CAPACITY_REACHED');
            events.set(eventId, identity);
            wire.push(Object.freeze({ deviceId, hanaRef, action, occurredAt, eventId, nonce: usageRecordEventNonce(eventId),
                ...(sourceHanaRef === null ? {} : { sourceHanaRef }), ...(targetRef === null ? {} : { targetRef }),
                ...(receipt === null ? {} : { receipt: Object.freeze({ providerId: receipt.providerId, model: receipt.model, count: receipt.count }) }) }));
            return { disposition: 'recorded', eventId };
        },
        health() {
            return {
                pending: 0, recoveryComplete: true, failures: { ...failures },
                consent: core === 'present' ? consent : 'unknown', core, deviceId: core === 'present' ? deviceId : null,
                outbox: { state: core === 'present' && consent === 'granted' ? 'idle' : 'stopped', pending: events.size, sent: 0, duplicate: 0, rejected: 0, lastUploadAt: null, nextAttemptAt: null, lastError: null },
                derive: { skipped: { consentWithheld: 0, executorUnavailable: 0, timeUnavailable: 0, noDevice: 0 } },
                withdrawal: null,
                inventory: { available: false, source: 'none', lastScanAt: null, detail: null },
            };
        },
    });
    return {
        label: USAGE_LOCAL_FIXTURE_LABEL,
        service,
        setConsent(state) { consent = state; },
        setCore(status) { core = status; },
        /** Unsigned upload projection of recorded events (provider wireEvent without signature), in record order. */
        uploadEvents() { return [...wire]; },
    };
}
/** Sample data for every documented outcome, produced by the fixture provider. */
export async function createUsageLocalContractExamples() {
    const at = Date.parse('2026-10-11T00:00:00.000Z');
    const { service, setCore } = createUsageLocalProviderFixture({ now: () => at, maxEvents: 2 });
    const input = { hanaRef: '@hanamesh/example-app', action: 'open', occurredAt: '2026-10-11T00:00:00.000Z', idempotencyKey: 'page:fixture-1', sourcePlugin: '@hanamesh/dsh-app-host' };
    const recorded = await service.record(input);
    const duplicate = await service.record(input);
    const conflict = await service.record({ ...input, action: 'use' });
    const invalid = await service.record({ ...input, hanaRef: 'not a package' });
    await service.record({ ...input, idempotencyKey: 'page:fixture-2' });
    const capacity = await service.record({ ...input, idempotencyKey: 'page:fixture-3' });
    const noDevice = await createUsageLocalProviderFixture({ now: () => at, deviceId: null }).service.record(input);
    const health = service.health();
    setCore('absent');
    const withheld = await service.record(input);
    return {
        label: USAGE_LOCAL_FIXTURE_LABEL,
        input,
        results: { recorded, duplicate, withheld, EVENT_IDENTITY_CONFLICT: conflict, INVALID_RECORD_INPUT: invalid, EVENTS_CAPACITY_REACHED: capacity, DEVICE_UNAVAILABLE: noDevice, RECORD_FAILED: { disposition: 'rejected', code: 'RECORD_FAILED' } },
        health,
        healthCoreAbsent: service.health(),
        http: { USAGE_UNAVAILABLE: { status: 503, body: { error: 'USAGE_UNAVAILABLE' } } },
    };
}
/** Synthetic 43-char base64url device id standing for one C-CORE shared identity; not a registered device. */
export const USAGE_LOCAL_SHARED_DEVICE_FIXTURE = createHash('sha256').update('hanamesh-api-contracts:usage-local:shared-device-fixture').digest('base64url');
const OTHER_DEVICE_FIXTURE = createHash('sha256').update('hanamesh-api-contracts:usage-local:other-device-fixture').digest('base64url');
/** Q-18 examples: two independent buffers (clients) on the same shared device delivering source facts.
 * `server` is the C-USAGE outcome implied by its precedence (same id + same digest => duplicate; same id + different digest => USAGE_EVENT_CONFLICT). */
export async function createUsageLocalCrossClientExamples() {
    const at = Date.parse('2026-10-11T00:00:05.000Z');
    const client = deviceId => createUsageLocalProviderFixture({ now: () => at, deviceId });
    const fact = { hanaRef: '@hanamesh/example-app', action: 'use', occurredAt: '2026-10-11T00:00:00.000Z', idempotencyKey: 'command:source-operation-1:succeeded', sourcePlugin: '@hanamesh/example-app', targetRef: 'source-operation-1', receipt: { providerId: 'fixture', model: null, count: 1 } };
    const pair = async (inputA, inputB, deviceB = USAGE_LOCAL_SHARED_DEVICE_FIXTURE) => {
        const a = client(USAGE_LOCAL_SHARED_DEVICE_FIXTURE), b = client(deviceB);
        const resultA = await a.service.record(inputA), resultB = await b.service.record(inputB);
        const [eventA] = a.uploadEvents(), [eventB] = b.uploadEvents();
        const sameId = eventA.eventId === eventB.eventId && eventA.deviceId === eventB.deviceId;
        const server = !sameId ? ['accepted', 'accepted'] : eventDigest(eventA) === eventDigest(eventB) ? ['accepted', 'duplicate'] : ['accepted', 'USAGE_EVENT_CONFLICT'];
        return { inputs: [inputA, inputB], results: [resultA, resultB], events: [eventA, eventB], digests: [eventDigest(eventA), eventDigest(eventB)], server };
    };
    const sameBuffer = client(USAGE_LOCAL_SHARED_DEVICE_FIXTURE);
    const retry = [await sameBuffer.service.record(fact), await sameBuffer.service.record(structuredClone(fact))];
    const localTimeConflict = await sameBuffer.service.record({ ...fact, occurredAt: '2026-10-11T00:00:05.000Z' });
    const { occurredAt, ...missing } = fact;
    return {
        label: USAGE_LOCAL_FIXTURE_LABEL,
        fact,
        duplicateFact: await pair(fact, structuredClone(fact)),
        differentOperation: await pair(fact, { ...fact, idempotencyKey: 'command:source-operation-2:succeeded', targetRef: 'source-operation-2' }),
        differentDevice: await pair(fact, structuredClone(fact), OTHER_DEVICE_FIXTURE),
        timeMismatchConflict: await pair(fact, { ...fact, occurredAt: '2026-10-11T00:00:05.000Z' }),
        sameBuffer: { retry, timeMismatchConflict: localTimeConflict },
        missingOccurredAt: { input: missing, result: await client(USAGE_LOCAL_SHARED_DEVICE_FIXTURE).service.record(missing) },
    };
}
