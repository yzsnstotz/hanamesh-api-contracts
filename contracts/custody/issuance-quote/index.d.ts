export type IssuanceQuoteStatus = 'queued' | 'computing' | 'held' | 'signed' | 'expired' | 'failed';

export interface IssuanceQuoteRequest {
  readonly campaignId: string;
  readonly quote: string;
  readonly issuerEarlyReleaseOptIn: boolean;
}

export interface IssuanceFreezeRequest extends IssuanceQuoteRequest {
  readonly snapshotHash: `0x${string}`;
  readonly emptyConfirmation?: boolean;
}

interface IssuerAmounts {
  readonly amount: string;
  readonly userAmount: string;
  readonly creatorAmount: string;
  readonly launchInitiatorAmount: string;
}

interface QuoteFailure {
  readonly code: string;
  readonly message: string;
}

interface QualificationPointFields<T> {
  readonly userPoints: T;
  readonly creatorMirrorPoints: T;
  readonly claimBonusPoints: T;
  readonly totalPoints: T;
}

type QualificationSources =
  | (QualificationPointFields<string> & {readonly status: 'available'})
  | (QualificationPointFields<null> & {readonly status: 'legacy-unavailable'});

export interface IssuanceQuoteRecipient extends IssuerAmounts {
  readonly holderId: string;
  readonly isIssuer: boolean;
  readonly isSelf: boolean;
  readonly isLaunchInitiator: boolean;
  readonly qualificationSources: QualificationSources;
}

interface AllocationBasis {
  readonly budget: string;
  readonly platformAmount: string;
}

type AllocationRoute = 'ordinary' | 'empty' | 'no-airdrop';

interface ZeroQualified {
  readonly known: true;
  readonly active: boolean;
  readonly severity: 'danger' | 'none';
  readonly requiresIssuerConfirmation: boolean;
  readonly copy: {
    readonly code: 'ZERO_QUALIFIED_PLATFORM_RESERVE';
    readonly version: string;
    readonly heading: string;
    readonly message: string;
    readonly confirmationLabel: string | null;
  };
}

export interface IssuanceQuoteAllocation extends AllocationBasis {
  readonly schema: 'hanamesh-issuance-allocation-preview-v1';
  readonly evidence: 'FIXTURE' | 'TRUSTED';
  readonly hanaId: string;
  readonly requestId: string;
  readonly principalId: string;
  readonly campaignId: string;
  readonly asOf: string;
  readonly policyVersion: number;
  readonly settingsVersion: number;
  readonly snapshotHash: `0x${string}`;
  readonly parameters: {
    readonly pointsBps: number;
    readonly earlyReleaseAllowed: boolean;
    readonly quote: string;
    readonly launchFeeWei: string;
  };
  readonly route: AllocationRoute;
  readonly qualifiedHolderCount: number;
  readonly holderCountBasis: 'positive-qualified-points';
  readonly qualifiedPoints: string;
  readonly issuer: IssuerAmounts & {readonly shareBps: number; readonly budget: string};
  readonly maturing: {readonly points: string; readonly nextMaturesAt: string | null};
  readonly topLimit: number;
  readonly topRecipients: readonly IssuanceQuoteRecipient[];
  readonly launchInitiator: {readonly holderId: string; readonly amount: string};
  readonly top10Amount: string;
  readonly creatorHolderKind: 'claimed' | 'unclaimed' | 'none';
  readonly recipientCount: number;
  readonly reconciliation: AllocationBasis & {
    readonly recipientsAmount: string;
    readonly topRecipientsAmount: string;
    readonly otherRecipientsAmount: string;
    readonly userAmount: string;
    readonly creatorAmount: string;
    readonly launchInitiatorAmount: string;
  };
  readonly userBudget: string;
  readonly accountCapWithheld: string;
  readonly platformWithheld: string;
  readonly roundingDust: string;
  readonly remainderDestination: 'platform';
  readonly thresholds: {
    readonly status: 'configured' | 'unconfigured';
    readonly missing: readonly string[];
    readonly lowQualifiedHolders: number | null;
    readonly highIssuerShareBps: number | null;
  };
  readonly warnings: {readonly lowQualifiedHolders: boolean | null; readonly highIssuerShare: boolean | null};
  readonly zeroQualified: ZeroQualified;
}

export interface IssuanceFrozenAllocation extends Omit<IssuanceQuoteAllocation, 'issuer'> {
  readonly issuer: {readonly amount: string; readonly shareBps: number; readonly budget: string}
    & Partial<Omit<IssuerAmounts, 'amount'>>;
  readonly reservationId: string | null;
  readonly frozenAt: string;
  readonly quoteExpiresAt: string | null;
  readonly issuerEarlyReleaseOptIn: boolean;
  readonly confirmation: {
    readonly principalId: string;
    readonly confirmedAt: string;
    readonly copyVersion: string;
    readonly accepted: true;
  } | null;
}

export interface IssuanceQuoteSummary {
  readonly schema: 'hanamesh-issuance-quote-summary-v1';
  readonly requestId: string;
  readonly hanaId: string;
  readonly principalId: string;
  readonly status: IssuanceQuoteStatus;
  readonly computedAt: string;
  readonly heldAt: string | null;
  readonly expiresAt: string | null;
  readonly frozenAt: string | null;
  readonly failureCode: string | null;
  readonly contributorCount: number | null;
  readonly recipientCount: number | null;
  readonly budget: string | null;
  readonly categories: {
    readonly contributors: string;
    readonly author: string;
    readonly launchInitiator: string;
    readonly platformWithheld: string;
    readonly roundingDust: string;
  } | null;
  readonly top10Amount: string | null;
  readonly issuer: IssuerAmounts | null;
  readonly snapshotHash: `0x${string}` | null;
}

export interface IssuanceQuoteView {
  readonly schema: 'hanamesh-issuance-quote-v1';
  readonly hanaId: string;
  readonly requestId: string;
  readonly principalId: string;
  readonly campaignId: string;
  readonly issuerEarlyReleaseOptIn: boolean;
  readonly status: IssuanceQuoteStatus;
  readonly contributorCount: number | null;
  readonly estimatedSeconds: number | null;
  readonly queuedAt: string;
  readonly queuePosition: number | null;
  readonly queueEtaSeconds: number | null;
  readonly computeStartedAt: string | null;
  readonly pointsCutoffAt: string | null;
  readonly heldAt: string | null;
  readonly expiresAt: string | null;
  readonly frozenAt: string | null;
  /** Recorded on-chain deadline rendered as a UTC timestamp. */
  readonly signatureDeadline: string | null;
  readonly serverNow: string;
  readonly failure: QuoteFailure | null;
  readonly summary: IssuanceQuoteSummary | null;
  readonly allocation: IssuanceQuoteAllocation | null;
}

export interface IssuanceQuoteRecipientsQuery {
  readonly after?: string;
  readonly limit?: string;
}

export interface IssuanceQuoteRecipientsPage {
  readonly schema: 'hanamesh-issuance-quote-recipients-v1';
  readonly requestId: string;
  readonly snapshotHash: `0x${string}`;
  readonly total: number;
  readonly items: readonly (IssuanceQuoteRecipient & {readonly rank: number})[];
  readonly next: number | null;
}

export interface IssuanceLaunchSupplyQuery extends Omit<IssuanceQuoteRequest, 'issuerEarlyReleaseOptIn'> {
  readonly issuerEarlyReleaseOptIn: 'true' | 'false';
  readonly allocationState: 'quote' | 'frozen';
}

export interface IssuanceLaunchSupply {
  readonly schema: 'hanamesh-custody-launch-supply-v1';
  readonly scope: {
    readonly deploymentId: string;
    readonly chainId: number;
    readonly launcher: string;
    readonly hanaId: string;
    readonly requestId: string;
    readonly campaignId: string;
    readonly allocationState: 'quote' | 'frozen';
    readonly snapshotHash: `0x${string}`;
  };
  readonly allocation: IssuanceQuoteAllocation | IssuanceFrozenAllocation;
  readonly pointsBps: number;
  readonly airdropAmount: string;
  readonly recipientsAmount: string;
  readonly airdropRedirectToPlatform: string;
  readonly redirectIsSubsetOfAirdrop: true;
  readonly route: AllocationRoute;
  readonly zeroQualified: ZeroQualified;
  readonly executed: false;
  readonly source: {
    readonly owner: 'custody';
    readonly schema: IssuanceQuoteAllocation['schema'];
    readonly evidence: IssuanceQuoteAllocation['evidence'];
    readonly policyVersion: number;
    readonly settingsVersion: number;
    readonly asOf: string;
    readonly frozenAt: string | null;
  };
  readonly unknowns: readonly (
    | {readonly field: 'execution'; readonly reason: 'CHAIN_EXECUTION_NOT_OBSERVED'}
    | {readonly field: 'walletBalances'; readonly reason: 'WALLET_BALANCES_NOT_OBSERVED'}
  )[];
}

interface IssuancePointTotals {
  readonly points: string;
  readonly sources: number;
}

export interface OwnIssuancePointPhases {
  readonly schema: 'hanamesh-issuance-point-phase-v1';
  readonly hanaId: string;
  readonly principalId: string;
  readonly status: 'not-issued' | 'issuing' | 'issued';
  readonly requestId: string | null;
  readonly asOf: string | null;
  readonly pointsCutoffAt: string | null;
  readonly preIssuance: IssuancePointTotals;
  readonly postIssuance: IssuancePointTotals;
}

export const ISSUANCE_ALLOCATION_PATH: '/v1/custody/issuance-allocation/:hanaId/requests/:requestId';
export const OWN_ISSUANCE_POINT_PHASES_PATH: '/v1/custody/issuance-allocation/:hanaId/point-phases/me';
