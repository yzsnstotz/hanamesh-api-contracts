// Types copied from hanamesh-server-identity origin/main ffe1ae5: src/contracts.ts (wire, browser-safe) and src/server-contracts.ts (service ports, server-only).

// ───────────── Wire DTOs: what crosses HTTP (/v1/identity/*, /api/auth/*). Validation constraints live in schema.json. ─────────────
export type IdentityErrorCode =
    | 'AUTH_REQUIRED' | 'AUTH_FORBIDDEN' | 'AUTH_UNAVAILABLE' | 'IDENTITY_NOT_READY'
    | 'IDENTITY_INPUT_INVALID' | 'IDENTITY_CONFIG_INVALID' | 'IDENTITY_NOT_FOUND'
    | 'IDENTITY_ORIGIN_REJECTED' | 'IDENTITY_RATE_LIMITED' | 'IDENTITY_AUTH_FAILED'
    | 'IDENTITY_DEPLOYMENT_MISMATCH' | 'DB_SCHEMA_MISSING' | 'DB_ROLE_UNSAFE'
    | 'GITHUB_NO_RELATION' | 'GITHUB_API_UNAVAILABLE' | 'GITHUB_TOKEN_INVALID'
    | 'IDENTITY_DEVICE_SIGNATURE_INVALID' | 'IDENTITY_DEVICE_REVOKED' | 'IDENTITY_DEVICE_REPLAY'
    | 'IDENTITY_DEVICE_ALREADY_BOUND'
    | 'EMAIL_TOKEN_INVALID' | 'EMAIL_TOKEN_EXPIRED' | 'EMAIL_TOKEN_USED' | 'EMAIL_ALREADY_BOUND' | 'EMAIL_DELIVERY_FAILED'
    | 'IDENTITY_BIND_HOOK_FAILED'
    | 'IDENTITY_WALLET_CHALLENGE_INVALID' | 'IDENTITY_WALLET_SIGNATURE_INVALID'
    | 'IDENTITY_WALLET_REPLAY' | 'IDENTITY_WALLET_ALREADY_BOUND'
    | 'IDENTITY_GITHUB_ALREADY_LINKED' | 'IDENTITY_GITHUB_LAST_LOGIN';
export type IdentityScope = 'identity:read:self' | 'identity:update:self' | 'identity:device';
export interface PrincipalDTO {
    readonly principalId: string;
    readonly deploymentId: string;
    readonly displayName: string;
    /** Identity capabilities only; never implies paid / publisher / wallet permission. */
    readonly scopes: readonly IdentityScope[];
}
export interface MeResponse { readonly principal: PrincipalDTO }
export interface IdentityErrorResponse { readonly error: { readonly code: IdentityErrorCode; readonly message: string } }
export interface UpdateProfileInput { readonly displayName: string }
export interface LoginResponse { readonly ok: true }
/** Client-declared, owner-facing label. Distinguishes several DSH profiles on one machine; never an identity key. */
export interface DeviceLabelDTO { readonly hostname: string; readonly os: string; readonly shell: string }
export interface DeviceDTO { readonly deviceId: string; readonly registeredAt: string; readonly lastSeenAt: string; readonly label?: DeviceLabelDTO }
/** Human-facing reference to the external account a canonical principal signed in with. No id, token or email. */
export interface LinkedAccountDTO { readonly provider: 'github'; readonly displayName: string }
/** POST /v1/identity/devices/challenge request body. */
export interface DeviceChallengeInput { readonly purpose: 'register' | 'bind' }
/** POST /v1/identity/devices/challenge → 200. Server-random nonce, single use, 5 minutes. */
export interface DeviceChallengeDTO { readonly nonce: string; readonly expiresAt: string }
/** POST /v1/identity/devices request body. `signature` = ed25519(UTF-8 nonce + publicKey), base64url. */
export interface DeviceRegisterInput { readonly publicKey: string; readonly nonce: string; readonly signature: string; readonly label?: DeviceLabelDTO }
/** POST /v1/identity/devices → 201 (new device) or 200 (same public key re-registered). There is NO `created` field on the wire: read the status. */
export interface DeviceRegisterResponse { readonly deviceId: string; readonly principalId: string; readonly label?: DeviceLabelDTO }
/** POST /v1/identity/me/devices/bind request body. `signature` = ed25519(nonce) of a `purpose:'bind'` challenge. */
export interface DeviceBindInput { readonly deviceId: string; readonly nonce: string; readonly signature: string }
/** POST /v1/identity/me/devices/bind → 201. */
export interface BindingDTO { readonly deviceId: string; readonly accountPrincipalId: string; readonly method: 'github' | 'email'; readonly linkedAt: string }
export interface DeviceListResponse { readonly devices: readonly DeviceDTO[] }
export interface GithubOwnershipProofDTO {
    readonly relation: 'owner' | 'repo-admin' | 'repo-maintain' | 'org-member' | 'none';
    readonly checkedAt: string;
    readonly githubUserId: string;
    readonly repo: string;
    readonly evidence: readonly { readonly endpoint: string; readonly status: number }[];
}
export interface EmailStatusDTO { readonly email?: string; readonly verifiedAt?: string; readonly pending?: { readonly email: string; readonly expiresAt: string } }
export interface EmailVerifyResultDTO { readonly email: string; readonly verifiedAt: string }
export interface EmailRequestInput { readonly email: string }
export interface EmailRequestResponse { readonly pending: NonNullable<EmailStatusDTO['pending']> }
export interface EmailVerifyInput { readonly token: string }
/** Chain-specific ownership proof of a deployment-wide one-principal/one-wallet fact.
 * Same principal/address may prove multiple chains. Does not grant funds, claim eligibility, broadcasting or recovery authority. */
export interface WalletBindingDTO {
    readonly principalId: string;
    readonly deploymentId: string;
    readonly chainId: number;
    readonly address: string;
    readonly proofMethod: 'siwe-eoa';
    readonly boundAt: string;
}
/** Wallet step 1: POST /v1/identity/me/wallets/challenge request body. */
export interface WalletChallengeInput { readonly chainId: number; readonly address: string }
/** Wallet step 1 → 201. Sign `message` exactly; never rebuild it client-side or replace its principal, URI/domain, chain, address or nonce. */
export interface WalletChallengeDTO extends WalletChallengeInput {
    readonly principalId: string;
    readonly deploymentId: string;
    readonly nonce: string;
    readonly issuedAt: string;
    readonly expiresAt: string;
    readonly message: string;
}
/** Wallet step 2: POST /v1/identity/me/wallets/bind request body. `signature` = EIP-191 personal_sign of the challenge `message`, 0x hex. */
export interface WalletBindInput { readonly nonce: string; readonly signature: string }
/** Wallet step 2 → 201 (`created: true`) or 200 (`created: false`, the same pair already proved on this chain). */
export interface WalletBindResponse { readonly binding: WalletBindingDTO; readonly created: boolean }
export interface WalletListResponse { readonly bindings: readonly WalletBindingDTO[] }
export interface GithubLinkDTO { readonly provider: 'github'; readonly githubUserId: string; readonly linkedAt: string }
export interface GithubLinkStatusDTO { readonly github: GithubLinkDTO | null }
export interface GithubLinkInput { readonly callbackURL: string; readonly errorCallbackURL?: string }
export interface GithubUnlinkResponse { readonly unlinked: true }
export type EmptyObject = Readonly<Record<string, never>>;
export interface MagicLinkInput { readonly email: string; readonly callbackURL?: string; readonly name?: string }
export interface RedirectResponse { readonly url: string; readonly redirect: true }
export interface SignInInput { readonly email: string; readonly password: string }
export interface SignUpInput { readonly email: string; readonly password: string; readonly name: string }
export interface SocialSignInInput { readonly provider: 'github'; readonly callbackURL: string; readonly errorCallbackURL?: string }

// ───────────── Service ports: in-process, server-only (`(await createIdentityModule(options)).services`). Never serialized. ─────────────
export type CommitState = 'committed' | 'pending-host-commit';
export interface SqlResult { rows: Record<string, unknown>[]; rowCount: number | null }
export interface SqlExecutor { query(text: string, values?: unknown[]): Promise<SqlResult> }
/** Must be an already-BEGIN'd, pinned connection from the SAME database. The host owns COMMIT/ROLLBACK/release. Not a client-supplied field. */
export interface WriteContext { readonly executor: SqlExecutor }
export interface SessionCredentials { readonly cookie?: string }
/** Only actors minted by this running identity instance are accepted by write commands. Do not serialize, forge, cache or reuse across requests. */
export interface VerifiedActor { readonly principal: PrincipalDTO }
export interface AuthorizationRequest<R> {
    readonly action: string;
    readonly loadResource: (principal: PrincipalDTO) => Promise<R | null>;
    readonly policy: (context: { principal: PrincipalDTO; resource: R; action: string }) => boolean | Promise<boolean>;
}
export interface ProfileWriteResult extends PrincipalDTO { readonly commitState: CommitState }
export interface IdentityService {
    authenticate(credentials: SessionCredentials): Promise<VerifiedActor>;
    authorize<R>(credentials: SessionCredentials, request: AuthorizationRequest<R>): Promise<{ actor: VerifiedActor; resource: R }>;
    updateOwnProfile(actor: VerifiedActor, input: UpdateProfileInput, context?: WriteContext): Promise<ProfileWriteResult>;
}
export interface GithubProofService {
    /** `relation:'none'` is a result, not an error: GITHUB_NO_RELATION is never thrown; the consumer decides whether to refuse. */
    verifyRepositoryOwnership(actor: VerifiedActor, repository: { owner: string; repo: string }): Promise<GithubOwnershipProofDTO>;
}
export type DeviceChallengePurpose = 'register' | 'bind';
export interface DeviceChallengeWriteResult extends DeviceChallengeDTO { readonly commitState: CommitState }
/** Service-level registration result. `created` exists only here; HTTP maps it to 201/200 and drops `actor`/`commitState`. */
export interface DeviceRegistrationResult {
    readonly deviceId: string;
    readonly principalId: string;
    readonly created: boolean;
    readonly label?: DeviceLabelDTO;
    readonly actor: VerifiedActor;
    readonly commitState: CommitState;
}
export type DeviceAuthHeadersRecord = Record<'x-hm-device-id' | 'x-hm-timestamp' | 'x-hm-nonce' | 'x-hm-signature', string>;
export interface DeviceAuthRequest { readonly method: string; readonly path: string; readonly bodyHash: string; readonly headers: Record<string, string | string[] | undefined> }
export interface DevicePublicKeyDTO { readonly publicKey: string; readonly principalId: string; readonly status: 'active' | 'revoked' }
export interface DeviceRegistrationService {
    createChallenge(purpose: DeviceChallengePurpose, deviceId?: string, context?: WriteContext): Promise<DeviceChallengeWriteResult>;
    /** Re-registering an existing device with a label replaces the stored one; without a label keeps it. */
    registerDevice(input: { publicKey: string; nonce: string; signature: string; label?: DeviceLabelDTO }, context?: WriteContext): Promise<DeviceRegistrationResult>;
}
export interface DeviceAuthService {
    authenticateDevice(request: DeviceAuthRequest): Promise<VerifiedActor>;
    getDevicePublicKey(deviceId: string): Promise<DevicePublicKeyDTO>;
}
export interface BindingWriteResult extends BindingDTO { readonly commitState: CommitState }
/** Fired inside the binding transaction after identity.principal_link is written. `principalId` is the account (canonical) principal.
 * A throw rolls the binding back and surfaces as IDENTITY_BIND_HOOK_FAILED. */
export interface DeviceBoundEvent { readonly deviceId: string; readonly principalId: string; readonly devicePrincipalId: string; readonly deploymentId: string }
export type OnDeviceBound = (event: DeviceBoundEvent, context: WriteContext) => Promise<void>;
/** `account` is present when the canonical principal signed in through GitHub; consumers pass it through, never persist it. */
export interface PrincipalResolution { readonly canonicalPrincipalId: string; readonly linkedDevicePrincipalIds: readonly string[]; readonly account?: LinkedAccountDTO }
export interface PrincipalLinkService {
    bindDevice(accountActor: VerifiedActor, input: { deviceId: string; nonce: string; signature: string }, context?: WriteContext): Promise<BindingWriteResult>;
    /** No existence check: an unknown (or unlinked) principalId resolves to itself with no linked devices. Never IDENTITY_NOT_FOUND. */
    resolveCanonical(principalId: string): Promise<PrincipalResolution>;
    listDevices(accountPrincipalId: string): Promise<readonly DeviceDTO[]>;
}
export interface EmailRequestResult { readonly email: string; readonly expiresAt: string; readonly commitState: CommitState }
export interface EmailVerifyWriteResult extends EmailVerifyResultDTO { readonly principalId: string; readonly commitState: CommitState }
export interface EmailBindingService {
    requestVerification(actor: VerifiedActor, input: { email: string }, context?: WriteContext): Promise<EmailRequestResult>;
    getStatus(principalId: string): Promise<EmailStatusDTO>;
    verifyToken(input: { token: string }, context?: WriteContext): Promise<EmailVerifyWriteResult>;
}
export interface WalletChallengeWriteResult extends WalletChallengeDTO { readonly commitState: CommitState }
export interface WalletBindingWriteResult extends WalletBindResponse { readonly commitState: CommitState }
export interface WalletBindingService {
    createChallenge(actor: VerifiedActor, input: WalletChallengeInput, context?: WriteContext): Promise<WalletChallengeWriteResult>;
    bindWallet(actor: VerifiedActor, input: WalletBindInput, context?: WriteContext): Promise<WalletBindingWriteResult>;
    listOwnBindings(actor: VerifiedActor): Promise<readonly WalletBindingDTO[]>;
    /** Trusted server-only lookup; the consumer supplies a verified canonical principal. No row (including an unknown but well-formed principalId) → null, never IDENTITY_NOT_FOUND.
     * Ownership proof only, never authorization to claim/withdraw/broadcast. */
    getBinding(input: { principalId: string; chainId: number }, context?: WriteContext): Promise<WalletBindingDTO | null>;
}
export interface IdentityServices extends IdentityService {
    /** Optional in the type; checkIdentityServices rejects a value that does not declare it. */
    readonly protocolVersion?: '1';
    readonly deviceRegistration: DeviceRegistrationService;
    readonly deviceAuth: DeviceAuthService;
    readonly principalLinks: PrincipalLinkService;
    readonly githubProof: GithubProofService;
    readonly wallets: WalletBindingService;
    /** Present only when the provider module was created with `emailVerifyUrlBase`. */
    readonly email?: EmailBindingService;
}
/** The ports each baseline consumer uses; depend on these, not on the whole aggregate. */
export type IdentityUsagePorts = Pick<IdentityServices, 'deviceAuth' | 'principalLinks'>;
export type IdentityCustodyPorts = Pick<IdentityServices, 'authenticate' | 'principalLinks'>;
export type IdentityClaimPorts = Pick<IdentityServices, 'authenticate' | 'githubProof'>;
export type IdentityRegistryPorts = Pick<IdentityServices, 'authenticate'>;
export interface IdentityHostPorts { readonly wallets: Pick<WalletBindingService, 'getBinding'> }

// ───────────── Constants, handshake, errors ─────────────
export declare const IDENTITY_PROVIDER_PACKAGE: '@hanamesh/server-identity';
export declare const IDENTITY_PROTOCOL_VERSION: '1';
export declare const IDENTITY_SUPPORTED_PROTOCOL_VERSIONS: readonly string[];
export declare const IDENTITY_PROTOCOL_HEADER: 'x-hanamesh-identity-protocol';
export declare const IDENTITY_ERROR_CODES: readonly IdentityErrorCode[];
/** HTTP status and fixed public message per code, as the provider sends them. */
export declare const IDENTITY_ERRORS: Readonly<Record<IdentityErrorCode, readonly [status: number, message: string]>>;
export declare const IDENTITY_SERVICES_REQUIRED: Readonly<{
    readonly '': readonly ['authenticate', 'authorize', 'updateOwnProfile'];
    readonly deviceRegistration: readonly ['createChallenge', 'registerDevice'];
    readonly deviceAuth: readonly ['authenticateDevice', 'getDevicePublicKey'];
    readonly principalLinks: readonly ['bindDevice', 'resolveCanonical', 'listDevices'];
    readonly githubProof: readonly ['verifyRepositoryOwnership'];
    readonly wallets: readonly ['createChallenge', 'bindWallet', 'listOwnBindings', 'getBinding'];
}>;
export declare const IDENTITY_SERVICES_OPTIONAL: Readonly<{ readonly email: readonly ['requestVerification', 'getStatus', 'verifyToken'] }>;
export type IdentityOptionalMember = 'email';
export type IdentityServicesHandshake =
    | { readonly status: 'present'; readonly protocolVersion: string; readonly optional: readonly IdentityOptionalMember[] }
    | { readonly status: 'absent'; readonly reason: 'IDENTITY_SERVICES_ABSENT' }
    | { readonly status: 'incompatible'; readonly reason: 'IDENTITY_SERVICES_NOT_OBJECT' }
    | { readonly status: 'incompatible'; readonly reason: 'IDENTITY_PROTOCOL_UNSUPPORTED'; readonly provided: string | null; readonly supported: readonly string[] }
    | { readonly status: 'incompatible'; readonly reason: 'IDENTITY_SERVICE_MEMBER_MISSING'; readonly missing: readonly string[] };
export declare function checkIdentityServices(value: unknown, accept?: readonly string[]): IdentityServicesHandshake;
export declare function checkIdentityProtocolHeader(headerValue: string | null | undefined, accept?: readonly string[]):
    | { readonly ok: true; readonly protocolVersion: string }
    | { readonly ok: false; readonly reason: 'IDENTITY_PROTOCOL_UNSUPPORTED'; readonly provided: string | null; readonly supported: readonly string[] };
/** What the provider throws from a service call. Match on `code`, not `instanceof`: the provider's own class is a different constructor. */
export declare class IdentityError extends Error {
    readonly code: IdentityErrorCode;
    readonly statusCode: number;
    constructor(code: IdentityErrorCode);
    toJSON(): IdentityErrorResponse;
}
export declare function isIdentityError(value: unknown): value is { readonly code: IdentityErrorCode; readonly statusCode: number };

export interface IdentityCallDefinition {
    readonly from: string;
    readonly kind: 'http' | 'service';
    /** HTTP route(s) or service method path, e.g. `deviceAuth.authenticateDevice`. */
    readonly at: readonly string[];
    readonly input: string;
    readonly output: string;
    /** Codes the current provider actually returns on this call. */
    readonly errors: readonly IdentityErrorCode[];
    /** Codes the abstract baseline listed for this call; differences from `errors` are explained in `note`. */
    readonly baselineErrors: readonly string[];
    readonly implemented: boolean;
    readonly note: string;
    /** Card that owns an open gap on this call, if any. */
    readonly followUp?: string;
}
export type IdentityCallName =
    | 'deviceRegister' | 'githubSignIn' | 'deviceBind' | 'walletBind' | 'walletSignIn'
    | 'authenticateDevice' | 'custodyAuthenticateResolve' | 'githubProof' | 'registryAuthenticate' | 'hostGetBinding';
export declare const IDENTITY_CONTRACT_DEFINITION: Readonly<{
    readonly id: 'C-IDENTITY';
    readonly provider: 'server-identity';
    readonly source: string;
    readonly protocolVersion: '1';
    readonly types: Readonly<Record<string, unknown>>;
    readonly calls: Readonly<Record<IdentityCallName, IdentityCallDefinition>>;
    readonly events: Readonly<{ readonly onDeviceBound: Readonly<{ readonly to: string; readonly payload: string; readonly delivery: string }> }>;
    readonly limits: Readonly<{ readonly deviceRegistrationRateLimit: null; readonly note: string }>;
}>;
