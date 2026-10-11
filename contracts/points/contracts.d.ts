export type LedgerKind = 'claim-credit' | 'sponsored-launch' | 'withdraw-hold' | 'withdraw-settle' | 'withdraw-release' | 'adjustment' | 'points-install' | 'points-open' | 'points-use' | 'points-claim-bonus' | 'points-creator-mirror' | 'points-launch-initiator';
export type LedgerDirection = 'credit' | 'debit';
export type IntentState = 'pending' | 'submitted' | 'confirmed' | 'completed' | 'failed';
export interface LedgerEntryDTO {
    readonly id: string;
    readonly principalId: string;
    readonly hanaId: string | null;
    readonly kind: LedgerKind;
    readonly asset: string;
    readonly amount: string;
    readonly direction: LedgerDirection;
    readonly refKind: string | null;
    readonly refId: string | null;
    readonly memo: string | null;
    readonly createdAt: string;
}
export interface BalanceDTO {
    readonly principalId: string;
    readonly asset: string;
    readonly amount: string;
}
export interface IntentDTO {
    readonly id: string;
    readonly kind: 'sponsored-launch' | 'withdraw' | 'points-distribution';
    readonly payload: Readonly<Record<string, unknown>>;
    readonly state: IntentState;
    readonly attempts: number;
    readonly reservationVersion: number;
    readonly nextAttemptAt: string | null;
    readonly chainRef: string | null;
    readonly failureReason: string | null;
    readonly ledgerEntryId: string | null;
    readonly createdAt: string;
    readonly updatedAt: string;
}
export interface UnsignedWithdrawVoucher {
    readonly v: 1;
    readonly nonce: string;
    readonly principalRef: string;
    readonly address: string;
    readonly asset: string;
    readonly amount: string;
    readonly issuedAt: string;
    readonly expiresAt: string;
    readonly chainId: null;
    readonly contract: null;
    readonly signerKeyId: string;
}
export interface WithdrawVoucher extends UnsignedWithdrawVoucher {
    readonly signature: string;
}
export interface VoucherVerification {
    readonly valid: boolean;
    readonly reason?: 'not-found' | 'malformed' | 'signature' | 'expired' | 'redeemed' | 'void';
}
export interface ClaimAssetSummary {
    readonly asset: string;
    readonly claimable: string;
    readonly claimed: string;
    readonly unclaimed: string;
}
export type HanaClaimSummaryDTO = {
    readonly status: 'NOT_CONNECTED';
    readonly hanaId: string;
    readonly assets: readonly [];
} | {
    readonly status: 'CONNECTED';
    readonly hanaId: string;
    readonly assets: readonly ClaimAssetSummary[];
};
export interface OutboxRunResult {
    readonly processed: number;
    readonly transitions: readonly (readonly [IntentState, IntentState])[];
    readonly failed: readonly {
        id: string;
        reason: string;
    }[];
}
export type CustodyErrorCode = 'CUSTODY_AUTH_REQUIRED' | 'CUSTODY_FORBIDDEN' | 'CUSTODY_INPUT_INVALID' | 'CUSTODY_ORIGIN_REJECTED' | 'CUSTODY_CONTENT_TYPE_REQUIRED' | 'CUSTODY_HOST_TRANSACTION_REQUIRED' | 'CUSTODY_WITHDRAW_DISABLED' | 'CUSTODY_INSUFFICIENT_BALANCE' | 'CUSTODY_VOUCHER_NONCE_USED' | 'CUSTODY_SUMMARY_INVALID' | 'CUSTODY_UNAVAILABLE' | 'CUSTODY_ALLOCATION_POLICY_REQUIRED' | 'CUSTODY_ALLOCATION_INVALID' | 'CUSTODY_PAYMENT_NOT_CONFIRMED' | 'CUSTODY_SNAPSHOT_CONFLICT' | 'CUSTODY_SNAPSHOT_NOT_FOUND' | 'CUSTODY_OPENING_NOT_CONFIRMED' | 'CUSTODY_DISTRIBUTION_PROVIDER_REQUIRED' | 'CUSTODY_DISTRIBUTION_NOT_CONFIRMED' | 'CUSTODY_WALLET_BINDING_CONFLICT';
export type PointsEventKind = 'install' | 'open' | 'use' | 'claim_bonus' | 'creator_mirror' | 'launch_initiator';
export type PendingHolderKind = 'unbound_device' | 'unclaimed_creator';
export type UsageAction = 'install' | 'open' | 'use' | 'uninstall';
/** One usage event already de-duplicated by the host (usage module). `principalId` is absent for an unbound device. */
export interface UsagePointsEvent {
    readonly usageEventId: string;
    readonly hanaId: string;
    readonly deviceId: string;
    readonly principalId?: string;
    readonly action: UsageAction;
    readonly occurredAt: string;
}
export interface UsagePointsResult {
    readonly accepted: boolean;
    readonly duplicate: boolean;
    readonly kind: PointsEventKind | null;
    readonly pointsMilli: number;
    readonly holder: 'ledger' | 'pending' | null;
    readonly capped: boolean;
    readonly mirrorMilli: number;
    readonly mirrorHolder: 'ledger' | 'pending' | null;
}
export interface ClaimPointsResult {
    readonly ledgerEntryId: string | null;
    readonly duplicate: boolean;
    readonly claimBonusMilli: number;
    readonly transferredMirrorMilli: number;
}
export interface DeviceBoundResult {
    readonly transferred: readonly {
        readonly hanaId: string;
        readonly pointsMilli: number;
    }[];
}
/** Points are exposed in whole points (milli/1000) as JSON numbers; field names never carry the milli unit. */
export interface PointsBreakdownDTO {
    readonly install: number;
    readonly open: number;
    readonly use: number;
    readonly claimBonus: number;
    readonly creatorMirror: number;
    readonly launchInitiator: number;
}
/** rc.19 per-source split. User points come only from install/open/use/launchInitiator; creator reward only from claimBonus/creatorMirror.
 * The two are never added into each other. `points`, `pending`, `totalPoints` and public `creatorPoints` keep their rc.18 (mixed) meaning. */
export interface UserPointsDTO {
    readonly install: number;
    readonly open: number;
    readonly use: number;
    readonly launchInitiator: number;
    readonly total: number;
}
export interface CreatorRewardDTO {
    readonly claimBonus: number;
    readonly creatorMirror: number;
    readonly total: number;
}
export interface OwnHanaPointsDTO {
    readonly hanaId: string;
    readonly points: number;
    readonly pending: number;
    readonly breakdown: PointsBreakdownDTO;
    /** Bound user points in the ledger. */ readonly userPoints: UserPointsDTO;
    /** Pending (unbound-device) user points, apportioned onto sources exactly as the bind transfer will credit them. Sums to `pending`. */ readonly pendingUserPoints: UserPointsDTO;
    readonly creatorReward: CreatorRewardDTO;
    /** Ledger rows on this Hana's points asset that are neither user nor creator sources (e.g. `adjustment`). Shown separately, never folded in. */ readonly unclassified: number;
}
export interface OwnPointsSubtotalsDTO {
    readonly userPoints: number;
    readonly pendingUserPoints: number;
    readonly creatorReward: number;
    readonly unclassified: number;
}
/** UNBOUND: only accumulates, cannot claim until bound. BOUND: account binding fact only; never chain eligibility. */
export type PointsBindingStatus = 'UNBOUND' | 'BOUND';
export interface OwnPointsDTO {
    readonly bindingStatus: PointsBindingStatus;
    readonly hanas: readonly OwnHanaPointsDTO[];
    readonly totalPoints: number;
    readonly subtotals: OwnPointsSubtotalsDTO;
}
/** Public. `creatorPoints` is the resolved creator's whole net balance on the Hana (includes that principal's own user points);
 * `creatorReward` is the creator-only part (claim bonus + creator mirror), `null` while the Hana has no resolved creator. */
export interface HanaPointsDTO {
    readonly hanaId: string;
    readonly totalPoints: number;
    readonly holders: number;
    readonly creatorPoints: number;
    readonly pendingUnclaimed: number;
    readonly creatorReward: CreatorRewardDTO | null;
}
export type PointsSource = 'user' | 'creator' | 'other';
/** Own ledger row; `pointsSource` is set for points assets (`pts:*`) and null for every other asset. */
export interface OwnLedgerEntryDTO extends LedgerEntryDTO {
    readonly pointsSource: PointsSource | null;
}
/** One scored usage event of a caller's device whose points are still pending (not yet bound into an account). */
export interface PendingPointsEventDTO {
    readonly id: string;
    readonly hanaId: string;
    readonly deviceId: string;
    readonly kind: 'install' | 'open' | 'use' | 'launch_initiator';
    readonly points: number;
    readonly occurredAt: string;
}
