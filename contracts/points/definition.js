export const POINTS_CONTRACT_DEFINITION = {
    id: 'C-POINTS', provider: 'server-custody', publicationReview: 'J2S4-APIC-05',
    calls: {
        'GET /v1/custody/me/points': { input: 'SessionCredentials | DeviceAuthRequest', output: 'OwnPointsDTO', errors: ['CUSTODY_AUTH_REQUIRED', 'CUSTODY_UNAVAILABLE'] },
        'GET /v1/custody/me/ledger': { input: 'SessionCredentials + after? + limit?', output: '{items: OwnLedgerEntryDTO[]}', errors: ['CUSTODY_AUTH_REQUIRED', 'CUSTODY_INPUT_INVALID', 'CUSTODY_UNAVAILABLE'] },
        'GET /v1/custody/me/balance': { input: 'SessionCredentials', output: '{balances: BalanceDTO[]}', errors: ['CUSTODY_AUTH_REQUIRED', 'CUSTODY_UNAVAILABLE'] },
        'GET /v1/custody/hanas/:hanaId/summary': { input: 'hanaId', output: 'HanaClaimSummaryDTO', errors: ['CUSTODY_INPUT_INVALID', 'CUSTODY_SUMMARY_INVALID', 'CUSTODY_UNAVAILABLE'] },
        recordUsagePoints: { input: 'WriteContext, UsagePointsEvent', output: 'UsagePointsResult', errors: ['CUSTODY_HOST_TRANSACTION_REQUIRED', 'CUSTODY_INPUT_INVALID', 'CUSTODY_SUMMARY_INVALID'] },
        recordClaimCredit: { input: '{principalId,hanaId,claimId}, WriteContext', output: 'ClaimPointsResult', errors: ['CUSTODY_HOST_TRANSACTION_REQUIRED', 'CUSTODY_INPUT_INVALID', 'CUSTODY_FORBIDDEN'] },
        onDeviceBound: { input: 'WriteContext, deviceId, principalId', output: 'DeviceBoundResult', errors: ['CUSTODY_HOST_TRANSACTION_REQUIRED', 'CUSTODY_INPUT_INVALID'] },
        'POST /v1/custody/launch-snapshots': { input: 'SessionCredentials + {requestId}; host ConfirmedLaunch admission port', output: 'LaunchSnapshot', errors: ['CUSTODY_AUTH_REQUIRED', 'CUSTODY_INPUT_INVALID', 'CUSTODY_ORIGIN_REJECTED', 'CUSTODY_CONTENT_TYPE_REQUIRED', 'CUSTODY_FORBIDDEN', 'CUSTODY_PAYMENT_NOT_CONFIRMED', 'CUSTODY_SNAPSHOT_CONFLICT', 'CUSTODY_ALLOCATION_POLICY_REQUIRED', 'CUSTODY_ALLOCATION_INVALID', 'CUSTODY_WALLET_BINDING_CONFLICT', 'CUSTODY_UNAVAILABLE'] },
        'GET /v1/custody/launch-snapshots/:requestId/entitlements': { input: 'SessionCredentials + requestId', output: 'BeneficiaryEntitlementView', errors: ['CUSTODY_AUTH_REQUIRED', 'CUSTODY_INPUT_INVALID', 'CUSTODY_ALLOCATION_POLICY_REQUIRED', 'CUSTODY_SNAPSHOT_NOT_FOUND', 'CUSTODY_FORBIDDEN', 'CUSTODY_WALLET_BINDING_CONFLICT', 'CUSTODY_UNAVAILABLE'] },
        checkBeneficiaryView: { input: 'BeneficiaryEntitlementView, BeneficiaryViewExpected', output: 'string[] (failed rule IDs; empty means consumable)', errors: [] },
    },
    bindingStatus: { UNBOUND: '只累计、暂不可领', BOUND: '已绑定；不承诺链上领取资格' },
    snapshotSettings: {
        rootAuthorizationValiditySeconds: { input: 'SnapshotPorts.settings.rootAuthorizationValiditySeconds', required: 'each cut', default: null, error: 'CUSTODY_ALLOCATION_POLICY_REQUIRED', need: 'rootAuthorizationValiditySeconds' },
        allocationRemainderRule: { input: 'createProductionAllocationPolicy({allocationRemainderRule:{source,allocate}})', required: 'production cuts with nonzero qualified points', default: null, error: 'CUSTODY_ALLOCATION_POLICY_REQUIRED', need: 'allocationRemainderRule' },
        allocationOutput: { required: ['source', 'mode', 'amounts', 'platformDust', 'reservedDust'], error: 'CUSTODY_ALLOCATION_POLICY_REQUIRED', need: 'exact missing field' },
        readback: 'snapshots.readSettings(): SnapshotSettingsView; host/admin only',
    },
    beneficiaryValidation: {
        port: 'BeneficiaryValidationPort', callable: 'BeneficiaryViewChecker', expected: 'BeneficiaryViewExpected',
        rules: ['SCHEMA', 'CONTEXT', 'POLICY_LABEL', 'ONE_WALLET', 'NO_PER_ENTITLEMENT_AMOUNT', 'PENDING_ZERO_ACCOUNT', 'BOUND_ACCOUNT', 'ISOLATION', 'CLAIMABLE', 'LEAF', 'PROOF'],
        exceptions: 'Typed view only: malformed nested fields, ABI values, integers or proofs may throw; no blanket catch or boolean conversion',
        publicationReview: 'J4S3-APIC-18', evidence: 'provider SOURCE/FIXTURE; not a published shared-contract port',
    },
    invariants: ['bindingStatus comes from verified identity and account binding facts, never points or pending amounts', 'All existing points fields keep their meaning', 'Local cross-module writes use the supplied WriteContext.executor', 'Ledger rows are append-only', 'Chain execution is NOT_CONNECTED'],
};
