import type { HanaMeshCoreContract, CoreHandshake } from '@hanamesh/api-contracts/core';
import { checkCoreService, createCoreProviderFixture } from '@hanamesh/api-contracts/core';
import type { HanaMeshUsageLocalContract, RecordResult } from '@hanamesh/api-contracts/usage-local';
import { createUsageLocalCrossClientExamples, createUsageLocalProviderFixture } from '@hanamesh/api-contracts/usage-local';
import type { UsageLocalCrossClientExamples } from '@hanamesh/api-contracts/usage-local';
import { CONTRACTS } from '@hanamesh/api-contracts';

const handshake: CoreHandshake = checkCoreService(createCoreProviderFixture().service);
const usage: HanaMeshUsageLocalContract = createUsageLocalProviderFixture().service;
async function consume(core: HanaMeshCoreContract): Promise<string> {
    const result: RecordResult = await usage.record({ hanaRef: '@hanamesh/a', action: 'open', occurredAt: new Date().toISOString(), idempotencyKey: 'k', sourcePlugin: core.getDeviceId() });
    if (result.disposition === 'rejected') return result.code;
    if (result.disposition === 'withheld') return 'withheld';
    return result.eventId;
}
void handshake; void consume; void CONTRACTS['C-USAGE-LOCAL'].definition.methods.record.errors;
// @ts-expect-error Q-18: occurredAt is required
void usage.record({ hanaRef: '@hanamesh/a', action: 'open', idempotencyKey: 'k', sourcePlugin: '@hanamesh/a' });
void createUsageLocalCrossClientExamples().then((ex: UsageLocalCrossClientExamples) => ex.timeMismatchConflict.server[1]);
import type { DeviceRegisterResponse, IdentityClaimPorts, IdentityCustodyPorts, IdentityHostPorts, IdentityRegistryPorts, IdentityUsagePorts, PrincipalResolution, WalletBindingDTO } from '@hanamesh/api-contracts/identity';
import { createIdentityServicesFixture, identityDeviceRegisterWire } from '@hanamesh/api-contracts/identity';

const identity = createIdentityServicesFixture().services;
const usagePorts: IdentityUsagePorts = identity, custodyPorts: IdentityCustodyPorts = identity, claimPorts: IdentityClaimPorts = identity;
const registryPorts: IdentityRegistryPorts = identity, hostPorts: IdentityHostPorts = identity;
async function consumeIdentity(): Promise<[PrincipalResolution, WalletBindingDTO | null, DeviceRegisterResponse]> {
    const challenge = await identity.deviceRegistration.createChallenge('register');
    const registered = await identity.deviceRegistration.registerDevice({ publicKey: 'k', nonce: challenge.nonce, signature: 's' });
    const wire = identityDeviceRegisterWire(registered);
    // @ts-expect-error the wire body has no `created`
    void wire.body.created;
    return [await custodyPorts.principalLinks.resolveCanonical('p'), await hostPorts.wallets.getBinding({ principalId: 'p', chainId: 1 }), wire.body];
}
void usagePorts; void claimPorts; void registryPorts; void consumeIdentity; void CONTRACTS['C-IDENTITY'].definition.calls.hostGetBinding.errors;
