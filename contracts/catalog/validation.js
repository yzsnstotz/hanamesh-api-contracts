/** Profile validators extracted from server-registry 5dcb5ee; TS syntax erased only. */
import { HANA_PROFILE_KINDS, HANA_PROFILE_SOURCES, RegistryError } from './definition.js';
function invalid() { throw new RegistryError('REGISTRY_INPUT_INVALID'); }
export function record(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value)))
        return invalid();
    return value;
}
export function keys(value, allowed, required = allowed) {
    if (Object.keys(value).some(k => !allowed.includes(k)) || required.some(k => !Object.hasOwn(value, k)))
        invalid();
}
export function text(value, max = 120, min = 1) {
    if (typeof value !== 'string' || value.length < min || value.length > max || value !== value.trim() || value !== value.normalize('NFC') || /[\x00-\x1f\x7f]/u.test(value))
        return invalid();
    return value;
}
export function id(value) { const v = text(value, 36); if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v))
    return invalid(); return v; }
function choice(value, options) { if (typeof value !== 'string' || !options.includes(value))
    return invalid(); return value; }
export function hanaProfileInput(value) {
    const o = record(value);
    keys(o, ['sourceId', 'sourceRef', 'displayName', 'kind', 'githubRepo', 'homepage', 'indexedAt']);
    const sourceId = choice(o.sourceId, HANA_PROFILE_SOURCES), kind = choice(o.kind, HANA_PROFILE_KINDS);
    const githubRepo = o.githubRepo === null ? null : text(o.githubRepo, 255);
    if (githubRepo !== null && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(githubRepo))
        return invalid();
    const indexedAt = text(o.indexedAt, 35);
    const indexedDate = new Date(indexedAt);
    if (!Number.isFinite(indexedDate.getTime()))
        return invalid();
    return { sourceId, sourceRef: text(o.sourceRef, 255), displayName: text(o.displayName, 120), kind, githubRepo, homepage: o.homepage === null ? null : text(o.homepage, 2048), indexedAt: indexedDate.toISOString() };
}
export function hanaProfileQuery(value) {
    const o = record(value);
    keys(o, ['search', 'sourceId', 'kind', 'claimed', 'after', 'limit'], []);
    if (o.claimed !== undefined && typeof o.claimed !== 'boolean')
        return invalid();
    if (o.limit !== undefined && (!Number.isInteger(o.limit) || Number(o.limit) < 1 || Number(o.limit) > 100))
        return invalid();
    return { ...(o.search === undefined ? {} : { search: text(o.search, 120) }), ...(o.sourceId === undefined ? {} : { sourceId: choice(o.sourceId, HANA_PROFILE_SOURCES) }), ...(o.kind === undefined ? {} : { kind: choice(o.kind, HANA_PROFILE_KINDS) }), ...(o.claimed === undefined ? {} : { claimed: o.claimed }), ...(o.after === undefined ? {} : { after: id(o.after) }), ...(o.limit === undefined ? {} : { limit: Number(o.limit) }) };
}
