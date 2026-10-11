// Extracted from server-usage J2S3-SUSAGE-01; wire DTOs are browser-safe.
export declare const USAGE_ERRORS: readonly ['USAGE_INPUT_INVALID','USAGE_CONFIG_INVALID','USAGE_IDENTITY_REQUIRED',
  'USAGE_AUTH_REQUIRED','USAGE_FORBIDDEN','USAGE_IDENTITY_UNAVAILABLE','USAGE_NOT_FOUND',
  'USAGE_EVENT_CONFLICT','USAGE_STORAGE_UNAVAILABLE','USAGE_SCHEMA_MISSING','USAGE_ROLE_UNSAFE',
  'USAGE_ORIGIN_REJECTED','USAGE_MEDIA_TYPE_REJECTED','USAGE_RATE_LIMITED','USAGE_NONCE_REUSED',
  'USAGE_SIGNATURE_INVALID','USAGE_DEVICE_MISMATCH','USAGE_CLOCK_SKEW','USAGE_DEVICE_REVOKED','USAGE_EVENT_HOOK_FAILED'];
export type UsageErrorCode = typeof USAGE_ERRORS[number];
export interface UsageErrorResponse { readonly error: { readonly code: UsageErrorCode; readonly message: string } }

export declare const USAGE_EVENT_ACTIONS: readonly ['install','open','use','uninstall'];
export type UsageEventAction=typeof USAGE_EVENT_ACTIONS[number];
/** rc.4 (T6) usage receipt: application × provider × model × count, content-free. Only allowed on `use` events. */
export interface UsageReceipt { readonly providerId:string; readonly model:string|null; readonly count:number }
export interface UsageEventInput {
  readonly deviceId:string; readonly hanaRef:string; readonly action:UsageEventAction;
  readonly occurredAt:string; readonly eventId:string; readonly nonce:string; readonly signature:string;
  /** rc.4: attribution — the Hana the usage came from, and the target application / session reference. */
  readonly sourceHanaRef?:string; readonly targetRef?:string;
  readonly receipt?:UsageReceipt;
}
export interface StoredUsageEvent extends UsageEventInput { readonly principalId:string; readonly receivedAt:string }
/** Admin receipts query: exclusive `to`, at most 92 days; `hanaRef` is exact. */
export interface ReceiptQuery extends ContributionWindow { readonly hanaRef:string }
/** One aggregated receipt row: `count` is the sum over accepted `use` events of that hour; `devices` distinct devices. */
export interface UsageReceiptRow {
  readonly hanaRef:string; readonly sourceHanaRef:string|null; readonly targetRef:string|null;
  readonly providerId:string; readonly model:string|null; readonly hour:string; readonly count:number; readonly devices:number; readonly events:number;
}
export interface UsageReceiptList { readonly window:ContributionWindow; readonly hanaRef:string; readonly items:readonly UsageReceiptRow[]; readonly truncated:boolean }
export type UsageEventRejectionCode='USAGE_EVENT_CONFLICT'|'USAGE_NONCE_REUSED'|'USAGE_CLOCK_SKEW'|'USAGE_INPUT_INVALID';
export interface IngestBatchResult {
  readonly accepted:number; readonly duplicates:number;
  readonly rejected:readonly {readonly eventId:string;readonly code:UsageEventRejectionCode}[];
  readonly durability:'committed'|'pending-host-commit';
}
export interface ContributionWindow {readonly from:string;readonly to:string}
export interface ContributionDTO {
  readonly window:ContributionWindow;
  readonly byHana:readonly {readonly hanaRef:string;readonly actions:Readonly<Record<UsageEventAction,number>>;readonly devices:number}[];
  readonly sources:{readonly events:number;readonly rollups:number};
  readonly availability:'available'|'unavailable';
}
/** Human-facing reference to the account the canonical principal signed in with; passed through from identity, never stored here. */
export interface LinkedAccountDTO {readonly provider:'github';readonly displayName:string}
export interface EligibilityContribution extends ContributionDTO {
  readonly canonicalPrincipalId:string; readonly bound:boolean; readonly deviceCount:number;
  /** Present only when identity resolves the canonical principal to a GitHub account. */
  readonly account?:LinkedAccountDTO;
}
export interface RawEventQuery extends ContributionWindow {readonly after?:string;readonly limit?:number}
export interface RawEventList {readonly items:readonly StoredUsageEvent[];readonly nextAfter:string|null;readonly window:ContributionWindow}
