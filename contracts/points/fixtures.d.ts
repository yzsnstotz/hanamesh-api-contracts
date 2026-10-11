import type {OwnPointsDTO, OwnLedgerEntryDTO, BalanceDTO, HanaClaimSummaryDTO, UsagePointsEvent, UsagePointsResult, ClaimPointsResult, DeviceBoundResult, CustodyErrorCode} from './contracts.js';
import type {CustodyService} from './provider.js';
import type {LaunchSnapshot, BeneficiaryEntitlementView, SnapshotService} from './snapshots/contracts.js';
export declare const POINTS_FIXTURE_LABEL: string;
export interface PointsContractExamples {
  readonly label: string;
  readonly unboundZero: OwnPointsDTO;
  readonly boundZero: OwnPointsDTO;
  readonly unboundPending: OwnPointsDTO;
  readonly boundPoints: OwnPointsDTO;
  readonly ledger: {readonly items: readonly OwnLedgerEntryDTO[]};
  readonly balance: {readonly balances: readonly BalanceDTO[]};
  readonly summary: HanaClaimSummaryDTO;
  readonly usage: {readonly input: UsagePointsEvent; readonly result: UsagePointsResult};
  readonly claim: {readonly input: {readonly principalId:string; readonly hanaId:string; readonly claimId:string}; readonly result: ClaimPointsResult};
  readonly bound: {readonly input: {readonly deviceId:string; readonly principalId:string}; readonly result: DeviceBoundResult};
  readonly transaction: string;
  readonly snapshot: {readonly input:{readonly requestId:string}; readonly result:LaunchSnapshot};
  readonly errors: Readonly<Partial<Record<CustodyErrorCode,{readonly status:number; readonly body:{readonly error:{readonly code:CustodyErrorCode; readonly message:string; readonly need?:Readonly<Record<string,string>>}}}>>>;
  readonly entitlements: {
    readonly label:string;
    readonly issuer:{readonly status:200; readonly view:BeneficiaryEntitlementView};
    readonly pending:{readonly status:200; readonly view:BeneficiaryEntitlementView};
    readonly walletConflict:{readonly status:409; readonly code:'CUSTODY_WALLET_BINDING_CONFLICT'};
  };
}
export declare function createPointsContractExamples(): PointsContractExamples;
export type PointsService = Pick<CustodyService, 'getOwnPoints'|'listOwnLedger'|'listOwnBalances'|'getHanaClaimSummary'|'recordUsagePoints'|'recordClaimCredit'|'onDeviceBound'>;
export type PointsSnapshotService = Pick<SnapshotService, 'admit'|'readEntitlements'>;
/** Missing handlers fail explicitly. No simulated auth, economic rules, persistence or chain execution. */
export interface PointsProviderFixture {
  readonly label:string;
  readonly service:PointsService;
  readonly snapshots:PointsSnapshotService;
  readonly calls:readonly {readonly name:keyof (PointsService & PointsSnapshotService); readonly args:readonly unknown[]}[];
}
export declare function createPointsProviderFixture(handlers?:Partial<PointsService & PointsSnapshotService>):PointsProviderFixture;
