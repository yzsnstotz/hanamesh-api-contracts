import { UsageError } from './errors.js';
const TOKEN = /^[A-Za-z0-9][A-Za-z0-9_.:-]*$/;
const VERSION = /^[A-Za-z0-9][A-Za-z0-9_.:+-]*$/;
const SECRET_PREFIX = /^(?:sk-|sk_|bearer[.:-]|ghp_|github_pat_|xox[baprs]-)/i;
const DEVICE_ID = /^[A-Za-z0-9_-]{43}$/;
function invalid() { throw new UsageError('USAGE_INPUT_INVALID'); }
export function token(input, max = 128) {
    if (typeof input !== 'string' || input.length < 1 || input.length > max || !TOKEN.test(input) || SECRET_PREFIX.test(input))
        return invalid();
    return input;
}
export function deviceId(input) {
    if (typeof input !== 'string' || !DEVICE_ID.test(input))
        return invalid();
    return input;
}
export function timestamp(input) {
    if (typeof input !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(input))
        return invalid();
    const value = Date.parse(input);
    if (!Number.isFinite(value) || new Date(value).toISOString() !== input || value < 0)
        return invalid();
    return input;
}
