import type {ObservatorySource, ObservatoryWindow} from '../index.js';

type PublishedSnapshot = {
  readonly coveredWindow: ObservatoryWindow;
  readonly snapshotId: string;
  readonly revision: string;
  readonly asOf: string;
};

type SnapshotHead<Schema, Scope> = {
  readonly schema: Schema;
  readonly source: Omit<ObservatorySource, 'asOf'>;
  readonly scope: Scope;
  readonly requestedWindow: ObservatoryWindow;
};

type CompleteSnapshot = PublishedSnapshot & {
  readonly complete: true;
  readonly missing: readonly [];
  readonly nextAfter: string | null;
};

type IncompleteSnapshot = {
  readonly complete: false;
  readonly missing: readonly [string, ...string[]];
} & (
  | (PublishedSnapshot & {readonly nextAfter: string})
  | {
      readonly coveredWindow: ObservatoryWindow | null;
      readonly snapshotId: string | null;
      readonly revision: string | null;
      readonly asOf: string | null;
      readonly nextAfter: null;
    }
);

export interface OpsChainAnchor {
  readonly chainId: number;
  /** Decimal block heights preserve precision beyond JavaScript's safe integers. */
  readonly blockNumber: string;
  readonly blockHash: string;
  readonly confirmations: number;
  readonly reorgCheckedThrough: string | null;
}

/** Coverage describes the authoritative scope and is independent of cursor exhaustion. */
export type OpsCoverageSnapshot = SnapshotHead<'hanamesh-ops-coverage-v1', {
  readonly deploymentId: string;
  readonly scopeId: string;
}> & (CompleteSnapshot | IncompleteSnapshot) & {
  /** Required by the owning provider for chain facts. */
  readonly chainAnchor?: OpsChainAnchor;
};

type SettlementProof<Review, Rows> = {
  readonly acceptanceRevision: Review;
  /** Published total for the whole provider period, including an explicitly proven zero. */
  readonly expectedRows: Rows;
};

/** Server-side provider-period proof. Receipt rows and write authority use their owning contracts. */
export type OpsSettlementSnapshot = SnapshotHead<'hanamesh-ops-settlement-snapshot-v1', {
  readonly deploymentId: string;
  readonly providerId: string;
}> & (
  | (CompleteSnapshot & SettlementProof<string, number>)
  | (Extract<IncompleteSnapshot, {readonly nextAfter: string}> & SettlementProof<string, number | null>)
  | (Extract<IncompleteSnapshot, {readonly nextAfter: null}> & SettlementProof<string | null, number | null>)
);

export declare const OPS_COVERAGE_SNAPSHOT_SCHEMA: Readonly<Record<string, unknown>>;
export declare const OPS_SETTLEMENT_SNAPSHOT_SCHEMA: Readonly<Record<string, unknown>>;
