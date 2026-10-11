import {USAGE_ERRORS} from './contracts.js';
import {UsageError} from './errors.js';
const common = ['USAGE_AUTH_REQUIRED','USAGE_FORBIDDEN','USAGE_IDENTITY_REQUIRED','USAGE_IDENTITY_UNAVAILABLE','USAGE_STORAGE_UNAVAILABLE','USAGE_RATE_LIMITED'];
export const USAGE_CONTRACT_DEFINITION = Object.freeze({
    id:'C-USAGE',provider:'server-usage',protocolVersion:'1',
    calls:Object.freeze({
        ingestEvents:Object.freeze({method:'POST',path:'/v1/usage/events',input:'UsageEventBatch (bare array, 1..200)',output:'IngestBatchResult',status:200,
            errors:Object.freeze([...common,'USAGE_INPUT_INVALID','USAGE_DEVICE_MISMATCH','USAGE_SIGNATURE_INVALID','USAGE_DEVICE_REVOKED','USAGE_EVENT_HOOK_FAILED','USAGE_ORIGIN_REJECTED','USAGE_MEDIA_TYPE_REJECTED']),
            rejectionCodes:Object.freeze(['USAGE_INPUT_INVALID','USAGE_CLOCK_SKEW','USAGE_EVENT_CONFLICT','USAGE_NONCE_REUSED']),
            note:'Per-item rejections retain HTTP 200; invalid batch, event signature, revoked device or mismatched device fail the entire request. Invalid items are collected before clock/digest rejections. Body <=65536 bytes; overflow = 413 USAGE_INPUT_INVALID. Only committed results may cross HTTP.'}),
        withdrawEvents:Object.freeze({method:'DELETE',path:'/v1/usage/me/devices/:deviceId/events',input:'no body',output:'WithdrawResult {deletedEvents}',status:200,
            errors:Object.freeze([...common,'USAGE_INPUT_INVALID','USAGE_DEVICE_MISMATCH','USAGE_ORIGIN_REJECTED','USAGE_MEDIA_TYPE_REJECTED']),
            note:'Same signed device or cookie-bound account only; removes owned raw events, records withdrawal, leaves prior daily rollups intact. Service has durability; wire omits it.'}),
        getContributions:Object.freeze({method:'GET',path:'/v1/usage/me/contributions',input:'ContributionWindow query {from,to}',output:'EligibilityContribution',status:200,
            errors:Object.freeze([...common,'USAGE_INPUT_INVALID']),
            note:'Explicit inclusive from/exclusive to; to > from, no 31/90-day maximum here. Signed device sees only its principal; cookie account includes linked devices. account is optional GitHub display metadata.'})
    }),
    idempotency:Object.freeze({scope:'(deploymentId, deviceId, eventId)',nonceScope:'(deploymentId, deviceId, nonce)',
        digest:'sha256hex(JSON.stringify({deviceId,hanaRef,action,occurredAt,eventId,nonce,...optional sourceHanaRef,targetRef,receipt:{providerId,model,count}})) in exactly that order; signature excluded',
        precedence:'same id + same digest => duplicate; same id + different digest => USAGE_EVENT_CONFLICT; otherwise nonce used by another event => USAGE_NONCE_REUSED',
        retry:'Keep the original event including eventId, occurredAt, event nonce and signed content. Generate a fresh HTTP authentication nonce/timestamp/signature on every request; changing event nonce changes digest and conflicts.'}),
    authentication:Object.freeze({eventSignature:'ed25519 UTF-8 JSON.stringify({deviceId,hanaRef,action,occurredAt,eventId,nonce}) in that order. Optional fields are unsigned but digest-covered.',
        httpSignature:'ed25519 METHOD|route path without query|timestamp milliseconds|request nonce|sha256hex(raw body bytes). GET/standard DELETE body is empty.',
        replay:'IDENTITY_DEVICE_REPLAY from C-IDENTITY authenticateDevice is mapped by Usage to HTTP 401 USAGE_AUTH_REQUIRED; it is not a Usage wire error code. Original HTTP request cannot yield duplicate.',
        mutations:'POST and DELETE require allowed Origin; POST requires application/json; empty DELETE may omit Content-Type.'}),
    errors:Object.freeze(Object.fromEntries(USAGE_ERRORS.map(code=>{const error=new UsageError(code);return [code,{status:error.statusCode,body:{error:{code,message:error.message}}}];})))
});
export function usageWithdrawWire(result) { return {deletedEvents:result.deletedEvents}; }
