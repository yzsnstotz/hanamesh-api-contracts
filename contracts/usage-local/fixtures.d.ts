import type { HanaMeshUsageLocalContract, RecordInput, RecordResult, UsageHealthSnapshot } from './definition.js';
export type * from './definition.js';
export declare const USAGE_LOCAL_FIXTURE_LABEL = "FIXTURE · hanamesh-usage local contract (not the product provider)";
export interface UsageLocalUploadEvent {
    readonly deviceId: string; readonly hanaRef: string; readonly action: 'open' | 'use'; readonly occurredAt: string;
    readonly eventId: string; readonly nonce: string;
    readonly sourceHanaRef?: string; readonly targetRef?: string;
    readonly receipt?: { readonly providerId: string; readonly model: string | null; readonly count: number };
}
export interface UsageLocalProviderFixtureOptions {
    consent?: 'granted' | 'withheld';
    core?: 'present' | 'absent' | 'incompatible';
    /** `null` reproduces DEVICE_UNAVAILABLE. */
    deviceId?: string | null;
    maxEvents?: number;
    now?: () => number;
}
/** In-memory provider of hanameshUsage.record/health for consumers (app-host) to test against. No storage, no upload, no signing. */
export declare function createUsageLocalProviderFixture(options?: UsageLocalProviderFixtureOptions): {
    readonly label: typeof USAGE_LOCAL_FIXTURE_LABEL;
    readonly service: HanaMeshUsageLocalContract;
    setConsent(state: 'granted' | 'withheld'): void;
    setCore(status: 'present' | 'absent' | 'incompatible'): void;
    /** Unsigned upload projection of recorded events (provider wireEvent without signature), in record order. */
    uploadEvents(): readonly UsageLocalUploadEvent[];
};
export interface UsageLocalContractExamples {
    readonly label: typeof USAGE_LOCAL_FIXTURE_LABEL;
    readonly input: RecordInput;
    readonly results: Readonly<Record<'recorded' | 'duplicate' | 'withheld' | 'EVENT_IDENTITY_CONFLICT' | 'INVALID_RECORD_INPUT' | 'EVENTS_CAPACITY_REACHED' | 'DEVICE_UNAVAILABLE' | 'RECORD_FAILED', RecordResult>>;
    readonly health: UsageHealthSnapshot;
    readonly healthCoreAbsent: UsageHealthSnapshot;
    readonly http: { readonly USAGE_UNAVAILABLE: { readonly status: 503; readonly body: { readonly error: 'USAGE_UNAVAILABLE' } } };
}
/** Sample data for every documented outcome, produced by the fixture provider. */
export declare function createUsageLocalContractExamples(): Promise<UsageLocalContractExamples>;
/** Synthetic 43-char base64url device id standing for one C-CORE shared identity; not a registered device. */
export declare const USAGE_LOCAL_SHARED_DEVICE_FIXTURE: string;
export interface UsageLocalCrossClientPair {
    readonly inputs: readonly [RecordInput, RecordInput];
    readonly results: readonly [RecordResult, RecordResult];
    readonly events: readonly [UsageLocalUploadEvent, UsageLocalUploadEvent];
    readonly digests: readonly [string, string];
    /** C-USAGE outcome of uploading client A then client B. */
    readonly server: readonly ['accepted', 'accepted' | 'duplicate' | 'USAGE_EVENT_CONFLICT'];
}
export interface UsageLocalCrossClientExamples {
    readonly label: typeof USAGE_LOCAL_FIXTURE_LABEL;
    readonly fact: RecordInput;
    readonly duplicateFact: UsageLocalCrossClientPair;
    readonly differentOperation: UsageLocalCrossClientPair;
    readonly differentDevice: UsageLocalCrossClientPair;
    readonly timeMismatchConflict: UsageLocalCrossClientPair;
    readonly sameBuffer: { readonly retry: readonly [RecordResult, RecordResult]; readonly timeMismatchConflict: RecordResult };
    readonly missingOccurredAt: { readonly input: Omit<RecordInput, 'occurredAt'>; readonly result: RecordResult };
}
/** Q-18 examples: two independent buffers on one shared device; duplicate fact, different operation, different device, time-mismatch conflict, missing occurredAt. */
export declare function createUsageLocalCrossClientExamples(): Promise<UsageLocalCrossClientExamples>;
