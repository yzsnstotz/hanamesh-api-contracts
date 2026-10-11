import { readFileSync } from 'node:fs';
/** Handshake and error table copied from hanamesh-server-identity origin/main ffe1ae5 (src/contract.ts, src/contracts.ts, src/core/errors.ts). */
export const IDENTITY_PROVIDER_PACKAGE = '@hanamesh/server-identity';
/** Protocol the provider declares. Package semver (0.3.x) and protocol major ('1') are independent. */
export const IDENTITY_PROTOCOL_VERSION = '1';
export const IDENTITY_SUPPORTED_PROTOCOL_VERSIONS = Object.freeze([IDENTITY_PROTOCOL_VERSION]);
/** Response header every Identity HTTP route sets. */
export const IDENTITY_PROTOCOL_HEADER = 'x-hanamesh-identity-protocol';
export const IDENTITY_ERRORS = Object.freeze({
    AUTH_REQUIRED: [401, 'Authentication required'],
    AUTH_FORBIDDEN: [403, 'Access denied'],
    AUTH_UNAVAILABLE: [503, 'Authentication temporarily unavailable'],
    IDENTITY_NOT_READY: [503, 'Identity service is not ready'],
    IDENTITY_INPUT_INVALID: [400, 'Invalid request'],
    IDENTITY_CONFIG_INVALID: [500, 'Invalid identity configuration'],
    IDENTITY_NOT_FOUND: [404, 'Resource not found'],
    IDENTITY_ORIGIN_REJECTED: [403, 'Origin rejected'],
    IDENTITY_RATE_LIMITED: [429, 'Too many authentication attempts'],
    IDENTITY_AUTH_FAILED: [401, 'Authentication failed'],
    IDENTITY_DEPLOYMENT_MISMATCH: [503, 'Identity deployment configuration does not match this database'],
    DB_SCHEMA_MISSING: [503, 'Identity database schema is unavailable; authorized deployment is required'],
    DB_ROLE_UNSAFE: [503, 'Identity runtime database role is unsafe'],
    GITHUB_NO_RELATION: [403, 'GitHub account has no qualifying repository relation'],
    GITHUB_API_UNAVAILABLE: [503, 'GitHub API is temporarily unavailable'],
    GITHUB_TOKEN_INVALID: [401, 'GitHub authorization must be renewed'],
    IDENTITY_DEVICE_SIGNATURE_INVALID: [401, 'Device signature is invalid'],
    IDENTITY_DEVICE_REVOKED: [401, 'Device is revoked'],
    IDENTITY_DEVICE_REPLAY: [401, 'Device nonce was already used'],
    IDENTITY_DEVICE_ALREADY_BOUND: [409, 'Device is already bound'],
    EMAIL_TOKEN_INVALID: [400, 'Email verification link is invalid'],
    EMAIL_TOKEN_EXPIRED: [410, 'Email verification link has expired'],
    EMAIL_TOKEN_USED: [409, 'Email verification link was already used'],
    EMAIL_ALREADY_BOUND: [409, 'Email is already bound to another account'],
    EMAIL_DELIVERY_FAILED: [503, 'Email could not be sent'],
    IDENTITY_BIND_HOOK_FAILED: [503, 'Device binding was rolled back by the host'],
    IDENTITY_WALLET_CHALLENGE_INVALID: [400, 'Wallet challenge is invalid or expired'],
    IDENTITY_WALLET_SIGNATURE_INVALID: [401, 'Wallet signature is invalid'],
    IDENTITY_WALLET_REPLAY: [409, 'Wallet challenge was already used'],
    IDENTITY_WALLET_ALREADY_BOUND: [409, 'Wallet or account already has a different binding'],
    IDENTITY_GITHUB_ALREADY_LINKED: [409, 'This account already has a linked GitHub identity'],
    IDENTITY_GITHUB_LAST_LOGIN: [409, 'GitHub is the only sign-in method for this account'],
});
export const IDENTITY_ERROR_CODES = Object.freeze(Object.keys(IDENTITY_ERRORS));
/** What the provider throws from a service call. Match on `code`, not `instanceof`: the provider's own class is a different constructor. */
export class IdentityError extends Error {
    constructor(code) {
        super(IDENTITY_ERRORS[code][1]);
        this.name = 'IdentityError';
        this.code = code;
        this.statusCode = IDENTITY_ERRORS[code][0];
    }
    toJSON() { return { error: { code: this.code, message: this.message } }; }
}
export function isIdentityError(value) {
    return typeof value === 'object' && value !== null && typeof value.code === 'string' && Object.hasOwn(IDENTITY_ERRORS, value.code) && typeof value.statusCode === 'number';
}

/** Required `IdentityServices` members. Root methods are listed under `''`. */
export const IDENTITY_SERVICES_REQUIRED = Object.freeze({
    '': Object.freeze(['authenticate', 'authorize', 'updateOwnProfile']),
    deviceRegistration: Object.freeze(['createChallenge', 'registerDevice']),
    deviceAuth: Object.freeze(['authenticateDevice', 'getDevicePublicKey']),
    principalLinks: Object.freeze(['bindDevice', 'resolveCanonical', 'listDevices']),
    githubProof: Object.freeze(['verifyRepositoryOwnership']),
    wallets: Object.freeze(['createChallenge', 'bindWallet', 'listOwnBindings', 'getBinding']),
});
/** Optional members: absent is fine; present means every listed method must be a function. */
export const IDENTITY_SERVICES_OPTIONAL = Object.freeze({
    email: Object.freeze(['requestVerification', 'getStatus', 'verifyToken']),
});
const isObject = value => typeof value === 'object' && value !== null;
function missingMethods(record, member, methods) {
    if (member === '')
        return methods.filter(name => typeof record[name] !== 'function');
    const target = record[member];
    if (!isObject(target))
        return [member];
    return methods.filter(name => typeof target[name] !== 'function').map(name => `${member}.${name}`);
}
/**
 * Consumer-side handshake on an `IdentityServices` value. `accept` lists the protocol versions the consumer implements.
 * Fixed order (absent → not an object → protocol → required members → malformed optional members), one result per input,
 * nothing coerced: an undeclared `protocolVersion` is rejected, not assumed to be `'1'`.
 */
export function checkIdentityServices(value, accept = IDENTITY_SUPPORTED_PROTOCOL_VERSIONS) {
    if (value === undefined || value === null)
        return { status: 'absent', reason: 'IDENTITY_SERVICES_ABSENT' };
    if (!isObject(value))
        return { status: 'incompatible', reason: 'IDENTITY_SERVICES_NOT_OBJECT' };
    const provided = value.protocolVersion;
    if (typeof provided !== 'string' || !accept.includes(provided))
        return { status: 'incompatible', reason: 'IDENTITY_PROTOCOL_UNSUPPORTED', provided: typeof provided === 'string' ? provided : null, supported: [...accept] };
    const missing = Object.entries(IDENTITY_SERVICES_REQUIRED).flatMap(([member, methods]) => missingMethods(value, member, methods));
    for (const [member, methods] of Object.entries(IDENTITY_SERVICES_OPTIONAL))
        if (value[member] !== undefined)
            missing.push(...missingMethods(value, member, methods));
    if (missing.length > 0)
        return { status: 'incompatible', reason: 'IDENTITY_SERVICE_MEMBER_MISSING', missing };
    const optional = Object.keys(IDENTITY_SERVICES_OPTIONAL).filter(member => value[member] !== undefined);
    return { status: 'present', protocolVersion: provided, optional };
}
/** HTTP consumers: the declared protocol from a response's headers, checked against what the consumer implements. */
export function checkIdentityProtocolHeader(headerValue, accept = IDENTITY_SUPPORTED_PROTOCOL_VERSIONS) {
    if (typeof headerValue === 'string' && accept.includes(headerValue))
        return { ok: true, protocolVersion: headerValue };
    return { ok: false, reason: 'IDENTITY_PROTOCOL_UNSUPPORTED', provided: typeof headerValue === 'string' ? headerValue : null, supported: [...accept] };
}

const schema = JSON.parse(readFileSync(new URL('./schema.json', import.meta.url), 'utf8'));
const MUTATION = 'Every POST/PATCH also answers IDENTITY_ORIGIN_REJECTED (untrusted Origin) and IDENTITY_INPUT_INVALID (wrong Content-Type, unknown body key, framework 400/413/415).';
const call = (from, kind, at, input, output, errors, baselineErrors, note, extra = {}) =>
    Object.freeze({ from, kind, at: Object.freeze(at), input, output, errors: Object.freeze(errors), baselineErrors: Object.freeze(baselineErrors), implemented: true, note, ...extra });
/**
 * C-IDENTITY as the provider is today (hanamesh-server-identity origin/main ffe1ae5; port facts verified at f0cb96c by J2S1-IDENT-01).
 * One entry per baseline call. `errors` are the codes the provider actually returns on that call; `baselineErrors` is what the abstract
 * baseline listed; every difference is explained in `note`. A service call may additionally throw AUTH_UNAVAILABLE for any unexpected
 * internal failure (provider safeError): arbitrary exception text never leaves the provider.
 */
export const IDENTITY_CONTRACT_DEFINITION = Object.freeze({
    id: 'C-IDENTITY',
    provider: 'server-identity',
    source: 'hanamesh-server-identity origin/main ffe1ae5 (src/contracts.ts, src/server-contracts.ts, src/contract.ts, src/contract-fixtures.ts, src/http/plugin.ts, src/devices/service.ts, src/wallets/service.ts, contract/hanamesh-server-identity.v1.schema.json); wire and port sources identical to f0cb96c verified by J2S1-IDENT-01',
    protocolVersion: IDENTITY_PROTOCOL_VERSION,
    types: Object.freeze(schema.$defs),
    calls: Object.freeze({
        deviceRegister: call('core', 'http', ['POST /v1/identity/devices/challenge', 'POST /v1/identity/devices'],
            'challenge: DeviceChallengeInput {purpose:"register"} → register: DeviceRegisterInput {publicKey, nonce, signature, label?}',
            'challenge: 200 DeviceChallengeDTO {nonce, expiresAt} → register: 201 DeviceRegisterResponse (new device) | 200 DeviceRegisterResponse (same public key again)',
            ['IDENTITY_INPUT_INVALID', 'IDENTITY_ORIGIN_REJECTED', 'IDENTITY_DEVICE_SIGNATURE_INVALID', 'IDENTITY_DEVICE_REPLAY'],
            ['IDENTITY_DEVICE_SIGNATURE_INVALID', 'IDENTITY_DEVICE_REPLAY', 'IDENTITY_RATE_LIMITED'],
            `Two steps, no auth. The wire response has NO \`created\` field: 201 means a new device, 200 means the same public key re-registered (idempotent, new challenge each time); \`created\` exists only on the service result DeviceRegistrationResult. signature = ed25519(UTF-8 nonce + publicKey); deviceId = base64url(sha256(raw 32-byte key)). A used, expired or wrong-purpose challenge is IDENTITY_DEVICE_REPLAY. There is no rate limit on device challenge or registration, so IDENTITY_RATE_LIMITED is never returned here (429 comes only from the sign-in bridge and GitHub link). ${MUTATION}`),
        githubSignIn: call('web-market', 'http', ['POST /api/auth/sign-in/social', 'GET /api/auth/callback/github', 'GET /v1/identity/me'],
            'SocialSignInInput {provider:"github", callbackURL, errorCallbackURL?}; then the session cookie',
            '200 RedirectResponse {url, redirect:true} → 302 callback sets the session cookie → 200 MeResponse {principal}',
            ['AUTH_REQUIRED', 'AUTH_UNAVAILABLE', 'IDENTITY_AUTH_FAILED', 'IDENTITY_RATE_LIMITED', 'IDENTITY_ORIGIN_REJECTED', 'IDENTITY_INPUT_INVALID'],
            ['AUTH_REQUIRED', 'AUTH_UNAVAILABLE'],
            `GET /v1/identity/me also accepts device-signed requests (X-HM-* headers). Callback failures redirect to errorCallbackURL with a public error string (e.g. account_already_linked_to_different_user, github_already_linked) instead of a JSON error. ${MUTATION}`),
        deviceBind: call('web-market', 'http', ['POST /v1/identity/devices/challenge', 'POST /v1/identity/me/devices/bind'],
            'challenge: DeviceChallengeInput {purpose:"bind"} → DeviceBindInput {deviceId, nonce, signature} with the session cookie',
            '201 BindingDTO {deviceId, accountPrincipalId, method, linkedAt} (service: BindingWriteResult adds commitState)',
            ['AUTH_REQUIRED', 'IDENTITY_DEVICE_ALREADY_BOUND', 'IDENTITY_DEVICE_SIGNATURE_INVALID', 'IDENTITY_BIND_HOOK_FAILED', 'IDENTITY_INPUT_INVALID', 'IDENTITY_ORIGIN_REJECTED'],
            ['AUTH_REQUIRED', 'IDENTITY_DEVICE_ALREADY_BOUND', 'IDENTITY_DEVICE_SIGNATURE_INVALID', 'IDENTITY_BIND_HOOK_FAILED'],
            `signature = ed25519(nonce) of a purpose:"bind" challenge. A used/expired/wrong-purpose bind challenge is IDENTITY_INPUT_INVALID (not REPLAY). The OnDeviceBound hook runs in the same transaction; a throw rolls back and answers IDENTITY_BIND_HOOK_FAILED. ${MUTATION}`),
        walletBind: call('web-market', 'http', ['POST /v1/identity/me/wallets/challenge', 'POST /v1/identity/me/wallets/bind'],
            'step 1: WalletChallengeInput {chainId, address} → step 2: WalletBindInput {nonce, signature}; both with the session cookie',
            'step 1: 201 WalletChallengeDTO (includes the exact SIWE `message` to sign) → step 2: 201 WalletBindResponse {binding, created:true} | 200 {binding, created:false}',
            ['AUTH_REQUIRED', 'AUTH_FORBIDDEN', 'IDENTITY_INPUT_INVALID', 'IDENTITY_ORIGIN_REJECTED', 'IDENTITY_WALLET_CHALLENGE_INVALID', 'IDENTITY_WALLET_SIGNATURE_INVALID', 'IDENTITY_WALLET_REPLAY', 'IDENTITY_WALLET_ALREADY_BOUND'],
            ['IDENTITY_WALLET_SIGNATURE_INVALID', 'IDENTITY_WALLET_REPLAY', 'IDENTITY_WALLET_ALREADY_BOUND'],
            `Two steps, not one {chainId,address,signature} call. Sign the returned \`message\` exactly (EIP-191 personal_sign); never rebuild it client-side. The bind result is {binding, created}, not a bare WalletBindingDTO. One normalized wallet per principal and one principal per wallet across all chains of a deployment; the same pair may prove several chains. A challenge issued to another principal is AUTH_FORBIDDEN. ${MUTATION}`),
        walletSignIn: Object.freeze({ ...call('web-market', 'http', ['POST /api/auth/siwe/nonce', 'POST /api/auth/siwe/verify'],
            '{chainId, address, message, signature} (SIWE)', 'session + current account', [],
            ['IDENTITY_WALLET_SIGNATURE_INVALID', 'IDENTITY_WALLET_REPLAY', 'AUTH_UNAVAILABLE'],
            'NOT IMPLEMENTED by the provider: there is no SIWE sign-in route; wallet signatures only bind a wallet to an already signed-in account and never create a session (provider docs/API.md). Do not substitute walletBind for sign-in.'),
        implemented: false, followUp: 'J4S1-IDENT-02' }),
        authenticateDevice: call('server-usage', 'service', ['deviceAuth.authenticateDevice'],
            'DeviceAuthRequest {method, path, bodyHash, headers} with x-hm-device-id / x-hm-timestamp / x-hm-nonce / x-hm-signature',
            'Promise<VerifiedActor> (device principal, scopes ["identity:device"])',
            ['IDENTITY_DEVICE_SIGNATURE_INVALID', 'IDENTITY_DEVICE_REVOKED', 'IDENTITY_DEVICE_REPLAY', 'IDENTITY_INPUT_INVALID'],
            ['IDENTITY_DEVICE_SIGNATURE_INVALID', 'IDENTITY_DEVICE_REVOKED', 'IDENTITY_DEVICE_REPLAY'],
            'Signed string METHOD|PATH|TIMESTAMP|NONCE|hex(sha256(body)); timestamp = Unix ms without leading zeros within ±300 s; nonce 16–128 base64url chars, single use; signature 64-byte ed25519 base64url. Missing/malformed headers, unknown device and stale timestamp are all IDENTITY_DEVICE_SIGNATURE_INVALID (401). Malformed bodyHash/method/path is IDENTITY_INPUT_INVALID (400).'),
        custodyAuthenticateResolve: call('server-custody', 'service', ['authenticate', 'principalLinks.resolveCanonical'],
            'authenticate(SessionCredentials {cookie?}) / resolveCanonical(principalId: string)',
            'Promise<VerifiedActor> / Promise<PrincipalResolution {canonicalPrincipalId, linkedDevicePrincipalIds, account?}>',
            ['AUTH_REQUIRED', 'AUTH_UNAVAILABLE', 'IDENTITY_NOT_READY'],
            ['AUTH_REQUIRED', 'IDENTITY_NOT_FOUND'],
            'authenticate accepts only the session cookie, never a principal claimed in Authorization or a body. resolveCanonical does NOT check existence: an unknown principalId (or an account/device with no link) resolves to itself, {canonicalPrincipalId: <input>, linkedDevicePrincipalIds: []}. IDENTITY_NOT_FOUND is never returned; a consumer that must reject unknown principals has to establish existence itself (e.g. via an authenticated actor).'),
        githubProof: call('server-claim', 'service', ['githubProof.verifyRepositoryOwnership'],
            '(actor: VerifiedActor, {owner, repo}) — the actor is a required positional argument',
            'Promise<GithubOwnershipProofDTO {relation, checkedAt, githubUserId, repo, evidence}>',
            ['GITHUB_TOKEN_INVALID', 'GITHUB_API_UNAVAILABLE', 'IDENTITY_INPUT_INVALID', 'AUTH_REQUIRED', 'IDENTITY_GITHUB_ALREADY_LINKED'],
            ['GITHUB_NO_RELATION', 'GITHUB_API_UNAVAILABLE', 'GITHUB_TOKEN_INVALID'],
            'No relation is the result relation:"none", not an error: GITHUB_NO_RELATION is never thrown, the consumer decides whether to refuse. Since ffe1ae5 (D-15, unreleased after 0.3.2) the GitHub identity is taken from the account the principal resolves to (GitHub sign-up or explicit link); a principal with no GitHub is GITHUB_TOKEN_INVALID; two different GitHub ids on one principal is IDENTITY_GITHUB_ALREADY_LINKED (409). In 0.3.2 only GitHub sign-up principals were found.',
            { followUp: 'J3S3-IDENT-03' }),
        registryAuthenticate: call('server-registry', 'service', ['authenticate'],
            'SessionCredentials {cookie?}', 'Promise<VerifiedActor>',
            ['AUTH_REQUIRED', 'AUTH_UNAVAILABLE', 'IDENTITY_NOT_READY'], ['AUTH_REQUIRED'],
            'AUTH_REQUIRED (401) for no, unknown or expired session; AUTH_UNAVAILABLE (503) when the session store cannot be read; IDENTITY_NOT_READY (503) after the provider module was closed.'),
        hostGetBinding: call('server-host', 'service', ['wallets.getBinding'],
            '({principalId, chainId}, context?: WriteContext) — principalId must be a verified canonical principal, never a client claim',
            'Promise<WalletBindingDTO | null>',
            ['IDENTITY_INPUT_INVALID', 'AUTH_UNAVAILABLE'],
            ['IDENTITY_NOT_FOUND'],
            'No binding → null, including an unknown but well-formed principalId: the provider does not check principal existence, and IDENTITY_NOT_FOUND is never returned. Malformed principalId or a chainId that is not a positive safe integer → IDENTITY_INPUT_INVALID; storage failure → AUTH_UNAVAILABLE. A binding is ownership proof only, never authority to claim, withdraw or broadcast.'),
    }),
    events: Object.freeze({
        onDeviceBound: Object.freeze({
            to: 'server-host',
            payload: 'DeviceBoundEvent {deviceId, principalId (account/canonical), devicePrincipalId, deploymentId}, plus WriteContext {executor} of the binding transaction',
            delivery: 'createIdentityModule({onDeviceBound}) hook, awaited inside the binding transaction after principal_link is written; a throw rolls the binding back and the caller gets IDENTITY_BIND_HOOK_FAILED (503). The host forwards it to custody.onDeviceBound.',
        }),
    }),
    limits: Object.freeze({
        deviceRegistrationRateLimit: null,
        note: 'The provider has no rate limit on POST /v1/identity/devices/challenge or POST /v1/identity/devices. IDENTITY_RATE_LIMITED (429, Retry-After: 60) exists only on the email/password sign-in bridge, GitHub link and email verification requests.',
    }),
});
