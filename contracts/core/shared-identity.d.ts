import type { DeviceAuthHeaders, HanaMeshCoreContract, RequestSignatureInput } from './definition.js';
import type { CoreProviderFixtureOptions, CoreProviderUnderTest } from './fixtures.js';
/** Existing provider diagnostic reasons, not new C-CORE method error codes. */
export type CoreFixtureIdentityFailure = 'CORE_DEVICE_STORE_UNAVAILABLE' | 'CORE_DEVICE_CORRUPT';
/** FIXTURE observation only; not an extension of SessionSnapshot or the Core service. */
export type CoreFixtureIdentityObservation = Readonly<{
    status: 'shared';
    source: 'created' | 'migrated' | 'adopted' | 'existing' | 'conflict';
    reason: null;
    replacedDeviceIds: readonly string[];
} | {
    status: 'failed';
    source: null;
    reason: CoreFixtureIdentityFailure;
    replacedDeviceIds: readonly string[];
}>;
export interface CoreSharedProviderFixture extends CoreProviderUnderTest {
    /** FIXTURE control, not a service method or new product API. */
    identity(): CoreFixtureIdentityObservation;
    /** FIXTURE counterpart of the provider's existing POST refresh action. */
    refresh(): Promise<void>;
}
export interface CoreSharedIdentityFixture {
    readonly label: string;
    /** Simulates one resolved root; synchronous claims model first-writer wins, not process/file atomicity. */
    createProvider(options?: Pick<CoreProviderFixtureOptions, 'initialConsent' | 'serverOrigin'> & {
        readonly existingIdentity?: HanaMeshCoreContract;
    }): CoreSharedProviderFixture;
    /** FIXTURE controls only. Repair preserves the original shared signing identity. */
    setFailure(reason: CoreFixtureIdentityFailure): void;
    repair(): void;
}
/** FIXTURE only: in memory, no root resolution, storage, real credentials or product installation. */
export declare function createCoreSharedIdentityFixture(): CoreSharedIdentityFixture;
export interface CoreSharedIdentityExamples {
    readonly label: string;
    readonly request: RequestSignatureInput & { readonly body: Uint8Array };
    readonly dsh: CoreSharedIdentityClientExample;
    readonly desktop: CoreSharedIdentityClientExample;
    readonly failure: { readonly reason: 'CORE_DEVICE_CORRUPT'; readonly code: 'CORE_NOT_READY'; readonly status: 503 };
}
export interface CoreSharedIdentityClientExample {
    readonly deviceId: string;
    readonly publicKey: string;
    readonly signature: Uint8Array;
    readonly headers: DeviceAuthHeaders;
}
/** FIXTURE sample data; private keys remain private to the signing fixtures. */
export declare function createCoreSharedIdentityExamples(): Promise<CoreSharedIdentityExamples>;
