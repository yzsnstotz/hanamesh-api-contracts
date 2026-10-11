import type { CoreSharedIdentityExamples, CoreSharedProviderFixture, HanaMeshCoreContract } from '@hanamesh/api-contracts/core';
import { createCoreSharedIdentityExamples, createCoreSharedIdentityFixture } from '@hanamesh/api-contracts/core';

const shared = createCoreSharedIdentityFixture();
const dsh: CoreSharedProviderFixture = shared.createProvider({ initialConsent: 'granted' });
const desktop: HanaMeshCoreContract = shared.createProvider({ existingIdentity: dsh.service }).service;
shared.setFailure('CORE_DEVICE_CORRUPT');
shared.repair();
void dsh.refresh();
const state = dsh.identity();
if (state.status === 'failed') {
    const reason: 'CORE_DEVICE_STORE_UNAVAILABLE' | 'CORE_DEVICE_CORRUPT' = state.reason;
    void reason;
}
// @ts-expect-error fixture controls are not Core service methods
void desktop.refresh;
// @ts-expect-error shared identity does not extend the SessionSnapshot shape
void desktop.getSession().identity;
async function examples(): Promise<CoreSharedIdentityExamples> {
    return createCoreSharedIdentityExamples();
}
void examples;
