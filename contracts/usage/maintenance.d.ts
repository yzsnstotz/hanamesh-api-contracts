// Q-33 C-USAGE host maintenance port. Extracted from server-usage J2S3-SUSAGE-02 main 5ff545a (src/server-contracts.ts, src/index.d.ts).
import type {IdentityServices, PrincipalDTO, SqlPool, WriteContext} from '../identity/index.js';
import type {UsageErrorCode, UsageEventAction, UsageReceipt, EligibilityContribution, ContributionDTO} from './contracts.js';
import type {UsageEventService} from './index.js';
/** Q-33: result of the host-scheduled retention job; same shape as schema `RollupAndPurgeResult`. */
export interface RollupAndPurgeResult {rolled:number;purged:number;durability:'committed'|'pending-host-commit'}
/**
 * Q-33: the host maintenance job port. Not an HTTP route; the host owns the schedule.
 * `now` must be a valid Date (else USAGE_INPUT_INVALID); events with `received_at < now - retentionDays` are added to daily
 * rollups and then deleted, in one transaction under `LOCK TABLE usage.events IN SHARE UPDATE EXCLUSIVE MODE`.
 * Without `context` the module borrows one pool client and BEGIN/COMMITs/releases it (`committed`); with a C-UOW `context`
 * it only runs on `context.executor`, which must already be inside a host transaction (`pending-host-commit`, host commits).
 * Driver, privilege and lock failures surface as USAGE_STORAGE_UNAVAILABLE; a context without `executor.query` is USAGE_CONFIG_INVALID.
 * Provider declares it as `Pick<UsageService,'rollupAndPurge'>`; the full UsageService stays in the implementation package.
 */
export interface UsageMaintenancePort {rollupAndPurge(now:Date,context?:WriteContext):Promise<RollupAndPurgeResult>}
/** Existing three event ports plus the maintenance port: what `UsageModule.services` provides to a host through this contract. */
export interface UsageHostServices extends UsageEventService, UsageMaintenancePort {}
export type UsageAction = 'usage:ingest:self' | 'usage:ingest:real:self' | 'usage:read:self';
export interface UsagePolicyContext {readonly principal:PrincipalDTO;readonly action:UsageAction;readonly summary?:unknown}
/** A host-owned, live policy decision. Only boolean true grants permission. No cached grant table. */
export type UsagePolicy = (context:UsagePolicyContext) => boolean | Promise<boolean>;
/** rc.4: one accepted (deduplicated, freshly inserted) usage event as handed to the host's `onEventsAccepted` hook. */
export interface AcceptedUsageEvent {
  readonly usageEventId:string; readonly hanaId:string; readonly deviceId:string; readonly principalId:string|null;
  readonly action:UsageEventAction; readonly occurredAt:string;
  readonly sourceHanaRef?:string; readonly targetRef?:string; readonly receipt?:UsageReceipt;
}
/** Called once per ingest batch, inside the same transaction, after the accepted rows are written; throwing rolls the batch back (USAGE_EVENT_HOOK_FAILED, original error not attached). */
export type OnEventsAccepted=(events:ReadonlyArray<AcceptedUsageEvent>,context:WriteContext)=>Promise<void>;
export interface UsageServiceOptions {
  readonly identity: IdentityServices;
  readonly pool: SqlPool;
  readonly deploymentId: string;
  readonly policy: UsagePolicy;
  readonly now?:()=>number;
  /** Integer 0..90, default 90; otherwise USAGE_CONFIG_INVALID at construction. Pass the same value to EligibilityReaderOptions. */
  readonly retentionDays?:number;
  /** rc.4: host-owned admin predicate for `GET /v1/usage/receipts`. Only boolean true grants; absent = nobody. */
  readonly isAdmin?:(principal:PrincipalDTO)=>boolean|Promise<boolean>;
  /** rc.4: host hook (e.g. custody `recordUsagePoints`) for the accepted events of one batch; duplicates/conflicts are never passed. */
  readonly onEventsAccepted?:OnEventsAccepted;
}
export interface UsageModuleOptions extends UsageServiceOptions {
  readonly allowedOrigins: readonly string[];
  /** P04: serve the development page at GET /dev/usage (static; uses only the protected routes). Default false. Enable only on local test hosts. */
  readonly devPage?: boolean;
  readonly rateLimit?: {readonly max?:number;readonly windowMs?:number;readonly capacity?:number};
}
export interface EligibilityReader {readContribution(input:{principalId:string;from:string;to:string}):Promise<EligibilityContribution>}
export interface EligibilityRule {(input:ContributionDTO):unknown}
export interface EligibilityReaderOptions {readonly identity:IdentityServices;readonly pool:SqlPool;readonly deploymentId:string;readonly now?:()=>number;readonly retentionDays?:number}

export type UsageMaintenanceErrorCode = Extract<UsageErrorCode,'USAGE_INPUT_INVALID'|'USAGE_CONFIG_INVALID'|'USAGE_STORAGE_UNAVAILABLE'>;
export declare const USAGE_MAINTENANCE_DEFINITION: Readonly<{
  port:'rollupAndPurge'; signature:string; http:null; provider:Readonly<{card:'J2S3-SUSAGE-02';commit:string}>;
  now:string; cutoff:string; effect:string; rerun:string;
  retention:Readonly<{option:'retentionDays';integer:true;min:0;max:90;default:90;unitMs:86400000;field:'received_at';invalid:'USAGE_CONFIG_INVALID';sameValue:string}>;
  durability:Readonly<{withoutContext:'committed';withContext:'pending-host-commit';note:string}>;
  transaction:Readonly<{withoutContext:readonly string[];withContext:readonly string[];lock:string;concurrency:string;hostContext:string}>;
  permissions:Readonly<{authorization:string;role:string;rls:string;migrations:string}>;
  errors:Readonly<Record<UsageMaintenanceErrorCode,{readonly status:number;readonly when:readonly string[]}>>;
  shutdown:readonly string[];
  injection:Readonly<{factory:string;module:string;fromImplementation:readonly string[]}>;
}>;

export interface UsageMaintenanceSeedEvent {
  readonly deviceId:string; readonly principalId:string; readonly hanaRef:string; readonly action:UsageEventAction;
  readonly occurredAt:string; readonly receivedAt:string; readonly eventId?:string;
}
export interface UsageMaintenanceRollupRow {readonly principalId:string;readonly deviceId:string;readonly hanaRef:string;readonly action:UsageEventAction;readonly day:string;readonly count:number}
export interface UsageMaintenanceStatement {readonly sql:string;readonly args:readonly unknown[]}
export interface UsageMaintenanceHostTransaction {readonly context:WriteContext;commit():Promise<void>;rollback():Promise<void>}
export declare const USAGE_MAINTENANCE_FIXTURE_LABEL:string;
/** FIXTURE ONLY: provider rollupAndPurge/withExecutor ported over an in-memory SQL emulation; not PostgreSQL, not a real host job. Independent of createUsageProviderFixture. */
export interface UsageMaintenanceFixture {
  readonly label:string;
  readonly deploymentId:string;
  readonly retentionDays:number;
  readonly port:UsageMaintenancePort;
  readonly pool:SqlPool;
  readonly statements:readonly UsageMaintenanceStatement[];
  readonly connects:number;
  readonly releases:number;
  seed(events:readonly UsageMaintenanceSeedEvent[]):void;
  events():readonly UsageMaintenanceSeedEvent[];
  rollups():readonly UsageMaintenanceRollupRow[];
  /** A host transaction on its own connection (BEGIN already issued); rollback restores the pre-BEGIN rows. */
  beginHostTransaction():Promise<UsageMaintenanceHostTransaction>;
  /** The next statement containing `match` throws a driver error (sanitized to USAGE_STORAGE_UNAVAILABLE). */
  failNext(match:string):void;
}
export declare function createUsageMaintenanceFixture(options?:{readonly retentionDays?:number;readonly deploymentId?:string}):UsageMaintenanceFixture;
export interface UsageMaintenanceExamples {
  readonly label:string;
  readonly now:string;
  readonly retentionDays:number;
  readonly committed:RollupAndPurgeResult;
  readonly rerun:RollupAndPurgeResult;
  readonly hostCommit:{readonly result:RollupAndPurgeResult;readonly rollups:readonly UsageMaintenanceRollupRow[]};
  readonly hostRollback:{readonly result:RollupAndPurgeResult;readonly eventsAfterRollback:number};
  readonly errors:readonly {readonly case:string;readonly code:UsageMaintenanceErrorCode;readonly status:number}[];
}
export declare function createUsageMaintenanceExamples():Promise<UsageMaintenanceExamples>;
