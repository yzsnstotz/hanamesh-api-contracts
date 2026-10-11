import type { HanaMeshUsageLocalContract, RecordInput, RecordResult, UsageHealthSnapshot } from './definition.js';
export type * from './definition.js';
export declare const USAGE_LOCAL_FIXTURE_LABEL = "FIXTURE · hanamesh-usage local contract (not the product provider)";
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
