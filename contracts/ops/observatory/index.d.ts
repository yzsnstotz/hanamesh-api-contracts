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
export interface ObservatoryIncome {
  readonly accounting: 'revenue' | 'custodial' | 'asset';
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
export interface ObservatoryHealth {
  readonly status: 'healthy' | 'degraded' | 'paused' | 'failed' | 'unknown';
  readonly lastSuccessAt: string | null;
  readonly failures: number | null;
  readonly failureWindow: ObservatoryWindow | null;
  readonly paused: boolean | null;
  readonly reason: string | null;
  readonly attention: 'owner' | 'operations' | 'none' | 'unknown';
}
export interface ObservatoryParameter {
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
