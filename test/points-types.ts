import {CONTRACTS} from '@hanamesh/api-contracts';
import {createPointsContractExamples, createPointsProviderFixture, CustodyError} from '@hanamesh/api-contracts/points';
import type {OwnPointsDTO, PointsBindingStatus, UsagePointsResult, ClaimPointsResult, DeviceBoundResult, WriteContext, SessionCredentials, DeviceAuthRequest, LaunchSnapshot, BeneficiaryEntitlementView, PointsService, PointsSnapshotService} from '@hanamesh/api-contracts/points';

const e = createPointsContractExamples();
const status:PointsBindingStatus = e.unboundZero.bindingStatus;
const snapshot:LaunchSnapshot = e.snapshot.result;
const entitlement:BeneficiaryEntitlementView = e.entitlements.pending.view;
// @ts-expect-error bindingStatus is required even at zero points
const missing:OwnPointsDTO = {hanas:[],totalPoints:0,subtotals:{userPoints:0,pendingUserPoints:0,creatorReward:0,unclassified:0}};
// @ts-expect-error BOUND does not introduce a CLAIMABLE state
const wrong:PointsBindingStatus = 'CLAIMABLE';
// @ts-expect-error whole point JSON fields retain their existing names
void e.boundPoints.hanas[0].pointsMilli;
// @ts-expect-error no per-entitlement amount can be invented
void entitlement.entitlements[0].amount;

async function consume(service:PointsService, snapshots:PointsSnapshotService, ctx:WriteContext, credentials:SessionCredentials, device:DeviceAuthRequest) {
  const points:OwnPointsDTO = await service.getOwnPoints(credentials,device);
  const usage:UsagePointsResult = await service.recordUsagePoints(ctx,e.usage.input);
  const claim:ClaimPointsResult = await service.recordClaimCredit(e.claim.input,ctx);
  const bound:DeviceBoundResult = await service.onDeviceBound(ctx,e.bound.input.deviceId,e.bound.input.principalId);
  await service.listOwnLedger(credentials,'cursor',10);
  await service.listOwnBalances(credentials);
  const admitted:LaunchSnapshot = await snapshots.admit(credentials,e.snapshot.input.requestId);
  const rights:BeneficiaryEntitlementView = await snapshots.readEntitlements(credentials,e.snapshot.input.requestId);
  // @ts-expect-error recordClaimCredit has event first, context second
  await service.recordClaimCredit(ctx,e.claim.input);
  // @ts-expect-error host context required for usage hook
  await service.recordUsagePoints(e.usage.input);
  // @ts-expect-error caller receipt is not an admission input
  await snapshots.admit(credentials,{requestId:'FIXTURE',transactionHash:'0x01'});
  void points; void usage; void claim; void bound; void admitted; void rights;
}
const f = createPointsProviderFixture({getOwnPoints:async()=>e.boundZero,admit:async()=>e.snapshot.result});
const port:PointsService = f.service;
const error = new CustodyError('CUSTODY_PAYMENT_NOT_CONFIRMED');
void status; void snapshot; void entitlement; void missing; void wrong; void consume; void port; void error;
void CONTRACTS['C-POINTS'].definition.bindingStatus.UNBOUND;
