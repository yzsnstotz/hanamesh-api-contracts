import { readFileSync } from 'node:fs';

/** Profile-only C-CATALOG from J3S4-REG-01, server-registry origin/main 5dcb5ee. */
export const REGISTRY_PROTOCOL_VERSION = '1';
export const HANA_PROFILE_SOURCES = Object.freeze(['awesome', '1024store', 'hanamesh']);
export const HANA_PROFILE_KINDS = Object.freeze(['interface', 'compute']);
/** Status and message pairs for errors relevant to the profile calls, not unrelated release APIs. */
export const CATALOG_ERRORS = Object.freeze({
    REGISTRY_INPUT_INVALID: Object.freeze([400, 'Invalid registry input']),
    REGISTRY_AUTH_REQUIRED: Object.freeze([401, 'Indexer authentication is required']),
    REGISTRY_FORBIDDEN: Object.freeze([403, 'Registry operation is not permitted']),
    REGISTRY_NOT_FOUND: Object.freeze([404, 'Registry resource not found']),
    REGISTRY_HOST_TRANSACTION_REQUIRED: Object.freeze([500, 'A host transaction executor is required']),
    REGISTRY_HANA_ALREADY_OWNED: Object.freeze([409, 'The Hana profile already has an owner']),
    REGISTRY_UNAVAILABLE: Object.freeze([503, 'Registry dependency is unavailable']),
    REGISTRY_ORIGIN_REJECTED: Object.freeze([403, 'Request origin is not permitted']),
});
/** Match provider failures by code, rather than this package's separate error constructor. */
export class RegistryError extends Error {
    constructor(code, statusCode = 400) {
        super(CATALOG_ERRORS[code][1]);
        this.name = 'RegistryError';
        this.code = code;
        this.statusCode = statusCode;
    }
}

const schema = JSON.parse(readFileSync(new URL('./schema.json', import.meta.url), 'utf8'));
const call = (from, kind, at, input, output, errors, baselineErrors, note) => Object.freeze({
    from: Object.freeze(from), kind, at: Object.freeze(at), input, output,
    errors: Object.freeze(errors), baselineErrors: Object.freeze(baselineErrors),
    errorChannel: kind === 'http' ? 'HTTP status + RegistryErrorResponse' : 'rejected Promise; error.code and error.statusCode',
    implemented: true, note,
});
export const CATALOG_CONTRACT_DEFINITION = Object.freeze({
    id: 'C-CATALOG', provider: 'server-registry', protocolVersion: REGISTRY_PROTOCOL_VERSION,
    source: 'J3S4-REG-01; hanamesh-server-registry origin/main 5dcb5eed1f446c155ef9488a72452a3afb3b6195; provenance.json pins the source files',
    types: Object.freeze(schema.$defs),
    calls: Object.freeze({
        httpGet: call(['web-market', 'core'], 'http', ['GET /v1/registry/hanas/:hanaId'],
            'hanaId: string (lowercase UUID)', 'HanaProfileDTO',
            ['REGISTRY_NOT_FOUND', 'REGISTRY_INPUT_INVALID', 'REGISTRY_UNAVAILABLE'], ['REGISTRY_NOT_FOUND'],
            'Public read, no authentication. Missing UUID is 404; malformed UUID is 400. Unexpected dependency failures become REGISTRY_UNAVAILABLE (503) at the HTTP adapter.'),
        httpList: call(['web-market', 'core'], 'http', ['GET /v1/registry/hanas'],
            'HanaProfileQuery as URL query; claimed="true"|"false", limit=decimal digits', 'HanaProfilePage',
            ['REGISTRY_INPUT_INVALID', 'REGISTRY_UNAVAILABLE'], [],
            'Additional existing provider route. The adapter converts claimed and limit to the service boolean/integer; it does not return a bare array.'),
        httpUpsert: call(['server-indexer'], 'http', ['POST /v1/registry/hanas'],
            'UpsertHanaProfileInput + session cookie + trusted Origin + application/json', '{created: boolean, profile: HanaProfileDTO}',
            ['REGISTRY_INPUT_INVALID', 'REGISTRY_AUTH_REQUIRED', 'REGISTRY_FORBIDDEN', 'REGISTRY_ORIGIN_REJECTED', 'REGISTRY_UNAVAILABLE'], [],
            'Additional existing provider route. 201 for created, 200 for updated; wire body has created and profile, with no disposition/durability. Host policy grants writes only for literal true. Injected policy may propagate Identity errors through the HTTP adapter; these codes are not an exhaustive catch union.'),
        upsertHanaProfile: call(['server-indexer'], 'service', ['upsertHanaProfile'],
            '(subject: RegistryIndexerSubject, input: UpsertHanaProfileInput, context?: WriteContext)', 'Promise<UpsertHanaProfileResult>',
            ['REGISTRY_INPUT_INVALID', 'REGISTRY_AUTH_REQUIRED', 'REGISTRY_FORBIDDEN'], ['REGISTRY_INPUT_INVALID', 'REGISTRY_IDENTITY_CONFLICT'],
            'Baseline NormalizedHanaInput is the provider UpsertHanaProfileInput. Stable identity is (sourceId, sourceRef); updates preserve hanaId and ownerPrincipalId. REGISTRY_IDENTITY_CONFLICT is not raised by profile upsert (it belongs to publisher/package creation). Indexer cannot inject an owner. No executor: committed; host executor: pending-host-commit. Injected policy/storage may propagate other failures; service codes are not exhaustive.'),
        listHanaProfiles: call(['server-indexer'], 'service', ['listHanaProfiles'],
            '(query?: HanaProfileQuery)', 'Promise<HanaProfilePage>',
            ['REGISTRY_INPUT_INVALID'], ['REGISTRY_INPUT_INVALID', 'REGISTRY_IDENTITY_CONFLICT'],
            'Baseline groups list and upsert together. Actual list accepts filters, not NormalizedHanaInput, returns {items,next}, and does not raise REGISTRY_IDENTITY_CONFLICT. Default limit 20, range 1..100; UUID ascending cursor. Storage can propagate other failures.'),
        getHanaProfile: call(['server-claim'], 'service', ['getHanaProfile'],
            '(hanaId: string)', 'Promise<HanaProfileDTO>',
            ['REGISTRY_NOT_FOUND', 'REGISTRY_INPUT_INVALID'], ['REGISTRY_NOT_FOUND'],
            'DTO includes githubRepo:string|null. Missing profile rejects with 404, never null. Storage can propagate other failures.'),
        assignHanaOwner: call(['server-host'], 'service', ['assignHanaOwner'],
            '(hanaId: string, principalId: string, context?: WriteContext)', 'Promise<AssignHanaOwnerResult>',
            ['REGISTRY_INPUT_INVALID', 'REGISTRY_HOST_TRANSACTION_REQUIRED', 'REGISTRY_NOT_FOUND', 'REGISTRY_HANA_ALREADY_OWNED'], ['REGISTRY_HANA_ALREADY_OWNED', 'REGISTRY_HOST_TRANSACTION_REQUIRED'],
            'Server-only trusted port, no HTTP owner-write route. Despite optional syntax, context.executor is required at runtime (500). Host supplies verified principalId and owns commit/rollback; result is always pending-host-commit. Any existing owner, including the same principal, rejects (409). IDs are validated before the transaction check. Storage may propagate other failures.'),
    }),
});
