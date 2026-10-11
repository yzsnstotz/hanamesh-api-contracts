/** Provider-owned C-POINTS concrete surface for J2S4-APIC-05 publication review. */
export type { OwnPointsDTO, PointsBindingStatus, OwnHanaPointsDTO, OwnPointsSubtotalsDTO, OwnLedgerEntryDTO, BalanceDTO, HanaClaimSummaryDTO, UsagePointsEvent, UsagePointsResult, ClaimPointsResult, DeviceBoundResult, CustodyErrorCode } from './contracts.js';
export type { CustodyService } from './provider.js';
export type { LaunchSnapshot, BeneficiaryEntitlementView, SnapshotService } from './snapshots/contracts.js';
export declare const POINTS_CONTRACT_DEFINITION: {
    readonly id: "C-POINTS";
    readonly provider: "server-custody";
    readonly publicationReview: "J2S4-APIC-05";
    readonly calls: {
        readonly 'GET /v1/custody/me/points': {
            readonly input: "SessionCredentials | DeviceAuthRequest";
            readonly output: "OwnPointsDTO";
            readonly errors: readonly ["CUSTODY_AUTH_REQUIRED", "CUSTODY_UNAVAILABLE"];
        };
        readonly 'GET /v1/custody/me/ledger': {
            readonly input: "SessionCredentials + after? + limit?";
            readonly output: "{items: OwnLedgerEntryDTO[]}";
            readonly errors: readonly ["CUSTODY_AUTH_REQUIRED", "CUSTODY_INPUT_INVALID", "CUSTODY_UNAVAILABLE"];
        };
        readonly 'GET /v1/custody/me/balance': {
            readonly input: "SessionCredentials";
            readonly output: "{balances: BalanceDTO[]}";
            readonly errors: readonly ["CUSTODY_AUTH_REQUIRED", "CUSTODY_UNAVAILABLE"];
        };
        readonly 'GET /v1/custody/hanas/:hanaId/summary': {
            readonly input: "hanaId";
            readonly output: "HanaClaimSummaryDTO";
            readonly errors: readonly ["CUSTODY_INPUT_INVALID", "CUSTODY_SUMMARY_INVALID", "CUSTODY_UNAVAILABLE"];
        };
        readonly recordUsagePoints: {
            readonly input: "WriteContext, UsagePointsEvent";
            readonly output: "UsagePointsResult";
            readonly errors: readonly ["CUSTODY_HOST_TRANSACTION_REQUIRED", "CUSTODY_INPUT_INVALID", "CUSTODY_SUMMARY_INVALID"];
        };
        readonly recordClaimCredit: {
            readonly input: "{principalId,hanaId,claimId}, WriteContext";
            readonly output: "ClaimPointsResult";
            readonly errors: readonly ["CUSTODY_HOST_TRANSACTION_REQUIRED", "CUSTODY_INPUT_INVALID", "CUSTODY_FORBIDDEN"];
        };
        readonly onDeviceBound: {
            readonly input: "WriteContext, deviceId, principalId";
            readonly output: "DeviceBoundResult";
            readonly errors: readonly ["CUSTODY_HOST_TRANSACTION_REQUIRED", "CUSTODY_INPUT_INVALID"];
        };
        readonly 'POST /v1/custody/launch-snapshots': {
            readonly input: "SessionCredentials + {requestId}; host ConfirmedLaunch admission port";
            readonly output: "LaunchSnapshot";
            readonly errors: readonly ["CUSTODY_AUTH_REQUIRED", "CUSTODY_INPUT_INVALID", "CUSTODY_ORIGIN_REJECTED", "CUSTODY_CONTENT_TYPE_REQUIRED", "CUSTODY_FORBIDDEN", "CUSTODY_PAYMENT_NOT_CONFIRMED", "CUSTODY_SNAPSHOT_CONFLICT", "CUSTODY_ALLOCATION_POLICY_REQUIRED", "CUSTODY_ALLOCATION_INVALID", "CUSTODY_WALLET_BINDING_CONFLICT", "CUSTODY_UNAVAILABLE"];
        };
        readonly 'GET /v1/custody/launch-snapshots/:requestId/entitlements': {
            readonly input: "SessionCredentials + requestId";
            readonly output: "BeneficiaryEntitlementView";
            readonly errors: readonly ["CUSTODY_AUTH_REQUIRED", "CUSTODY_INPUT_INVALID", "CUSTODY_ALLOCATION_POLICY_REQUIRED", "CUSTODY_SNAPSHOT_NOT_FOUND", "CUSTODY_FORBIDDEN", "CUSTODY_WALLET_BINDING_CONFLICT", "CUSTODY_UNAVAILABLE"];
        };
    };
    readonly bindingStatus: {
        readonly UNBOUND: "只累计、暂不可领";
        readonly BOUND: "已绑定；不承诺链上领取资格";
    };
    readonly invariants: readonly ["bindingStatus comes from verified identity and account binding facts, never points or pending amounts", "All existing points fields keep their meaning", "Local cross-module writes use the supplied WriteContext.executor", "Ledger rows are append-only", "Chain execution is NOT_CONNECTED"];
};
