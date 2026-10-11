export type UsageAction = 'open' | 'use';
export interface UsageReceipt { readonly providerId: string; readonly model: string | null; readonly count: number }
export interface RecordInput {
    readonly hanaRef: string;
    readonly action: UsageAction;
    readonly occurredAt?: string;
    readonly idempotencyKey: string;
    readonly sourcePlugin: string;
    readonly sourceHanaRef?: string | null;
    readonly targetRef?: string | null;
    /** Only with `action: 'use'`. */
    readonly receipt?: UsageReceipt | null;
}
export type UsageRecordCode = 'INVALID_RECORD_INPUT' | 'DEVICE_UNAVAILABLE' | 'EVENTS_CAPACITY_REACHED' | 'EVENT_IDENTITY_CONFLICT' | 'RECORD_FAILED';
export type RecordResult =
    | { readonly disposition: 'recorded' | 'duplicate'; readonly eventId: string }
    | { readonly disposition: 'withheld' }
    | { readonly disposition: 'rejected'; readonly code: UsageRecordCode };
export interface UsageHealthSnapshot {
    readonly pending: number;
    readonly recoveryComplete: boolean;
    readonly failures: Readonly<Record<string, number>>;
    readonly consent: 'granted' | 'withheld' | 'unknown';
    readonly core: 'present' | 'absent' | 'incompatible';
    readonly deviceId: string | null;
    readonly outbox: { readonly state: 'idle' | 'uploading' | 'backoff' | 'offline' | 'stopped'; readonly pending: number; readonly sent: number; readonly duplicate: number; readonly rejected: number; readonly lastUploadAt: string | null; readonly nextAttemptAt: string | null; readonly lastError: string | null };
    readonly derive: { readonly skipped: { readonly consentWithheld: number; readonly executorUnavailable: number; readonly timeUnavailable: number; readonly noDevice: number } };
    readonly withdrawal: { readonly requestedAt: string; readonly deviceId: string; readonly state: 'pending' | 'sent' | 'offline'; readonly attempts: number; readonly deletedEvents: number | null; readonly lastError: string | null } | null;
    readonly inventory: { readonly available: boolean; readonly source: 'loader' | 'plugin-inventory' | 'none'; readonly lastScanAt: string | null; readonly detail: { readonly package: string; readonly serviceKey: string; readonly methods: readonly string[] } | null };
}
/** The part of the `hanameshUsage` service covered by C-USAGE-LOCAL. */
export interface HanaMeshUsageLocalContract {
    record(input: RecordInput): Promise<RecordResult>;
    health(): UsageHealthSnapshot;
}
export declare const USAGE_SERVICE_NAME: 'hanameshUsage';
export declare const USAGE_EVENT_NAMESPACE: string;
export declare const USAGE_RECORD_CODES: readonly UsageRecordCode[];
export interface UsageLocalMethodDefinition {
    readonly input: string | null;
    readonly output: string;
    readonly errors: readonly string[];
    readonly errorChannel: 'result' | 'http';
    readonly implementationErrors: readonly string[];
    readonly note: string;
    readonly identity?: string;
}
export declare const USAGE_LOCAL_CONTRACT_DEFINITION: Readonly<{
    readonly id: 'C-USAGE-LOCAL';
    readonly service: 'hanameshUsage';
    readonly types: Readonly<Record<'HanaRef' | 'UsageReceipt' | 'RecordInput' | 'RecordResult' | 'HealthSnapshot', unknown>>;
    readonly methods: { readonly record: UsageLocalMethodDefinition; readonly health: UsageLocalMethodDefinition };
}>;
/** Event identity of a record() call, identical to the provider's eventIdForSeat. */
export declare function usageRecordEventId(deviceId: string, sourcePlugin: string, idempotencyKey: string): string;
