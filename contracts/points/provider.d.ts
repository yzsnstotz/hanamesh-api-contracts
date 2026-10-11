import type { FastifyPluginAsync } from 'fastify';
import type { DeviceAuthRequest, IdentityServices, SessionCredentials } from '../identity/index.js';
import type { SqlExecutor, SqlResult, UnitOfWork, WriteContext } from '../uow/index.js';
import type { BalanceDTO, ClaimPointsResult, DeviceBoundResult, HanaClaimSummaryDTO, HanaPointsDTO, IntentDTO, OwnLedgerEntryDTO, OutboxRunResult, OwnPointsDTO, PendingPointsEventDTO, UnsignedWithdrawVoucher, UsagePointsEvent, UsagePointsResult, VoucherVerification, WithdrawVoucher } from './contracts.js';
export type { DeviceAuthRequest, SessionCredentials, SqlExecutor, SqlResult, UnitOfWork, WriteContext };
/** Custody's database infrastructure port. Writes use the host's pinned WriteContext.executor. */
export interface SqlConnection extends SqlExecutor {
    release(): void;
}
export interface SqlPool extends SqlExecutor {
    connect(): Promise<SqlConnection>;
}
export interface ChainIntent {
    readonly id: string;
    readonly kind: 'sponsored-launch' | 'withdraw' | 'points-distribution';
    readonly payload: Readonly<Record<string, unknown>>;
}
export interface ChainExecutor {
    submit(intent: ChainIntent): Promise<{
        chainRef: string;
    }>;
    confirm(chainRef: string): Promise<{
        status: 'pending' | 'confirmed' | 'failed';
        reason?: string;
    }>;
}
/** Points rules. Every value comes from host configuration (POINTS_* / CREATOR_MIRROR_BPS / CLAIM_BONUS / UNBOUND_CAP); the module has no defaults.
 * `install`, `open`, `use`, `claimBonus`, `unboundCap` are whole points (may carry up to 3 decimals); `useDailyMax` is a count; `creatorMirrorBps` is basis points of every user point. */
export interface PointsPolicy {
    readonly install: number;
    readonly open: number;
    readonly use: number;
    readonly useDailyMax: number;
    readonly creatorMirrorBps: number;
    readonly claimBonus: number;
    readonly unboundCap: number;
}
export interface VoucherSigner {
    readonly keyId: string;
    readonly publicKey: string;
    sign(voucher: UnsignedWithdrawVoucher): string;
    verify(voucher: WithdrawVoucher): boolean;
}
/** Chain-side claim summary (`read`, optional: absent = chain NOT_CONNECTED) and/or host-side owner lookup (`readOwner`); the two are independent since rc.7. */
export interface ClaimSummaryProvider {
    read?(hanaId: string): Promise<{
        hanaId: string;
        assets: readonly {
            asset: string;
            claimable: string;
            claimed: string;
            unclaimed: string;
        }[];
    }>;
    /** Optional, backward compatible: resolves the claiming principal of a Hana claimed outside this module's own `onClaimed` record (e.g. before rc.5). `null` = unclaimed. */
    readOwner?(hanaId: string): Promise<{
        principalId: string;
    } | null>;
}
export interface CustodyService {
    /** Claim hook kept under its rc.1 name for host wiring; semantics = `onClaimed` (claim bonus + transfer of unclaimed creator mirror). Must run in the claim's host transaction. */
    recordClaimCredit(event: {
        principalId: string;
        hanaId: string;
        claimId: string;
    }, context: WriteContext): Promise<ClaimPointsResult>;
    /** One de-duplicated usage event → user points (ledger when `principalId` present, otherwise pending per device up to the unbound cap) + creator mirror (ledger when claimed, otherwise pending unclaimed). Idempotent on `usageEventId`; scored use is limited to one per device/Hana/UTC hour. Upstream consent/signature validation precedes this trusted host hook. */
    recordUsagePoints(context: WriteContext, event: UsagePointsEvent): Promise<UsagePointsResult>;
    /** Identity binding hook: every pending unbound-device row of `deviceId` moves into `principalId`'s ledger. Idempotent. */
    onDeviceBound(context: WriteContext, deviceId: string, principalId: string): Promise<DeviceBoundResult>;
    /** Claim hook: claim bonus once per Hana + pending unclaimed creator mirror moves into `principalId`'s ledger. Idempotent for the same recorded principal; a different recorded principal is rejected. Upstream Claim owns proof validation. */
    onClaimed(context: WriteContext, hanaId: string, principalId: string, sourceRef?: string): Promise<ClaimPointsResult>;
    /** Cookie session or device signature (identity `deviceAuth`, same headers as `/v1/identity/me`). */
    getOwnPoints(credentials: SessionCredentials, device?: DeviceAuthRequest): Promise<OwnPointsDTO>;
    getHanaPoints(hanaId: string): Promise<HanaPointsDTO>;
    runOutboxOnce(now: Date): Promise<OutboxRunResult>;
    issueWithdrawVoucher(credentials: SessionCredentials, input: {
        address: string;
        asset: string;
        amount: string;
        nonce?: string;
    }, context?: WriteContext): Promise<WithdrawVoucher>;
    verifyVoucher(voucher: WithdrawVoucher): Promise<VoucherVerification>;
    verifyVoucherByNonce(nonce: string): Promise<VoucherVerification>;
    voidExpiredVouchers(now: Date, context?: WriteContext): Promise<readonly string[]>;
    listOwnLedger(credentials: SessionCredentials, after?: string, limit?: number): Promise<readonly OwnLedgerEntryDTO[]>;
    /** Cookie session or device signature. Scored usage events of the caller's own devices whose points are still pending; keyset paging like the ledger. */
    listOwnPendingEvents(credentials: SessionCredentials, device?: DeviceAuthRequest, after?: string, limit?: number): Promise<readonly PendingPointsEventDTO[]>;
    listOwnBalances(credentials: SessionCredentials): Promise<readonly BalanceDTO[]>;
    listOwnIntents(credentials: SessionCredentials): Promise<readonly IntentDTO[]>;
    getSigner(): {
        keyId: string;
        algorithm: 'ed25519';
        publicKey: string;
    };
    getHanaClaimSummary(hanaId: string): Promise<HanaClaimSummaryDTO>;
}
export type CustodyIdentityPort = Pick<IdentityServices, 'authenticate' | 'principalLinks'> & Partial<Pick<IdentityServices, 'deviceAuth'>>;
export interface CustodyModuleOptions {
    readonly snapshots?: import('./snapshots/contracts.js').SnapshotPorts;
    readonly pool: SqlPool;
    readonly identity: CustodyIdentityPort;
    readonly points: PointsPolicy;
    readonly unitOfWork: UnitOfWork;
    readonly executor: ChainExecutor;
    readonly signer: VoucherSigner;
    readonly allowedOrigins: readonly string[];
    readonly claimSummaryProvider?: ClaimSummaryProvider;
    readonly withdrawEnabled?: boolean;
    readonly voucherTtlMs?: number;
    readonly outboxMaxAttempts?: number;
    readonly now?: () => Date;
    readonly randomUUID?: () => string;
}
export interface CustodyModule {
    readonly snapshots?: import('./snapshots/contracts.js').SnapshotService;
    readonly plugin: FastifyPluginAsync;
    readonly service: CustodyService;
    close(): Promise<void>;
}
export type * from './snapshots/contracts.js';
