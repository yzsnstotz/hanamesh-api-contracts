import type { SessionCredentials, WriteContext } from '../provider.js';
export type Hex = `0x${string}`;
/** Already verified successful P19 issuer receipt, never an untrusted client receipt. Issuance facts only: no signing clock (CR-ROOT-AUTH-VALIDITY-1). */
export interface ConfirmedLaunch {
    readonly requestId: string;
    readonly hanaId: string;
    readonly principalId: string;
    readonly chainId: number;
    readonly hanaKey: Hex;
    readonly requestKey: Hex;
    readonly issuer: Hex;
    readonly token: Hex;
    readonly distributor: Hex;
    readonly reservedDistributor: Hex;
    readonly platformWallet: Hex;
    readonly ordinarySigner: Hex;
    readonly reservedSigner: Hex;
    readonly authorizationHash: Hex;
    readonly subject: Hex;
    readonly sourceCommitment: Hex;
    readonly transactionHash: Hex;
    readonly blockNumber: string;
    readonly paidToken: Hex;
    readonly paidAmount: string;
    readonly initialPoolAmount: string;
    readonly tokenDecimals: number;
    readonly confirmedAt: string;
    readonly claimWindowSeconds: string;
}
/** Launch facts frozen at the cut. rootValidUntil is Custody's RootAuthorization submission expiry (ordinary deadline / reserved validUntil), never a claim deadline. */
export interface FrozenLaunch extends ConfirmedLaunch {
    readonly rootValidUntil: string;
}
/** Required engineering setting; no default. Unix-seconds validity added to the cut acceptedAt for the unsigned root payloads. */
export interface SnapshotSettings {
    readonly rootAuthorizationValiditySeconds: number;
}
export interface SnapshotSettingsView {
    readonly schema: 'hanamesh-custody-snapshot-settings-v1';
    readonly settings: readonly {
        readonly name: 'rootAuthorizationValiditySeconds';
        readonly value: number;
        readonly unit: 'seconds';
        readonly required: true;
        readonly default: null;
        readonly scope: string;
        readonly consequence: string;
    }[];
}
export interface SnapshotHolder {
    readonly entitlementId: Hex;
    readonly kind: 'principal' | 'unbound_device' | 'unclaimed_creator' | 'initiator';
    readonly holderRef: string;
    readonly principalId: string | null;
    readonly pointsMilli: string;
    readonly account: Hex;
    readonly walletBindingId: string | null;
    readonly reserved: boolean;
}
export interface PolicyAllocation {
    readonly source: string;
    readonly mode: 'test-only' | 'production';
    readonly amounts: readonly {
        readonly entitlementId: Hex;
        readonly amount: string;
    }[];
    readonly platformDust: string;
    readonly reservedDust: string;
}
/** Required sourced policy. Test input is explicitly permitted only in test-only composition. No default provider. */
export interface AllocationPolicyPort {
    allocate(input: {
        readonly launch: ConfirmedLaunch;
        readonly pMilli: string;
        readonly rMilli: string;
        readonly dMilli: string;
        readonly holders: readonly SnapshotHolder[];
    }, context: WriteContext): Promise<PolicyAllocation>;
}
export interface WalletFact {
    readonly principalId: string;
    readonly chainId: number;
    readonly address: string;
    readonly boundAt: string;
    readonly source: 'eoa-message-signature';
    readonly deploymentId: string;
}
export interface SnapshotWalletPort {
    getBinding(input: {
        principalId: string;
        chainId: number;
    }, context: WriteContext): Promise<WalletFact | null>;
}
export interface ReservedOpening {
    readonly requestId: string;
    readonly chainId: number;
    readonly transactionHash: Hex;
    readonly distributor: Hex;
    readonly batchId: Hex;
    readonly token: Hex;
    readonly root: Hex;
    readonly totalAmount: string;
    readonly nonce: string;
    readonly fundedAmount: string;
    readonly blockNumber: string;
    readonly openedAt: string;
    readonly claimDeadline: string;
}
export interface SnapshotPorts {
    readonly mode: 'test-only' | 'production';
    readonly settings: SnapshotSettings;
    readonly admissions: {
        getConfirmedLaunch(input: {
            requestId: string;
        }, context: WriteContext): Promise<ConfirmedLaunch | null>;
    };
    readonly wallets: SnapshotWalletPort;
    readonly allocation?: AllocationPolicyPort;
    readonly confirmations?: DistributionConfirmationPort;
    readonly openings: {
        getConfirmedOpening(input: {
            requestId: string;
            transactionHash: Hex;
        }, context: WriteContext): Promise<ReservedOpening | null>;
    };
}
export interface RootPayload {
    readonly domain: {
        readonly name: string;
        readonly version: string;
        readonly chainId: number;
        readonly verifyingContract: Hex;
    };
    readonly primaryType: 'RootAuthorization';
    readonly types: Readonly<Record<string, readonly {
        readonly name: string;
        readonly type: string;
    }[]>>;
    readonly message: Readonly<Record<string, string>>;
}
export interface RootLeaf {
    readonly entitlementId?: Hex;
    readonly account: Hex;
    readonly amount: string;
    readonly leaf: Hex;
    readonly proof: readonly Hex[];
}
export interface RootOutput {
    readonly root: Hex;
    readonly totalAmount: string;
    readonly payload: RootPayload;
    readonly digest: Hex;
    readonly leaves: readonly RootLeaf[];
}
export interface SnapshotDistribution {
    readonly batchId: Hex;
    readonly ordinary: RootOutput;
    readonly reserved: RootOutput | null;
    readonly platformDust: string;
    readonly reservedDust: string;
}
export interface LaunchSnapshot {
    readonly id: string;
    readonly requestId: string;
    readonly hanaId: string;
    readonly principalId: string;
    readonly acceptedAt: string;
    readonly launch: FrozenLaunch;
    readonly pMilli: string;
    readonly rMilli: string;
    readonly dMilli: string;
    readonly holders: readonly SnapshotHolder[];
    readonly policy: {
        readonly source: string;
        readonly mode: 'test-only' | 'production';
    };
    /** Provenance of launch.rootValidUntil: acceptedAt seconds + the setting value at the cut. */
    readonly rootAuthorization: {
        readonly setting: 'rootAuthorizationValiditySeconds';
        readonly validitySeconds: string;
        readonly validUntil: string;
    };
    readonly distribution: SnapshotDistribution;
    readonly opening: ReservedOpening | null;
    readonly completion: DistributionCompletion | null;
    readonly outboxIntentId: string;
}
/** Only persisted own frozen-holder relations; empty is authoritative for this scope, never pending/unproduced rights. */
export interface BeneficiarySnapshotDiscovery {
    readonly schema: 'hanamesh-beneficiary-snapshots-v1';
    readonly principalId: string;
    readonly scope: 'persisted-frozen-holders';
    readonly status: 'found' | 'empty';
    readonly items: readonly {
        readonly requestId: string;
        readonly snapshotId: string;
        readonly hanaId: string;
        readonly policy: {
            readonly mode: 'test-only' | 'production';
            readonly testOnly: boolean;
        };
    }[];
}
/** Read-only persisted issuer distribution-v2 completion. No user claim acknowledgement or current funding assertion. */
export interface BeneficiaryDistributionAcknowledgement {
    readonly schema: 'hanamesh-beneficiary-distribution-ack-v1';
    readonly requestId: string;
    readonly snapshotId: string;
    readonly hanaId: string;
    readonly principalId: string;
    readonly chainId: number;
    readonly token: Hex;
    readonly hanaKey: Hex;
    readonly batchId: Hex;
    readonly policy: {
        readonly mode: 'test-only' | 'production';
        readonly testOnly: boolean;
    };
    readonly status: 'acknowledged' | 'unknown';
    readonly completedAt: string | null;
    readonly acknowledgement: {
        readonly schema: 'hanamesh-distribution-result-v2';
        readonly resultId: Hex;
        readonly readback: DistributionConfirmation['readback'];
    } | null;
}
export interface SnapshotService {
    /** Host/admin readback of the required snapshot settings and their current values. */
    readSettings(): SnapshotSettingsView;
    /** Canonical actor from authentication only; no caller-supplied selector or issuer readOwn permission. */
    listBeneficiarySnapshots(credentials: SessionCredentials): Promise<BeneficiarySnapshotDiscovery>;
    readDistributionAcknowledgement(credentials: SessionCredentials, requestId: string): Promise<BeneficiaryDistributionAcknowledgement>;
    admit(credentials: SessionCredentials, requestId: string): Promise<LaunchSnapshot>;
    readOwn(credentials: SessionCredentials, requestId: string): Promise<LaunchSnapshot>;
    /** Trusted host consumer reads the persisted outbox/root payload using a host executor. */
    readForHost(requestId: string, context: WriteContext): Promise<LaunchSnapshot | null>;
    /** Host-only: lookup trusted result by stored identities; never accept a caller receipt/result. */
    acknowledgeForHost(requestId: string, context: WriteContext): Promise<LaunchSnapshot>;
    recordOpening(credentials: SessionCredentials, input: {
        requestId: string;
        transactionHash: Hex;
    }): Promise<LaunchSnapshot>;
    /** Read only: the authenticated canonical principal's own entitlements, leaves and proofs in one snapshot. Never another holder's. */
    readEntitlements(credentials: SessionCredentials, requestId: string): Promise<BeneficiaryEntitlementView>;
}
/**
 * hanamesh-beneficiary-entitlements-v1. Projection of the persisted snapshot for one canonical principal.
 * Ordinary amounts are the cumulative leaf of the principal's single frozen wallet (no per-entitlement amount is invented).
 * Pending entitlements are zero-account reserved leaves and are unclaimable until a lawful owning replacement.
 * One account binds at most one wallet and one wallet belongs to at most one account (owner, Q-2026-10-09-P19-SHARED-WALLET-VIEW);
 * a snapshot violating that is illegal input and every read rejects with CUSTODY_WALLET_BINDING_CONFLICT.
 */
export interface BeneficiaryEntitlement {
    readonly entitlementId: Hex;
    readonly kind: 'principal' | 'initiator';
    readonly status: 'bound' | 'pending';
    readonly route: 'ordinary' | 'reserved';
    readonly account: Hex;
    readonly walletBindingId: string | null;
}
export interface BeneficiaryOrdinaryEntry {
    readonly account: Hex;
    readonly cumulativeAmount: string;
    readonly leaf: Hex;
    readonly proof: readonly Hex[];
    readonly claimable: true;
}
export interface BeneficiaryReservedEntry {
    readonly entitlementId: Hex;
    readonly account: Hex;
    readonly cumulativeAmount: string;
    readonly leaf: Hex;
    readonly proof: readonly Hex[];
    readonly claimable: boolean;
}
export interface BeneficiaryEntitlementView {
    readonly schema: 'hanamesh-beneficiary-entitlements-v1';
    readonly requestId: string;
    readonly snapshotId: string;
    readonly hanaId: string;
    readonly principalId: string;
    readonly chainId: number;
    readonly token: Hex;
    readonly hanaKey: Hex;
    readonly batchId: Hex;
    readonly policy: {
        readonly mode: 'test-only' | 'production';
        readonly testOnly: boolean;
    };
    readonly entitlements: readonly BeneficiaryEntitlement[];
    readonly ordinary: {
        readonly contract: Hex;
        readonly root: Hex;
        readonly nonce: string;
        readonly entries: readonly BeneficiaryOrdinaryEntry[];
    };
    readonly reserved: {
        readonly contract: Hex;
        readonly batchId: Hex;
        readonly root: Hex;
        readonly nonce: string;
        readonly openedAt: string | null;
        readonly claimDeadline: string | null;
        readonly entries: readonly BeneficiaryReservedEntry[];
    } | null;
    /** Existing Identity wallet binding vs the frozen leaf account; leaves still pay the frozen account. null when nothing is bound. */
    readonly wallet: {
        readonly chainId: number;
        readonly currentBindingMatches: boolean | null;
    };
    readonly provenance: {
        readonly acceptedAt: string;
        readonly openingRecorded: boolean;
        readonly completedAt: string | null;
    };
}
/** Chain owns canonical receipt/calldata/log/funding verification. Custody validates correspondence, not RPC. */
export interface CanonicalDistributionReceipt {
    readonly transactionHash: Hex;
    readonly blockHash: Hex;
    readonly blockNumber: string;
    readonly blockTimestamp: string;
    readonly to: Hex;
    readonly status: 'success' | 'reverted' | 'unknown';
    readonly canonical: boolean;
}
export interface DistributionRootFact {
    readonly contract: Hex;
    readonly token: Hex;
    readonly root: Hex;
    readonly totalAmount: string;
    readonly nonce: string;
    readonly digest: Hex;
    readonly signer: Hex;
    readonly rootReceipt: CanonicalDistributionReceipt | null;
}
/**
 * Ordinary amounts are uint256 decimal strings read at the same canonical `readback` block.
 * remainingBalance = token.balanceOf(Distributor); totalClaimed = Distributor.distributions(hanaKey).totalClaimed
 * (every ordinary claim, including the reserved route); reservedAmount = Distributor.reserved(token), the contract-wide
 * unpaid aggregate for this token (not this snapshot's reserved budget).
 */
export interface OrdinaryDistributionFact extends DistributionRootFact {
    readonly initialFundedAmount: string;
    readonly remainingBalance: string;
    readonly totalClaimed: string;
    readonly reservedAmount: string;
    readonly fundingReceipt: CanonicalDistributionReceipt | null;
}
export interface ReservedDistributionFact extends DistributionRootFact {
    readonly fundedAmount: string;
    readonly fundingReceipt: CanonicalDistributionReceipt | null;
    readonly opening: ReservedOpening;
}
export interface DistributionConfirmation {
    readonly schema: 'hanamesh-distribution-result-v2';
    readonly mode: 'test-only' | 'production';
    readonly source: string;
    readonly status: 'complete' | 'partial' | 'unknown' | 'reverted';
    readonly resultId: Hex;
    readonly requestId: string;
    readonly snapshotId: string;
    readonly outboxIntentId: string;
    readonly principalId: string;
    readonly hanaId: string;
    readonly chainId: number;
    readonly issuer: Hex;
    readonly token: Hex;
    readonly hanaKey: Hex;
    readonly batchId: Hex;
    readonly authorizationHash: Hex;
    readonly sourceCommitment: Hex;
    readonly issuanceTransactionHash: Hex;
    readonly readback: {
        readonly blockNumber: string;
        readonly blockHash: Hex;
        readonly canonical: boolean;
    };
    readonly ordinary: OrdinaryDistributionFact | null;
    readonly reserved: ReservedDistributionFact | null;
}
export interface DistributionConfirmationPort {
    getResult(input: {
        readonly requestId: string;
        readonly snapshotId: string;
        readonly outboxIntentId: string;
    }, context: WriteContext): Promise<DistributionConfirmation | null>;
}
export interface DistributionCompletion {
    readonly completedAt: string;
    readonly result: DistributionConfirmation;
}
