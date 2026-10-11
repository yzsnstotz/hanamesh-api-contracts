import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
/** Cordis service name under which Usage provides the contract. */
export const USAGE_SERVICE_NAME = 'hanameshUsage';
/** Namespace of the UUIDv5 event identity (hanamesh-usage src/core/pins.ts NS_USAGE). */
export const USAGE_EVENT_NAMESPACE = '6aa7b4d1-88f5-4f96-89e2-cf5ffca77c2d';
export const USAGE_RECORD_CODES = Object.freeze(['INVALID_RECORD_INPUT', 'DEVICE_UNAVAILABLE', 'EVENTS_CAPACITY_REACHED', 'EVENT_IDENTITY_CONFLICT', 'RECORD_FAILED']);
const schema = JSON.parse(readFileSync(new URL('./schema.json', import.meta.url), 'utf8'));
/** Transfer definition taken from hanamesh-usage main 7517d76 (src/host/contracts.d.ts, src/host/record.js, src/host/transport.js).
 * `errors` records the baseline contract; implementationErrors records the codes the current provider actually returns.
 * record never rejects: every refusal is `{disposition:'rejected', code}` (errorChannel 'result').
 */
export const USAGE_LOCAL_CONTRACT_DEFINITION = Object.freeze({
    id: 'C-USAGE-LOCAL',
    service: USAGE_SERVICE_NAME,
    types: Object.freeze(Object.fromEntries(['HanaRef', 'UsageReceipt', 'RecordInput', 'RecordResult', 'HealthSnapshot'].map(name => [name, schema.$defs[name]]))),
    methods: {
        record: {
            input: 'RecordInput', output: 'Promise<RecordResult>',
            errors: ['RECORD_FAILED', 'CORE_UNAVAILABLE', 'EVENT_IDENTITY_CONFLICT'],
            errorChannel: 'result',
            implementationErrors: ['INVALID_RECORD_INPUT', 'DEVICE_UNAVAILABLE', 'EVENTS_CAPACITY_REACHED'],
            note: 'CORE_UNAVAILABLE is baseline-declared but the current provider never returns it: without Core, consent is unknown and record returns disposition withheld before signing; a signer failure after that is mapped to RECORD_FAILED.',
            identity: 'eventId = UUIDv5(USAGE_EVENT_NAMESPACE, JSON.stringify([deviceId, sourcePlugin, idempotencyKey])); the same key with identical content (hanaRef, action, occurredAt, sourceHanaRef, targetRef, receipt) is duplicate, with different content EVENT_IDENTITY_CONFLICT; occurredAt defaults to now, so a retry must resend the original occurredAt',
        },
        health: {
            input: null, output: 'HealthSnapshot',
            errors: ['USAGE_UNAVAILABLE'],
            errorChannel: 'http',
            implementationErrors: [],
            note: 'In process, health() is synchronous and never throws; a missing service is observed as an absent cordis injection. USAGE_UNAVAILABLE is the HTTP route failure: GET /api/hanamesh/usage/health → 503 {error:"USAGE_UNAVAILABLE"}.',
        },
    },
});
function uuidv5(name) {
    const bytes = createHash('sha1').update(Buffer.from(USAGE_EVENT_NAMESPACE.replaceAll('-', ''), 'hex')).update(name, 'utf8').digest().subarray(0, 16);
    bytes[6] = (bytes[6] & 0x0f) | 0x50;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = bytes.toString('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
/** Event identity of a record() call, identical to the provider's eventIdForSeat. */
export function usageRecordEventId(deviceId, sourcePlugin, idempotencyKey) {
    return uuidv5(JSON.stringify([deviceId, sourcePlugin, idempotencyKey]));
}
