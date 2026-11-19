/** Read-only observatory values. Providers own definitions, authorization and aggregation. */
export interface ObservatorySource {
  readonly module: string;
  readonly port: string;
  readonly definition: string;
  /** Provider watermark, never replaced by the Host request time. Null means not yet known. */
  readonly asOf: string | null;
}
export type ObservatoryMetric<T> = {
  readonly id: string;
  readonly source: ObservatorySource;
} & (
  | {readonly availability: 'available'; readonly value: T}
  | {readonly availability: 'pending'; readonly reason: string; readonly value?: never}
  | {readonly availability: 'manual'; readonly value: T | null}
);
export interface ObservatoryWindow {readonly from: string; readonly to: string}
export interface ObservatoryNetwork {
  readonly chainId: number;
  readonly kind: 'testnet' | 'mainnet';
  readonly blockNumber: string;
}
/** Integer base units; never a floating point conversion or a cross-currency sum. */
export interface ObservatoryAmount {
  readonly amount: string;
  readonly currency: string;
  readonly decimals: number;
  /** Null for off-chain amounts. */
  readonly network: ObservatoryNetwork | null;
}
export interface ObservatoryAmountBucket extends ObservatoryWindow {readonly amounts: readonly ObservatoryAmount[]}
/** Actual HanaSwap Factory controls at one confirmed block; zero feeTo disables new fees. */
export interface ObservatoryProtocolFeeSettings {
  readonly factory: string;
  readonly feeTo: string;
  readonly feeToSetter: string;
  readonly platformWallet: string;
  readonly enabled: boolean;
  readonly platformIsRecipient: boolean;
  readonly rateBps: 5;
  readonly network: ObservatoryNetwork;
}
/** Current LP holdings, not a cumulative fee ledger or realized cash income. */
export interface ObservatoryProtocolFeePosition {
  readonly pool: string;
  readonly lpBalance: string;
  readonly totalSupply: string;
  readonly withdrawalSupply: string;
  /** Fee LP that would be minted by the next mint/burn, separate from held LP. */
  readonly unmintedProtocolLp: string;
  readonly share: {readonly numerator: string; readonly denominator: string};
  readonly withdrawable: readonly [ObservatoryAmount, ObservatoryAmount];
}
export interface ObservatoryProtocolFeePage {
  readonly settings: ObservatoryProtocolFeeSettings;
  readonly scope: 'explicit-pool-page';
  readonly positions: readonly ObservatoryProtocolFeePosition[];
}
export interface ObservatoryIncome {
  readonly accounting: 'revenue' | 'custodial' | 'asset';
  readonly protocolFees?: ObservatoryProtocolFeePage;
  readonly amounts: readonly ObservatoryAmount[];
  readonly window?: ObservatoryWindow;
  readonly series?: readonly ObservatoryAmountBucket[];
}
export interface ObservatorySpending {
  readonly amounts: readonly ObservatoryAmount[];
  readonly funding: 'cash' | 'credit' | 'chain';
  readonly window?: ObservatoryWindow;
  readonly series?: readonly ObservatoryAmountBucket[];
  /** Reservations and unknown charges are separate from actual spending. */
  readonly reserved?: readonly ObservatoryAmount[];
  readonly unknown?: readonly ObservatoryAmount[];
}
export interface ObservatoryCountBucket extends ObservatoryWindow {readonly count: number}
export interface ObservatoryRatio {readonly numerator: number; readonly denominator: number; readonly value: number | null}
export interface ObservatoryPeople {
  readonly unit: 'people' | 'accounts' | 'devices' | 'events' | 'hanas' | 'posts' | 'agents' | 'wallets';
  readonly count: number;
  readonly series: readonly ObservatoryCountBucket[];
  readonly window?: ObservatoryWindow;
  readonly previousCount?: number;
  readonly ratio?: ObservatoryRatio;
  /** Segments may overlap. Providers must independently deduplicate the total. */
  readonly breakdown?: readonly {readonly label: string; readonly count: number}[];
}
/** Host-observed terminal reports. Progress/queued/started remain liveness facts, not result history. */
export interface ObservatoryJobReport {readonly kind:'ok'|'failed'|'skipped';readonly receivedAt:string;readonly code:string|null;readonly reason:string|null}
export interface ObservatoryJobResult {readonly eventId:string;readonly sequence:string;readonly runId:string;readonly outcome:'ok'|'failed'|'skipped';readonly recordedAt:string;readonly persistedAt:string;readonly code:string|null;readonly reason:string|null;readonly reports:readonly ObservatoryJobReport[]}
export interface ObservatoryJobDeclaration {readonly tags:readonly string[];readonly resources:readonly ('db'|'rpc'|'ai')[];readonly schedule?:{readonly pattern:string;readonly kind?:'interval'|'after-completion'|'once'|'manual';readonly start:'after-interval'|'immediate'|'scheduled'|'manual';readonly healthIntervalMs:number;readonly options:{readonly protect:true;readonly interval?:number;readonly timezone?:string}};readonly singleInstance?:{readonly scope:'instance'}}
export interface ObservatoryJobHealth {
 readonly instanceId:string;readonly moduleId:string;readonly jobName:string;readonly healthIntervalMs:number;readonly declaration?:ObservatoryJobDeclaration;
 readonly availability:'available'|'pending';readonly source:ObservatorySource;readonly coverageStartedAt:string|null;
 readonly status:'healthy'|'degraded'|'paused'|'failed'|'unknown';readonly lastSuccessAt:string|null;readonly lastFailureAt:string|null;
 readonly latestResult:'ok'|'failed'|'skipped'|null;readonly latestResultAt:string|null;
 readonly failures:number|null;readonly failureWindow:ObservatoryWindow|null;readonly paused:boolean|null;readonly reason:string|null;
 readonly results:readonly ObservatoryJobResult[];
}
export interface ObservatoryJobHistory {readonly instanceId:string;readonly jobs:readonly ObservatoryJobHealth[]}
export interface ObservatoryHealth {
  /** Host-owned result history. Each actual registered job carries its own availability and watermark. */
  readonly jobHistory?:ObservatoryJobHistory;
  readonly status: 'healthy' | 'degraded' | 'paused' | 'failed' | 'unknown';
  readonly lastSuccessAt: string | null;
  readonly failures: number | null;
  readonly failureWindow: ObservatoryWindow | null;
  readonly paused: boolean | null;
  readonly reason: string | null;
  readonly attention: 'owner' | 'operations' | 'none' | 'unknown';
}
export interface ObservatoryParameter {
  readonly protocolFee?: ObservatoryProtocolFeeSettings;
  readonly value: string | number | boolean | null;
  readonly unit: string;
  readonly changedBy: 'owner' | 'operations' | 'admin' | 'contract';
  readonly effective: 'running' | 'pending-restart' | 'default' | 'pending-implementation';
  readonly meaning: string;
  readonly impact: string;
}
export interface ObservatorySections {
  readonly income: readonly ObservatoryMetric<ObservatoryIncome>[];
  readonly spending: readonly ObservatoryMetric<ObservatorySpending>[];
  readonly people: readonly ObservatoryMetric<ObservatoryPeople>[];
  readonly health: readonly ObservatoryMetric<ObservatoryHealth>[];
  readonly parameters: readonly ObservatoryMetric<ObservatoryParameter>[];
}
/** A module exports its own contribution; no module/metric/task list is encoded by Host. */
export interface ObservatoryContribution extends ObservatorySections {readonly module: string}
export interface ObservatoryResponse extends ObservatorySections {
  readonly schemaVersion: 1;
  readonly generatedAt: string;
  readonly timezone: 'UTC';
}
export declare const OBSERVATORY_SCHEMA: Readonly<Record<string, unknown>>;
export declare const OBSERVATORY_CONTRIBUTION_SCHEMA: Readonly<Record<string, unknown>>;

/** Trusted server read context. HTTP authentication is supplied by Host; a provider retains its own stricter policy. */
export interface ObservatoryReadContext {
  readonly credentials: {readonly cookie?: string};
  readonly principalId: string;
  /** UTC request cutoff; source.asOf remains the provider watermark. */
  readonly at: string;
}
/** Module-owned stable declarations permit source-local pending values without inventing a Host metric registry.
 * declaration metrics must be pending (or an unregistered manual null); read must return exactly the declared IDs.
 * Absent read means the declared dependency is pending. No queries, refreshes or writes are performed at registration.
 */
export interface ObservatoryReadPort {
  readonly declaration: ObservatoryContribution;
  readonly read?: (context: ObservatoryReadContext) => Promise<ObservatoryContribution>;
}
