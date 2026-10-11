/** Port of hanamesh-server-identity origin/main ffe1ae5 src/contract-fixtures.ts. Every value here is FIXTURE: in-memory, synthetic, never the product provider. */
import { createHash, createPublicKey, generateKeyPairSync, randomBytes, randomUUID, sign as signBytes, verify } from 'node:crypto';
import { IDENTITY_ERROR_CODES, IDENTITY_PROTOCOL_VERSION, IdentityError, checkIdentityServices } from './definition.js';

export const IDENTITY_FIXTURE_LABEL = 'FIXTURE · C-IDENTITY (@hanamesh/server-identity contract v1) · in-memory synthetic data, not the product provider';

/** viem is an optional peer: only wallets.createChallenge/bindWallet of the fixture need it (SIWE message + EIP-191 recovery). */
let viem;
async function loadViem() {
    if (viem)
        return viem;
    try {
        const [core, siwe] = await Promise.all([import('viem'), import('viem/siwe')]);
        viem = { getAddress: core.getAddress, verifyMessage: core.verifyMessage, createSiweMessage: siwe.createSiweMessage };
        return viem;
    }
    catch (error) {
        throw new Error('C-IDENTITY FIXTURE wallets.createChallenge/bindWallet need the optional peer dependency viem (provider uses viem 2.54.2); install it in the consumer to exercise wallet binding. wallets.getBinding/listOwnBindings work without it.', { cause: error });
    }
}

/** ed25519 device key with the encodings the contract uses. */
export function createIdentityDeviceKey() {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    const raw = String(publicKey.export({ format: 'jwk' }).x);
    return Object.freeze({ publicKey: raw, deviceId: createHash('sha256').update(Buffer.from(raw, 'base64url')).digest('base64url'),
        sign: message => signBytes(null, Buffer.from(message), privateKey).toString('base64url') });
}
/** The four X-HM-* headers for a device-authenticated request (`METHOD|PATH|TIMESTAMP|NONCE|hex(sha256(body))`). */
export function identityDeviceRequestHeaders(key, input, now = Date.now()) {
    const nonce = randomBytes(24).toString('base64url'), timestamp = String(now);
    const bodyHash = createHash('sha256').update(input.body ?? '').digest('hex');
    return { 'x-hm-device-id': key.deviceId, 'x-hm-timestamp': timestamp, 'x-hm-nonce': nonce,
        'x-hm-signature': key.sign(`${input.method.toUpperCase()}|${input.path}|${timestamp}|${nonce}|${bodyHash}`) };
}
/** How the provider's HTTP route turns a registerDevice service result into the wire: status 201/200 from `created`, body without `created`/`actor`/`commitState`. */
export function identityDeviceRegisterWire(result) {
    return { status: result.created ? 201 : 200, body: { deviceId: result.deviceId, principalId: result.principalId, ...(result.label ? { label: result.label } : {}) } };
}
/** Wallet step 2 on the wire: 201 when created, 200 when the same pair was already proved on this chain. */
export function identityWalletBindWire(result) {
    return { status: result.created ? 201 : 200, body: { binding: result.binding, created: result.created } };
}

const fail = code => { throw new IdentityError(code); };
const validSignature = (publicKey, message, signature) => {
    try {
        const raw = Buffer.from(publicKey, 'base64url'), sig = Buffer.from(signature, 'base64url');
        if (raw.length !== 32 || raw.toString('base64url') !== publicKey || sig.length !== 64 || sig.toString('base64url') !== signature)
            return false;
        return verify(null, Buffer.from(message), createPublicKey({ key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), raw]), format: 'der', type: 'spki' }), sig);
    }
    catch {
        return false;
    }
};
const LABEL_LIMITS = { hostname: 64, os: 32, shell: 48 };
function fixtureLabel(value) {
    if (value === undefined)
        return undefined;
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return fail('IDENTITY_INPUT_INVALID');
    if (Object.keys(value).some(key => !(key in LABEL_LIMITS)))
        return fail('IDENTITY_INPUT_INVALID');
    const out = {};
    for (const [key, limit] of Object.entries(LABEL_LIMITS)) {
        const raw = value[key];
        if (typeof raw !== 'string')
            return fail('IDENTITY_INPUT_INVALID');
        const trimmed = raw.trim();
        if (trimmed.length < 1 || trimmed.length > limit || /[\u0000-\u001f\u007f]/u.test(trimmed))
            return fail('IDENTITY_INPUT_INVALID');
        out[key] = trimmed;
    }
    return Object.freeze(out);
}

/**
 * In-memory provider fixture: a complete `IdentityServices` for consumer tests. Same rejection codes as the product provider on the
 * paths the provider's own suite checks. GitHub proof always answers GITHUB_TOKEN_INVALID (fixture accounts never signed in through
 * GitHub). `options.email: false` omits the optional email member.
 */
export function createIdentityServicesFixture(options = {}) {
    const deploymentId = options.deploymentId ?? 'fixture-deployment', baseURL = options.baseURL ?? 'http://127.0.0.1:1';
    const now = options.now ?? Date.now, iso = ms => new Date(ms).toISOString();
    const accounts = new Map(), minted = new WeakSet();
    const challenges = new Map(), devices = new Map(), authNonces = new Set(), links = new Map();
    const walletChallenges = new Map(), wallets = [], emails = new Map();
    const accountScopes = Object.freeze(['identity:read:self', 'identity:update:self']);

    const addAccount = (displayName = 'FIXTURE account') => {
        const cookie = `hm-identity-fixture=${randomBytes(16).toString('hex')}`;
        accounts.set(cookie, Object.freeze({ principalId: randomUUID(), deploymentId, displayName, scopes: accountScopes }));
        return Object.freeze({ cookie });
    };
    const mint = principal => { const actor = Object.freeze({ principal }); minted.add(actor); return actor; };
    const account = actor => {
        if (!actor || typeof actor !== 'object' || !minted.has(actor))
            return fail('AUTH_REQUIRED');
        if (!actor.principal.scopes.includes('identity:update:self'))
            return fail('AUTH_REQUIRED');
        return actor.principal;
    };
    const authenticate = async (credentials) => {
        const principal = typeof credentials?.cookie === 'string' ? accounts.get(credentials.cookie) : undefined;
        return principal ? mint(principal) : fail('AUTH_REQUIRED');
    };
    const committed = context => context ? 'pending-host-commit' : 'committed';
    const devicePrincipal = principalId => Object.freeze({ principalId, deploymentId, displayName: 'HanaMesh device', scopes: Object.freeze(['identity:device']) });
    const takeChallenge = (nonce, purpose) => {
        const row = challenges.get(nonce);
        if (!row || row.used || row.purpose !== purpose || row.expiresAt <= now())
            return false;
        row.used = true;
        return true;
    };

    const services = {
        protocolVersion: IDENTITY_PROTOCOL_VERSION,
        authenticate,
        async authorize(credentials, request) {
            const actor = await authenticate(credentials);
            const resource = await request.loadResource(actor.principal);
            if (resource === null)
                return fail('IDENTITY_NOT_FOUND');
            if (await request.policy({ principal: actor.principal, resource, action: request.action }) !== true)
                return fail('AUTH_FORBIDDEN');
            return { actor, resource };
        },
        async updateOwnProfile(actor, input, context) {
            const principal = account(actor);
            const name = typeof input?.displayName === 'string' ? input.displayName.trim() : '';
            if (name.length < 1 || name.length > 120 || /[\u0000-\u001f\u007f]/u.test(name))
                return fail('IDENTITY_INPUT_INVALID');
            const next = Object.freeze({ ...principal, displayName: name });
            for (const [cookie, p] of accounts)
                if (p.principalId === principal.principalId)
                    accounts.set(cookie, next);
            return Object.freeze({ ...next, commitState: committed(context) });
        },
        deviceRegistration: {
            async createChallenge(purpose, deviceId, context) {
                if ((purpose !== 'register' && purpose !== 'bind') || deviceId !== undefined)
                    return fail('IDENTITY_INPUT_INVALID');
                const nonce = randomBytes(32).toString('base64url'), expiresAt = now() + 300_000;
                challenges.set(nonce, { purpose, expiresAt, used: false });
                return Object.freeze({ nonce, expiresAt: iso(expiresAt), commitState: committed(context) });
            },
            async registerDevice(input, context) {
                const publicKey = input?.publicKey;
                if (typeof publicKey !== 'string' || !/^[A-Za-z0-9_-]{43}$/u.test(publicKey) || Buffer.from(publicKey, 'base64url').length !== 32)
                    return fail('IDENTITY_INPUT_INVALID');
                const label = fixtureLabel(input.label);
                if (!validSignature(publicKey, input.nonce + publicKey, input.signature))
                    return fail('IDENTITY_DEVICE_SIGNATURE_INVALID');
                if (!takeChallenge(input.nonce, 'register'))
                    return fail('IDENTITY_DEVICE_REPLAY');
                const deviceId = createHash('sha256').update(Buffer.from(publicKey, 'base64url')).digest('base64url');
                const existing = devices.get(deviceId), at = now();
                const row = existing ?? { publicKey, principalId: randomUUID(), registeredAt: at, lastSeenAt: at };
                if (label)
                    row.label = label;
                devices.set(deviceId, row);
                return Object.freeze({ deviceId, principalId: row.principalId, created: !existing, ...(row.label ? { label: row.label } : {}),
                    actor: mint(devicePrincipal(row.principalId)), commitState: committed(context) });
            },
        },
        deviceAuth: {
            async authenticateDevice(request) {
                const header = name => { const v = request.headers[name]; return typeof v === 'string' && v.length > 0 && v.length <= 1024 ? v : fail('IDENTITY_DEVICE_SIGNATURE_INVALID'); };
                const id = header('x-hm-device-id'), timestamp = header('x-hm-timestamp'), nonce = header('x-hm-nonce'), signature = header('x-hm-signature');
                if (!/^(?:0|[1-9]\d*)$/u.test(timestamp) || Math.abs(now() - Number(timestamp)) > 300_000 || !/^[A-Za-z0-9_-]{16,128}$/u.test(nonce) || request.path.includes('|'))
                    return fail('IDENTITY_DEVICE_SIGNATURE_INVALID');
                if (!/^[a-f0-9]{64}$/u.test(request.bodyHash) || !request.path.startsWith('/'))
                    return fail('IDENTITY_INPUT_INVALID');
                const row = devices.get(id);
                if (!row || !validSignature(row.publicKey, `${request.method.toUpperCase()}|${request.path}|${timestamp}|${nonce}|${request.bodyHash}`, signature))
                    return fail('IDENTITY_DEVICE_SIGNATURE_INVALID');
                if (authNonces.has(`${id}:${nonce}`))
                    return fail('IDENTITY_DEVICE_REPLAY');
                authNonces.add(`${id}:${nonce}`);
                row.lastSeenAt = now();
                return mint(devicePrincipal(row.principalId));
            },
            async getDevicePublicKey(deviceId) {
                const row = devices.get(deviceId);
                return row ? Object.freeze({ publicKey: row.publicKey, principalId: row.principalId, status: 'active' }) : fail('IDENTITY_NOT_FOUND');
            },
        },
        principalLinks: {
            async bindDevice(actor, input, context) {
                const principal = account(actor), row = devices.get(input?.deviceId);
                if (!row || !validSignature(row.publicKey, input.nonce, input.signature))
                    return fail('IDENTITY_DEVICE_SIGNATURE_INVALID');
                if (links.has(input.deviceId))
                    return fail('IDENTITY_DEVICE_ALREADY_BOUND');
                if (!takeChallenge(input.nonce, 'bind'))
                    return fail('IDENTITY_INPUT_INVALID');
                const linkedAt = now();
                links.set(input.deviceId, { accountPrincipalId: principal.principalId, linkedAt });
                return Object.freeze({ deviceId: input.deviceId, accountPrincipalId: principal.principalId, method: 'email', linkedAt: iso(linkedAt), commitState: committed(context) });
            },
            async resolveCanonical(principalId) {
                const device = [...devices.entries()].find(([, row]) => row.principalId === principalId);
                const canonical = device ? links.get(device[0])?.accountPrincipalId ?? principalId : principalId;
                const linked = [...links.entries()].filter(([, link]) => link.accountPrincipalId === canonical).map(([id]) => devices.get(id)?.principalId);
                return Object.freeze({ canonicalPrincipalId: canonical, linkedDevicePrincipalIds: Object.freeze(linked) });
            },
            async listDevices(accountPrincipalId) {
                return Object.freeze([...links.entries()].filter(([, link]) => link.accountPrincipalId === accountPrincipalId).map(([deviceId]) => {
                    const row = devices.get(deviceId);
                    return Object.freeze({ deviceId, registeredAt: iso(row.registeredAt), lastSeenAt: iso(row.lastSeenAt), ...(row.label ? { label: row.label } : {}) });
                }));
            },
        },
        githubProof: {
            async verifyRepositoryOwnership(actor) { account(actor); return fail('GITHUB_TOKEN_INVALID'); },
        },
        wallets: {
            async createChallenge(actor, input, context) {
                const principal = account(actor);
                const chainId = input?.chainId, address = input?.address;
                if (typeof chainId !== 'number' || !Number.isSafeInteger(chainId) || chainId < 1)
                    return fail('IDENTITY_INPUT_INVALID');
                if (typeof address !== 'string' || !/^0x[0-9a-fA-F]{40}$/u.test(address) || /^0x0{40}$/u.test(address))
                    return fail('IDENTITY_INPUT_INVALID');
                const { getAddress, createSiweMessage } = await loadViem();
                let checksummed;
                try {
                    checksummed = getAddress(address);
                }
                catch {
                    return fail('IDENTITY_INPUT_INVALID');
                }
                const issued = now(), nonce = randomBytes(32).toString('hex'), uri = new URL(baseURL);
                const message = createSiweMessage({ scheme: uri.protocol.slice(0, -1), domain: uri.host, uri: baseURL, address: checksummed, chainId, nonce, version: '1',
                    requestId: principal.principalId, issuedAt: new Date(issued), expirationTime: new Date(issued + 300_000),
                    statement: 'FIXTURE wallet challenge. Bind this wallet to a synthetic HanaMesh identity.', resources: ['urn:hanamesh:deployment:' + encodeURIComponent(deploymentId)] });
                const dto = Object.freeze({ principalId: principal.principalId, deploymentId, chainId, address: checksummed, nonce, issuedAt: iso(issued), expiresAt: iso(issued + 300_000), message });
                walletChallenges.set(nonce, { dto, used: false });
                return Object.freeze({ ...dto, commitState: committed(context) });
            },
            async bindWallet(actor, input, context) {
                const principal = account(actor);
                if (typeof input?.nonce !== 'string' || !/^[a-f0-9]{64}$/u.test(input.nonce))
                    return fail('IDENTITY_WALLET_CHALLENGE_INVALID');
                if (typeof input.signature !== 'string' || !/^0x[0-9a-fA-F]{130}$/u.test(input.signature))
                    return fail('IDENTITY_WALLET_SIGNATURE_INVALID');
                const row = walletChallenges.get(input.nonce);
                if (!row)
                    return fail('IDENTITY_WALLET_CHALLENGE_INVALID');
                if (row.dto.principalId !== principal.principalId)
                    return fail('AUTH_FORBIDDEN');
                if (row.used)
                    return fail('IDENTITY_WALLET_REPLAY');
                if (Date.parse(row.dto.expiresAt) <= now())
                    return fail('IDENTITY_WALLET_CHALLENGE_INVALID');
                const { verifyMessage } = await loadViem();
                let valid = false;
                try {
                    valid = await verifyMessage({ address: row.dto.address, message: row.dto.message, signature: input.signature });
                }
                catch { /* SDK parsing/recovery errors are an invalid signature, as in the provider */ }
                if (!valid)
                    return fail('IDENTITY_WALLET_SIGNATURE_INVALID');
                const address = row.dto.address, same = a => a.toLowerCase() === address.toLowerCase();
                const prior = wallets.filter(w => w.principalId === principal.principalId || same(w.address));
                const existing = prior.find(w => w.chainId === row.dto.chainId);
                if (prior.some(w => w.principalId !== principal.principalId || !same(w.address)))
                    return fail('IDENTITY_WALLET_ALREADY_BOUND');
                row.used = true;
                if (existing)
                    return Object.freeze({ binding: existing, created: false, commitState: committed(context) });
                const binding = Object.freeze({ principalId: principal.principalId, deploymentId, chainId: row.dto.chainId, address, proofMethod: 'siwe-eoa', boundAt: iso(now()) });
                wallets.push(binding);
                return Object.freeze({ binding, created: true, commitState: committed(context) });
            },
            async listOwnBindings(actor) { const principal = account(actor); return Object.freeze(wallets.filter(w => w.principalId === principal.principalId)); },
            async getBinding(input) {
                if (typeof input?.principalId !== 'string' || !/^[0-9a-f-]{36}$/iu.test(input.principalId))
                    return fail('IDENTITY_INPUT_INVALID');
                if (typeof input.chainId !== 'number' || !Number.isSafeInteger(input.chainId) || input.chainId < 1)
                    return fail('IDENTITY_INPUT_INVALID');
                return wallets.find(w => w.principalId === input.principalId.toLowerCase() && w.chainId === input.chainId) ?? null;
            },
        },
        ...(options.email === false ? {} : { email: {
                async requestVerification(actor, input, context) {
                    const principal = account(actor);
                    const email = typeof input?.email === 'string' ? input.email.trim().toLowerCase() : '';
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) || email.length > 254 || /@users\.invalid$/iu.test(email))
                        return fail('IDENTITY_INPUT_INVALID');
                    const expiresAt = iso(now() + 1_800_000), state = emails.get(principal.principalId) ?? {};
                    state.pending = { email, expiresAt, token: randomBytes(32).toString('base64url') };
                    emails.set(principal.principalId, state);
                    return Object.freeze({ email, expiresAt, commitState: committed(context) });
                },
                async getStatus(principalId) {
                    const state = emails.get(principalId);
                    const out = {};
                    if (state?.email && state.verifiedAt) {
                        out.email = state.email;
                        out.verifiedAt = state.verifiedAt;
                    }
                    if (state?.pending)
                        out.pending = { email: state.pending.email, expiresAt: state.pending.expiresAt };
                    return Object.freeze(out);
                },
                async verifyToken(input, context) {
                    const hit = [...emails.entries()].find(([, state]) => state.pending?.token === input?.token);
                    if (!hit)
                        return fail('EMAIL_TOKEN_INVALID');
                    const [principalId, state] = hit, pending = state.pending;
                    const verifiedAt = iso(now());
                    emails.set(principalId, { email: pending.email, verifiedAt });
                    return Object.freeze({ principalId, email: pending.email, verifiedAt, commitState: committed(context) });
                },
            } }),
    };
    return Object.freeze({ label: IDENTITY_FIXTURE_LABEL, services: Object.freeze(services), credentials: addAccount('FIXTURE alice'), addAccount });
}

/** Handshake matrix every consumer must answer exactly like `checkIdentityServices`. */
export function identityHandshakeCases() {
    const full = createIdentityServicesFixture().services;
    const without = key => { const copy = { ...full }; delete copy[key]; return copy; };
    const memberWithout = (member, method) => { const inner = { ...full[member] }; delete inner[method]; return { ...full, [member]: inner }; };
    return Object.freeze([
        { id: 'undefined', value: undefined, expect: { status: 'absent', reason: 'IDENTITY_SERVICES_ABSENT' } },
        { id: 'null', value: null, expect: { status: 'absent', reason: 'IDENTITY_SERVICES_ABSENT' } },
        { id: 'string', value: 'identity', expect: { status: 'incompatible', reason: 'IDENTITY_SERVICES_NOT_OBJECT' } },
        { id: 'function', value: () => undefined, expect: { status: 'incompatible', reason: 'IDENTITY_SERVICES_NOT_OBJECT' } },
        { id: 'version-undeclared', value: without('protocolVersion'), expect: { status: 'incompatible', reason: 'IDENTITY_PROTOCOL_UNSUPPORTED' } },
        { id: 'version-2', value: { ...full, protocolVersion: '2' }, expect: { status: 'incompatible', reason: 'IDENTITY_PROTOCOL_UNSUPPORTED' } },
        { id: 'version-number', value: { ...full, protocolVersion: 1 }, expect: { status: 'incompatible', reason: 'IDENTITY_PROTOCOL_UNSUPPORTED' } },
        { id: 'missing-wallets', value: without('wallets'), expect: { status: 'incompatible', reason: 'IDENTITY_SERVICE_MEMBER_MISSING', missing: ['wallets'] } },
        { id: 'wallets-without-getBinding', value: memberWithout('wallets', 'getBinding'), expect: { status: 'incompatible', reason: 'IDENTITY_SERVICE_MEMBER_MISSING', missing: ['wallets.getBinding'] } },
        { id: 'missing-authenticate', value: without('authenticate'), expect: { status: 'incompatible', reason: 'IDENTITY_SERVICE_MEMBER_MISSING', missing: ['authenticate'] } },
        { id: 'missing-deviceAuth', value: without('deviceAuth'), expect: { status: 'incompatible', reason: 'IDENTITY_SERVICE_MEMBER_MISSING', missing: ['deviceAuth'] } },
        { id: 'email-without-verifyToken', value: memberWithout('email', 'verifyToken'), expect: { status: 'incompatible', reason: 'IDENTITY_SERVICE_MEMBER_MISSING', missing: ['email.verifyToken'] } },
        { id: 'present-without-email', value: without('email'), expect: { status: 'present', optional: [] } },
        { id: 'present-with-email', value: full, expect: { status: 'present', optional: ['email'] } },
    ]);
}
/** One `{status, body}` per current error code, as the HTTP surface sends it. */
export function identityErrorEnvelopes() {
    return Object.freeze(IDENTITY_ERROR_CODES.map(code => { const error = new IdentityError(code); return Object.freeze({ status: error.statusCode, body: error.toJSON() }); }));
}
/** Reference consumer: accepts through `checkIdentityServices` and shows the error code; unknown future codes are shown, never dropped. */
export function createIdentityConsumerFixture() {
    return Object.freeze({
        label: `${IDENTITY_FIXTURE_LABEL} · reference consumer`,
        accept: value => checkIdentityServices(value),
        describeError: (status, body) => {
            const code = body?.error?.code;
            return typeof code === 'string' ? `${status} ${code}` : `${status} IDENTITY_RESPONSE_UNRECOGNIZED`;
        },
    });
}

/** Synthetic secp256k1 key used only by the examples. FIXTURE: never fund or reuse it. */
export const IDENTITY_FIXTURE_WALLET_PRIVATE_KEY = '0x' + '11'.repeat(32);
const caught = async run => { try { await run(); } catch (error) { return { code: error.code, statusCode: error.statusCode }; } throw new Error('C-IDENTITY FIXTURE example expected a rejection'); };
/**
 * Sample data for every documented outcome, produced by the fixture provider (FIXTURE · synthetic).
 * Wallet examples need the optional peer viem; pass `{wallets:false}` to skip them.
 */
export async function createIdentityContractExamples(options = {}) {
    const fixture = createIdentityServicesFixture();
    const { services, credentials } = fixture;
    const actor = await services.authenticate(credentials);
    const key = createIdentityDeviceKey();
    const strip = ({ commitState: _c, actor: _a, ...rest }) => rest;

    const registerChallenge = await services.deviceRegistration.createChallenge('register');
    const first = await services.deviceRegistration.registerDevice({ publicKey: key.publicKey, nonce: registerChallenge.nonce,
        signature: key.sign(registerChallenge.nonce + key.publicKey), label: { hostname: 'fixture-host', os: 'darwin-arm64', shell: 'dsh' } });
    const again = await services.deviceRegistration.createChallenge('register');
    const second = await services.deviceRegistration.registerDevice({ publicKey: key.publicKey, nonce: again.nonce, signature: key.sign(again.nonce + key.publicKey) });
    const replay = await caught(() => services.deviceRegistration.registerDevice({ publicKey: key.publicKey, nonce: again.nonce, signature: key.sign(again.nonce + key.publicKey) }));
    const badSignature = await caught(async () => { const c = await services.deviceRegistration.createChallenge('register'); await services.deviceRegistration.registerDevice({ publicKey: key.publicKey, nonce: c.nonce, signature: key.sign('other') }); });

    const path = '/v1/identity/me';
    const headers = identityDeviceRequestHeaders(key, { method: 'GET', path });
    const deviceRequest = { method: 'GET', path, bodyHash: createHash('sha256').update('').digest('hex'), headers };
    const deviceActor = await services.deviceAuth.authenticateDevice(deviceRequest);
    const deviceReplay = await caught(() => services.deviceAuth.authenticateDevice(deviceRequest));
    const canonicalBeforeBind = await services.principalLinks.resolveCanonical(deviceActor.principal.principalId);

    const bindChallenge = await services.deviceRegistration.createChallenge('bind');
    const bindInput = { deviceId: key.deviceId, nonce: bindChallenge.nonce, signature: key.sign(bindChallenge.nonce) };
    const binding = await services.principalLinks.bindDevice(actor, bindInput);
    const alreadyBound = await caught(async () => { const c = await services.deviceRegistration.createChallenge('bind'); await services.principalLinks.bindDevice(actor, { deviceId: key.deviceId, nonce: c.nonce, signature: key.sign(c.nonce) }); });
    const canonicalAfterBind = await services.principalLinks.resolveCanonical(deviceActor.principal.principalId);
    const unknownPrincipalId = '00000000-0000-4000-8000-000000000000';
    const canonicalUnknown = await services.principalLinks.resolveCanonical(unknownPrincipalId);
    const githubNoToken = await caught(() => services.githubProof.verifyRepositoryOwnership(actor, { owner: 'hanamesh-fixture', repo: 'demo' }));
    const bindingUnbound = await services.wallets.getBinding({ principalId: actor.principal.principalId, chainId: 31337 });
    const bindingUnknown = await services.wallets.getBinding({ principalId: unknownPrincipalId, chainId: 31337 });
    const bindingInvalid = await caught(() => services.wallets.getBinding({ principalId: 'not-a-principal', chainId: 0 }));
    const unauthenticated = await caught(() => services.authenticate({}));

    let wallet = null;
    if (options.wallets !== false) {
        const { privateKeyToAccount } = await import('viem/accounts').catch(error => { throw new Error('C-IDENTITY FIXTURE wallet examples need the optional peer dependency viem; pass {wallets:false} to skip them.', { cause: error }); });
        const eoa = privateKeyToAccount(IDENTITY_FIXTURE_WALLET_PRIVATE_KEY);
        const challengeInput = { chainId: 31337, address: eoa.address };
        const challenge = await services.wallets.createChallenge(actor, challengeInput);
        const bindInputWallet = { nonce: challenge.nonce, signature: await eoa.signMessage({ message: challenge.message }) };
        const created = await services.wallets.bindWallet(actor, bindInputWallet);
        const walletReplay = await caught(() => services.wallets.bindWallet(actor, bindInputWallet));
        const again2 = await services.wallets.createChallenge(actor, challengeInput);
        const existing = await services.wallets.bindWallet(actor, { nonce: again2.nonce, signature: await eoa.signMessage({ message: again2.message }) });
        const badSig = await caught(async () => { const c = await services.wallets.createChallenge(actor, challengeInput); await services.wallets.bindWallet(actor, { nonce: c.nonce, signature: await eoa.signMessage({ message: 'not the challenge' }) }); });
        const otherActor = await services.authenticate(fixture.addAccount('FIXTURE bob'));
        const alreadyBoundWallet = await caught(async () => { const c = await services.wallets.createChallenge(otherActor, challengeInput); await services.wallets.bindWallet(otherActor, { nonce: c.nonce, signature: await eoa.signMessage({ message: c.message }) }); });
        const { commitState: _c, ...challengeWire } = challenge;
        wallet = {
            challengeInput, challenge: challengeWire, bindInput: bindInputWallet,
            bindCreated: identityWalletBindWire(created), bindExisting: identityWalletBindWire(existing),
            getBinding: await services.wallets.getBinding({ principalId: actor.principal.principalId, chainId: 31337 }),
            errors: { IDENTITY_WALLET_REPLAY: walletReplay, IDENTITY_WALLET_SIGNATURE_INVALID: badSig, IDENTITY_WALLET_ALREADY_BOUND: alreadyBoundWallet },
        };
    }
    return {
        label: IDENTITY_FIXTURE_LABEL,
        device: {
            challengeInput: { purpose: 'register' },
            challenge: strip(registerChallenge),
            registerInput: { publicKey: key.publicKey, nonce: registerChallenge.nonce, signature: key.sign(registerChallenge.nonce + key.publicKey) },
            registerCreated: identityDeviceRegisterWire(first),
            registerAgain: identityDeviceRegisterWire(second),
            serviceResult: { created: first.created, againCreated: second.created },
            authHeaders: headers,
            bindInput,
            binding: strip(binding),
            errors: { IDENTITY_DEVICE_REPLAY: replay, IDENTITY_DEVICE_SIGNATURE_INVALID: badSignature, IDENTITY_DEVICE_ALREADY_BOUND: alreadyBound, authenticateDeviceReplay: deviceReplay },
        },
        canonical: { beforeBind: canonicalBeforeBind, afterBind: canonicalAfterBind, unknownPrincipalId, unknown: canonicalUnknown },
        getBinding: { unbound: bindingUnbound, unknownPrincipal: bindingUnknown, IDENTITY_INPUT_INVALID: bindingInvalid },
        github: { GITHUB_TOKEN_INVALID: githubNoToken },
        authenticate: { AUTH_REQUIRED: unauthenticated },
        wallet,
        errorEnvelopes: identityErrorEnvelopes(),
    };
}
