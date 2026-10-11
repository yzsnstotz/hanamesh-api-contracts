const messages = {
    USAGE_INPUT_INVALID: 'Invalid usage summary or query.', USAGE_CONFIG_INVALID: 'Invalid usage module configuration.',
    USAGE_IDENTITY_REQUIRED: 'Identity service is required.', USAGE_AUTH_REQUIRED: 'Authentication is required.',
    USAGE_FORBIDDEN: 'This operation is not permitted.', USAGE_IDENTITY_UNAVAILABLE: 'Identity service is unavailable.',
    USAGE_NOT_FOUND: 'Summary not found.', USAGE_EVENT_CONFLICT: 'Event reference already has different content.',
    USAGE_STORAGE_UNAVAILABLE: 'Usage storage is unavailable.', USAGE_SCHEMA_MISSING: 'Usage schema is not ready.',
    USAGE_ROLE_UNSAFE: 'Usage runtime database role is unsafe.', USAGE_ORIGIN_REJECTED: 'Origin is not allowed.',
    USAGE_MEDIA_TYPE_REJECTED: 'JSON content type is required.', USAGE_RATE_LIMITED: 'Too many requests.',
    USAGE_NONCE_REUSED: 'Device nonce was already used.', USAGE_SIGNATURE_INVALID: 'Event signature is invalid.',
    USAGE_DEVICE_MISMATCH: 'Authenticated device does not match the event device.', USAGE_CLOCK_SKEW: 'Event timestamp is outside the accepted window.',
    USAGE_DEVICE_REVOKED: 'Device is revoked.', USAGE_EVENT_HOOK_FAILED: 'The host rejected the accepted usage events; the batch was rolled back.'
};
const statuses = {
    USAGE_INPUT_INVALID: 400, USAGE_AUTH_REQUIRED: 401, USAGE_FORBIDDEN: 403, USAGE_NOT_FOUND: 404,
    USAGE_EVENT_CONFLICT: 409, USAGE_ORIGIN_REJECTED: 403, USAGE_MEDIA_TYPE_REJECTED: 415, USAGE_RATE_LIMITED: 429,
    USAGE_NONCE_REUSED: 409, USAGE_SIGNATURE_INVALID: 401, USAGE_DEVICE_MISMATCH: 403, USAGE_CLOCK_SKEW: 400, USAGE_DEVICE_REVOKED: 401, USAGE_EVENT_HOOK_FAILED: 503
};
export class UsageError extends Error {
    code;
    statusCode;
    constructor(code) { super(messages[code]); this.name = 'UsageError'; this.code = code; this.statusCode = statuses[code] ?? 503; }
}
export function errorResponse(error) {
    const e = error instanceof UsageError ? error : new UsageError('USAGE_STORAGE_UNAVAILABLE');
    return { status: e.statusCode, body: { error: { code: e.code, message: e.message } } };
}
export function identityError(error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    if (code === 'AUTH_REQUIRED' || code === 'IDENTITY_AUTH_FAILED' || code === 'IDENTITY_DEVICE_REVOKED' || code === 'IDENTITY_DEVICE_SIGNATURE_INVALID' || code === 'IDENTITY_DEVICE_REPLAY' || code === 'IDENTITY_DEVICE_AUTH_INVALID')
        return new UsageError('USAGE_AUTH_REQUIRED');
    if (code === 'AUTH_FORBIDDEN')
        return new UsageError('USAGE_FORBIDDEN');
    return new UsageError('USAGE_IDENTITY_UNAVAILABLE');
}
