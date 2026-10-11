import {CONTRACTS} from '@hanamesh/api-contracts';
import {createUsageProviderFixture,createUsageContractExamples,eventDigest,canonicalUsageEvent,usageWithdrawWire,USAGE_ERRORS,USAGE_EVENT_ACTIONS} from '@hanamesh/api-contracts/usage';
import type {UsageEventService,UsageEventInput,IngestBatchResult,EligibilityContribution,WithdrawResult,WithdrawServiceResult,UsageErrorCode,DeviceAuthRequest,WriteContext} from '@hanamesh/api-contracts/usage';
async function consume(service:UsageEventService,request:DeviceAuthRequest,context:WriteContext) {
  const fixture = await createUsageProviderFixture(), event:UsageEventInput = fixture.event();
  const signed:string = canonicalUsageEvent(event), digest:string = eventDigest(event);
  const batch:IngestBatchResult = await service.ingestEvents(request,[event],context);
  const contribution:EligibilityContribution = await service.getContributions({deviceRequest:request},fixture.window);
  const withdrawal:WithdrawServiceResult = await service.withdrawEvents({deviceRequest:request},event.deviceId,context);
  const wire:WithdrawResult = usageWithdrawWire(withdrawal);
  // @ts-expect-error HTTP withdrawal response has no durability
  void wire.durability;
  // @ts-expect-error Signature is required on event input
  const unsigned:UsageEventInput = {deviceId:'d',hanaRef:'h',action:'open',eventId:'i',nonce:'n',occurredAt:'t'};
  // @ts-expect-error Identity request replay code is not a Usage wire error code
  const wrongError:UsageErrorCode = 'IDENTITY_DEVICE_REPLAY';
  // @ts-expect-error Minimal fixture does not expose caller-managed transactions
  await fixture.service.ingestEvents(request,[event],context);
  const example = await createUsageContractExamples();
  const code:UsageErrorCode = example.usageReplay.error.code;
  void signed;void digest;void batch;void contribution;void withdrawal;void wire;void unsigned;void wrongError;void code;
}
void consume;void USAGE_ERRORS;void USAGE_EVENT_ACTIONS;void CONTRACTS['C-USAGE'].definition.authentication.replay;
