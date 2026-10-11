import { createHash, createPublicKey, verify } from 'node:crypto';
import { USAGE_EVENT_ACTIONS } from './contracts.js';
import { UsageError } from './errors.js';
import { deviceId as validDeviceId, timestamp, token } from './validation.js';
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const SIGNATURE = /^[A-Za-z0-9_-]{85}[AQgw]$/;
const HANA_REF = /^(?:[A-Za-z0-9][A-Za-z0-9_.:-]*|@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*)$/;
const SECRET_PREFIX = /^(?:sk-|sk_|bearer[.:-]|ghp_|github_pat_|xox[baprs]-)/i;
const RAW_KEY_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
/** Receipt provider ids are bounded tokens; model names additionally allow `/ @ +` (gateway-style `openai/gpt-4o`). Never free text. */
const PROVIDER_ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/;
const MODEL = /^[A-Za-z0-9][A-Za-z0-9_.:/@+-]{0,127}$/;
const MAX_RECEIPT_COUNT = 2147483647;
function plain(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.getPrototypeOf(input) !== Object.prototype)
        throw new UsageError('USAGE_INPUT_INVALID');
    const descriptors = Object.getOwnPropertyDescriptors(input);
    for (const d of Object.values(descriptors))
        if (!('value' in d) || !d.enumerable)
            throw new UsageError('USAGE_INPUT_INVALID');
    return input;
}
export function canonicalUsageEvent(event) {
    return JSON.stringify({ deviceId: event.deviceId, hanaRef: event.hanaRef, action: event.action, occurredAt: event.occurredAt, eventId: event.eventId, nonce: event.nonce });
}
export function validateUsageEvent(input) {
    const x = plain(input), allowed = ['deviceId', 'hanaRef', 'action', 'occurredAt', 'eventId', 'nonce', 'signature', 'sourceHanaRef', 'targetRef', 'receipt'];
    if (Object.keys(x).some(k => !allowed.includes(k)) || !allowed.slice(0, 7).every(k => Object.hasOwn(x, k)))
        throw new UsageError('USAGE_INPUT_INVALID');
    const deviceId = validDeviceId(x.deviceId), hanaRef = hanaReference(x.hanaRef), occurredAt = timestamp(x.occurredAt), nonce = token(x.nonce, 128);
    if (typeof x.eventId !== 'string' || !UUID.test(x.eventId) || typeof x.action !== 'string' || !USAGE_EVENT_ACTIONS.includes(x.action) || typeof x.signature !== 'string' || !SIGNATURE.test(x.signature))
        throw new UsageError('USAGE_INPUT_INVALID');
    const action = x.action;
    if (Object.hasOwn(x, 'receipt') && action !== 'use')
        throw new UsageError('USAGE_INPUT_INVALID');
    const event = { deviceId, hanaRef, action, occurredAt, eventId: x.eventId.toLowerCase(), nonce, signature: x.signature,
        ...(Object.hasOwn(x, 'sourceHanaRef') ? { sourceHanaRef: hanaReference(x.sourceHanaRef) } : {}), ...(Object.hasOwn(x, 'targetRef') ? { targetRef: token(x.targetRef, 160) } : {}),
        ...(Object.hasOwn(x, 'receipt') ? { receipt: validateReceipt(x.receipt) } : {}) };
    return Object.freeze(event);
}
export function validateReceipt(input) {
    const x = plain(input);
    if (Object.keys(x).sort().join('|') !== 'count|model|providerId')
        throw new UsageError('USAGE_INPUT_INVALID');
    if (typeof x.providerId !== 'string' || !PROVIDER_ID.test(x.providerId) || SECRET_PREFIX.test(x.providerId))
        throw new UsageError('USAGE_INPUT_INVALID');
    if (x.model !== null && (typeof x.model !== 'string' || !MODEL.test(x.model) || SECRET_PREFIX.test(x.model)))
        throw new UsageError('USAGE_INPUT_INVALID');
    if (typeof x.count !== 'number' || !Number.isInteger(x.count) || x.count < 1 || x.count > MAX_RECEIPT_COUNT)
        throw new UsageError('USAGE_INPUT_INVALID');
    return Object.freeze({ providerId: x.providerId, model: x.model, count: x.count });
}
function hanaReference(input) {
    if (typeof input !== 'string' || input.length < 1 || input.length > 160 || !HANA_REF.test(input))
        throw new UsageError('USAGE_INPUT_INVALID');
    const basename = input.startsWith('@') ? input.slice(input.indexOf('/') + 1) : input;
    if (SECRET_PREFIX.test(input) || SECRET_PREFIX.test(basename))
        throw new UsageError('USAGE_INPUT_INVALID');
    return input;
}
export function validateEventBatch(input) {
    if (!Array.isArray(input) || input.length < 1 || input.length > 200)
        throw new UsageError('USAGE_INPUT_INVALID');
    return Object.freeze(input.map(validateUsageEvent));
}
export function eventDigest(event) {
    return createHash('sha256').update(JSON.stringify({ deviceId: event.deviceId, hanaRef: event.hanaRef, action: event.action, occurredAt: event.occurredAt, eventId: event.eventId, nonce: event.nonce,
        ...(event.sourceHanaRef === undefined ? {} : { sourceHanaRef: event.sourceHanaRef }), ...(event.targetRef === undefined ? {} : { targetRef: event.targetRef }),
        ...(event.receipt === undefined ? {} : { receipt: { providerId: event.receipt.providerId, model: event.receipt.model, count: event.receipt.count } }) })).digest('hex');
}
export function verifyEventSignature(event, rawPublicKey) {
    try {
        if (!/^[A-Za-z0-9_-]{43}$/.test(rawPublicKey))
            return false;
        const raw = Buffer.from(rawPublicKey, 'base64url');
        if (raw.length !== 32)
            return false;
        const key = createPublicKey({ key: Buffer.concat([RAW_KEY_PREFIX, raw]), format: 'der', type: 'spki' });
        return verify(null, Buffer.from(canonicalUsageEvent(event)), key, Buffer.from(event.signature, 'base64url'));
    }
    catch {
        return false;
    }
}
export function clockRejection(event, now, retentionDays) {
    const t = Date.parse(event.occurredAt);
    return t < now - retentionDays * 86400000 || t > now + 300000 ? 'USAGE_CLOCK_SKEW' : null;
}
export function validateContributionWindow(input) {
    const x = plain(input);
    if (Object.keys(x).some(k => !['from', 'to'].includes(k)))
        throw new UsageError('USAGE_INPUT_INVALID');
    const from = timestamp(x.from), to = timestamp(x.to);
    if (to <= from)
        throw new UsageError('USAGE_INPUT_INVALID');
    return { from, to };
}
/** Admin receipts window: at most 92 days (three monthly settlement cycles), exact hanaRef. */
export function validateReceiptQuery(input) {
    const x = plain(input);
    if (Object.keys(x).some(k => !['hanaRef', 'from', 'to'].includes(k)))
        throw new UsageError('USAGE_INPUT_INVALID');
    const window = validateContributionWindow({ from: x.from, to: x.to });
    if (Date.parse(window.to) - Date.parse(window.from) > 92 * 86400000)
        throw new UsageError('USAGE_INPUT_INVALID');
    return { ...window, hanaRef: hanaReference(x.hanaRef) };
}
export function validateRawEventQuery(input) {
    const x = plain(input);
    if (Object.keys(x).some(k => !['from', 'to', 'after', 'limit'].includes(k)))
        throw new UsageError('USAGE_INPUT_INVALID');
    const window = validateContributionWindow({ from: x.from, to: x.to });
    const limit = x.limit === undefined ? 50 : x.limit;
    if (Date.parse(window.to) - Date.parse(window.from) > 90 * 86400000)
        throw new UsageError('USAGE_INPUT_INVALID');
    if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > 200)
        throw new UsageError('USAGE_INPUT_INVALID');
    if (x.after !== undefined)
        decodeRawEventCursor(x.after);
    return { ...window, limit, ...(x.after === undefined ? {} : { after: x.after }) };
}
export function encodeRawEventCursor(occurredAt, eventId) { return Buffer.from(`${timestamp(occurredAt)}\n${eventId.toLowerCase()}`, 'utf8').toString('base64url'); }
export function decodeRawEventCursor(input) {
    if (typeof input !== 'string' || !/^[A-Za-z0-9_-]{1,256}$/.test(input))
        throw new UsageError('USAGE_INPUT_INVALID');
    try {
        const decoded = Buffer.from(input, 'base64url').toString('utf8');
        if (Buffer.from(decoded, 'utf8').toString('base64url') !== input)
            throw new Error('non-canonical');
        const [occurredAt, eventId, ...rest] = decoded.split('\n');
        if (rest.length || typeof occurredAt !== 'string' || typeof eventId !== 'string' || !UUID.test(eventId))
            throw new Error('invalid');
        return { occurredAt: timestamp(occurredAt), eventId: eventId.toLowerCase() };
    }
    catch (error) {
        if (error instanceof UsageError)
            throw error;
        throw new UsageError('USAGE_INPUT_INVALID');
    }
}
