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

// Q-50 public host injection types; product factories belong to server-custody.
import {createBeneficiaryValidationExamples,createBeneficiaryValidationPortFixture,createSnapshotSettingsExamples} from '@hanamesh/api-contracts/points';
import type {BeneficiaryViewExpected,BeneficiaryViewChecker,BeneficiaryValidationPort,CustodyModuleOptions,CustodyServiceDeps,CustodyStore,SnapshotServiceDeps,ConfirmedLaunchSource,ProductionAllocationSettings,ProductionAllocationPolicy,SnapshotSetting,VoucherSigner,ChainExecutor,ClaimSummaryProvider} from '@hanamesh/api-contracts/points';
import type {IdentityServices} from '@hanamesh/api-contracts/identity';
import type {SqlExecutor,UnitOfWork} from '@hanamesh/api-contracts/uow';
declare const checker:BeneficiaryViewChecker, expected:BeneficiaryViewExpected;
const validation:BeneficiaryValidationPort=createBeneficiaryValidationPortFixture(checker).port;
const vectors=createBeneficiaryValidationExamples();
const failedRules:string[]=validation.checkBeneficiaryView(vectors.ordinary.view,expected);
// @ts-expect-error synchronous rule IDs, never boolean
const booleanChecker:BeneficiaryViewChecker=()=>true;
// @ts-expect-error asynchronous results are not the provider callable
const asyncChecker:BeneficiaryViewChecker=async()=>[];
// @ts-expect-error principalId required
const incompleteExpected:BeneficiaryViewExpected={requestId:'r',hanaId:'h',token:'0x01',batchId:'0x02'};
// @ts-expect-error expected independently required
validation.checkBeneficiaryView(vectors.ordinary.view);
// @ts-expect-error no production checker implementation in the shared package
import {checkBeneficiaryView} from '@hanamesh/api-contracts/points';
// @ts-expect-error no product factory in the shared package
import {createCustodyService} from '@hanamesh/api-contracts/points';
declare const options:CustodyModuleOptions, serviceDeps:CustodyServiceDeps, snapshotDeps:SnapshotServiceDeps;
declare const identity:IdentityServices, uow:UnitOfWork, sql:SqlExecutor;
const injectedService:CustodyServiceDeps={...serviceDeps,identity,unitOfWork:uow};
const injectedSnapshot:SnapshotServiceDeps={...snapshotDeps,identity,unitOfWork:uow};
const store:CustodyStore=injectedService.store;
const signer:VoucherSigner=options.signer;
const chain:ChainExecutor=options.executor;
const summary:ClaimSummaryProvider={readOwner:async()=>null};
const producer:ConfirmedLaunchSource={getConfirmedLaunch:async(_input)=>null};
producer.getConfirmedLaunch({requestId:'r'});
// @ts-expect-error producer has no host context parameter
producer.getConfirmedLaunch({requestId:'r'},{executor:sql});
snapshotDeps.ports.admissions.getConfirmedLaunch({requestId:'r'},{executor:sql});
// @ts-expect-error admissions requires the host context
snapshotDeps.ports.admissions.getConfirmedLaunch({requestId:'r'});
const settings:ProductionAllocationSettings={allocationRemainderRule:{source:'FIXTURE',allocate:async()=>({source:'FIXTURE',mode:'test-only',amounts:[],platformDust:'0',reservedDust:'0'})}};
declare const production:ProductionAllocationPolicy;
const readback:readonly SnapshotSetting[]=production.readSettings();
const namedSettings:readonly SnapshotSetting[]=createSnapshotSettingsExamples().remainderUnset;
// @ts-expect-error both dust fields required
const missingDust:Awaited<ReturnType<ProductionAllocationPolicy['allocate']>>={source:'FIXTURE',mode:'production',amounts:[],platformDust:'0'};
void [failedRules,booleanChecker,asyncChecker,incompleteExpected,injectedSnapshot,store,signer,chain,summary,settings,readback,namedSettings,missingDust];
