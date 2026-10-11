import type { HanaMeshCoreContract, CoreHandshake } from '@hanamesh/api-contracts/core';
import { checkCoreService, createCoreProviderFixture } from '@hanamesh/api-contracts/core';
import type { HanaMeshUsageLocalContract, RecordResult } from '@hanamesh/api-contracts/usage-local';
import { createUsageLocalProviderFixture } from '@hanamesh/api-contracts/usage-local';
import { CONTRACTS } from '@hanamesh/api-contracts';

const handshake: CoreHandshake = checkCoreService(createCoreProviderFixture().service);
const usage: HanaMeshUsageLocalContract = createUsageLocalProviderFixture().service;
async function consume(core: HanaMeshCoreContract): Promise<string> {
    const result: RecordResult = await usage.record({ hanaRef: '@hanamesh/a', action: 'open', idempotencyKey: 'k', sourcePlugin: core.getDeviceId() });
    if (result.disposition === 'rejected') return result.code;
    if (result.disposition === 'withheld') return 'withheld';
    return result.eventId;
}
void handshake; void consume; void CONTRACTS['C-USAGE-LOCAL'].definition.methods.record.errors;
