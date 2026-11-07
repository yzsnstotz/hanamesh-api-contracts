import type {Abi,PublicClient,Address,Hex} from 'viem';
export declare const QUOTE_V2_PROTOCOL:'release-quote-v2';
export declare const QUOTE_V2_SCHEMA:'hanamesh-release-quote-v2-deployment-v1';
export interface QuoteV2Deployment {readonly schema:typeof QUOTE_V2_SCHEMA;readonly protocol:typeof QUOTE_V2_PROTOCOL;readonly chainId:number;readonly addresses:{readonly launcher:Address;readonly bondFactory:Address;readonly release:Address;readonly hanaSwapRouter:Address;readonly wrappedNative:Address};readonly platformAuthority:Address;readonly admissionSigner:Address;readonly rootSigner:Address;readonly penaltyMode:'reschedule'|'original-cap'}
export declare function parseQuoteV2Deployment(meta:QuoteV2Deployment):QuoteV2Deployment;
export declare class QuoteV2Error extends Error{readonly code:string;constructor(code:string,message:string)}
export declare const quoteV2Abis:Readonly<Record<'HanaLauncherQuoteV2'|'HanaBondFactoryQuoteV2'|'HanaBondQuoteV2'|'HanaTokenQuoteV2'|'BatchVestingDistributorQuoteV2'|'WETH9',Abi>>;
export declare const quoteV2Runtime:Readonly<Record<string,{normalizedKeccak:Hex;byteLength:number;immutableReferences:Readonly<Record<string,readonly {start:number;length:number}[]>>}>>;
export declare const quoteV2SourceCommit:string;
export interface QuoteV2Authorization{hanaId:Hex;requestId:Hex;payer:Address;subject:Hex;snapshot:Hex;name:string;symbol:string;hanaTreasury:Address;quote:Address;launchFeeWei:bigint;pointsBps:bigint;earlyReleaseAllowed:boolean;deadline:bigint}
export interface QuoteV2LaunchInput{deployment:QuoteV2Deployment;authorization:QuoteV2Authorization}
export interface QuoteV2LaunchTypedData{readonly domain:{readonly name:'HanaLauncher';readonly version:'4';readonly chainId:number;readonly verifyingContract:Address};readonly types:{readonly LaunchAuthorization:readonly {readonly name:string;readonly type:string}[]};readonly primaryType:'LaunchAuthorization';readonly message:QuoteV2Authorization}
export declare function quoteV2LaunchTypedData(input:QuoteV2LaunchInput):QuoteV2LaunchTypedData;
export declare function quoteV2EmptyLaunchTypedData(input:QuoteV2LaunchInput):{readonly domain:QuoteV2LaunchTypedData['domain'];readonly types:{readonly EmptyLaunchAuthorization:readonly {readonly name:string;readonly type:string}[]};readonly primaryType:'EmptyLaunchAuthorization';readonly message:{readonly authorizationHash:Hex}};
export declare function quoteV2ReleaseDomain(deployment:QuoteV2Deployment):{readonly name:'HanaMesh Batch Release';readonly version:'3';readonly chainId:number;readonly verifyingContract:Address};
export interface QuoteV2EmptyInput{deployment:QuoteV2Deployment;token:Address;bond:Address;authorizationHash:Hex;epoch:bigint;nonce:bigint;deadline:bigint}
export declare function quoteV2EmptyAllocationTypedData(input:QuoteV2EmptyInput):{readonly domain:ReturnType<typeof quoteV2ReleaseDomain>;readonly types:{readonly EmptyAllocation:readonly {readonly name:string;readonly type:string}[]};readonly primaryType:'EmptyAllocation';readonly message:Omit<QuoteV2EmptyInput,'deployment'>};
export interface QuoteV2Call{address:Address;abi:Abi;functionName:string;args:readonly unknown[];account?:Address;value?:bigint;gas?:bigint}
export type QuoteV2Payment={payment:'native';value:bigint}|{payment:'erc20';value?:0n};
export type QuoteV2BuyInput={deployment:QuoteV2Deployment;bond:Address;quote:Address;account:Address;deadline:bigint;gas?:bigint}&QuoteV2Payment;
export declare const quoteV2Calls:{
 createCampaign:(input:QuoteV2CreateCampaignInput&QuoteV2Sender&{signature:Hex})=>QuoteV2Call;
 fundCampaign:(input:QuoteV2ReleaseIdInput&QuoteV2Sender)=>QuoteV2Call;
 openRegistration:(input:QuoteV2OpenRegistrationInput&QuoteV2Sender&{signature:Hex})=>QuoteV2Call;
 register:(input:QuoteV2RegisterInput&QuoteV2Sender&{proof:readonly Hex[];signature:Hex})=>QuoteV2Call;
 claim:(input:QuoteV2ReleaseIdInput&QuoteV2Sender&{entitlementId:Hex})=>QuoteV2Call;
 launch:(input:QuoteV2LaunchInput&{account:Address;signature:Hex;gas?:bigint})=>QuoteV2Call;
 emptyLaunch:(input:QuoteV2LaunchInput&{account:Address;signature:Hex;nonce:bigint;deadline:bigint;emptySignature:Hex;gas?:bigint})=>QuoteV2Call;
 buyExact:(input:QuoteV2BuyInput&{amount:bigint;maxSpend:bigint})=>QuoteV2Call;
 buyBudget:(input:QuoteV2BuyInput&{budget:bigint;minHana:bigint})=>QuoteV2Call;
 sell:(input:{bond:Address;account:Address;amount:bigint;minReceive:bigint;recipient:Address;deadline:bigint})=>QuoteV2Call;
 migrate:(input:{bond:Address;account:Address;gas?:bigint})=>QuoteV2Call;
 startEarlyRelease:(input:{bond:Address;account:Address})=>QuoteV2Call;
 setQuote:(input:{deployment:QuoteV2Deployment;quote:Address;virtualQuote:bigint;enabled:boolean})=>QuoteV2Call;
 settleEmpty:(input:QuoteV2EmptyInput&{signature:Hex})=>QuoteV2Call;
 withdrawReserve:(input:{deployment:QuoteV2Deployment;hanaId:Hex;bucket:0|1;to:Address;amount:bigint;proposalId:Hex;expectedRemaining:bigint})=>QuoteV2Call;
};
export type QuoteV2MigrationReason=0|1|2|3;
export declare const QUOTE_V2_MIGRATION_REASONS:readonly ['None','HistoryUnavailable','PriceOutsideBand','NoFeasibleLiquidity'];
export interface QuoteV2MigrationStatus{closed:boolean;completed:boolean;historyReady:boolean;lastReason:QuoteV2MigrationReason;closedAt:string;migratedAt:string;closingQuote:string;windowSeconds:string;averageX112:string;spotX112:string}
export type QuoteV2MigrationState='open'|'pending'|'completed';
export declare function quoteV2MigrationState(status:Pick<QuoteV2MigrationStatus,'closed'|'completed'>):QuoteV2MigrationState;
export interface QuoteV2Fact{protocol:'release-quote-v2';chainId:number;evidence:'FIXTURE'|'READ_ONLY_RPC';blockNumber:string;blockHash:Hex;blockTimestamp:string;sourceCommit:string;confirmations:number;requiredConfirmations:number}
export interface QuoteV2Issuance extends QuoteV2Fact{hanaId:Hex;token:Address;bond:Address;pool:Address;payer:Address;hanaTreasury:Address;requestId:Hex;authorizationHash:Hex;quote:Address;virtualQuote:string;launchFeeWei:string;pointsBps:string;pointsAmount:string;earlyReleaseAllowed:boolean;treasuryReserve:string;creatorReserve:string}
/** readIssuance: phase is 'bond' until the Bond's migrated flag; migratedAt is the Bond view (Unix seconds) or null before migration. */
export interface QuoteV2IssuanceFact extends QuoteV2Issuance{phase:'bond'|'migrated';migratedAt:string|null}
export interface QuoteV2MigrationEvent{eventName:'BondClosed'|'MigrationDeferred'|'Migrated';args:Readonly<Record<string,string|number|boolean>>;blockNumber:string;blockHash:Hex;transactionHash:Hex;logIndex:number}
export interface QuoteV2Reader{readonly deployment:QuoteV2Deployment;readonly mode:'test-only'|'production';readonly evidence:'FIXTURE'|'READ_ONLY_RPC';readReleaseState(input:QuoteV2ReleaseStateQuery):Promise<QuoteV2ReleaseStateFact>;readReleaseStart(input:{hanaId:Hex}):Promise<QuoteV2ReleaseStartFact>;verifyDeployment():Promise<QuoteV2Fact&{deployment:QuoteV2Deployment}>;readQuoteConfig(input:{quote:Address}):Promise<QuoteV2Fact&{quote:Address;virtualQuote:string;enabled:boolean}>;readIssuance(input:{hanaId:Hex}):Promise<QuoteV2IssuanceFact>;readReserveHistory(input:{hanaKey:Hex;bucket:0|1;limit:number;scanBlockSpan:number;cursor?:string}):Promise<QuoteV2ReserveHistoryPage>;readReserveProposal(input:{proposalId:Hex}):Promise<QuoteV2ReserveProposalFact>;readIssuedAt(input:{hanaKey:Hex;scanBlockSpan:number}):Promise<QuoteV2IssuedAtFact>;listQuotes(input:{scanBlockSpan:number}):Promise<QuoteV2QuoteList>;readMarketAnchor(input:{anchor:QuoteV2MarketAnchor}):Promise<QuoteV2MarketAnchorFact>;withMarketAnchorScope<T>(consume:()=>Promise<T>):Promise<T>;readMarketHead(input?:Record<string,never>):Promise<QuoteV2MarketHeadFact>;readMarketWindow(input:QuoteV2MarketWindowQuery):Promise<QuoteV2MarketWindow>;readMarketState(input:QuoteV2MarketStateQuery):Promise<QuoteV2MarketState>;readBondLive(input:QuoteV2BondLiveQuery):Promise<QuoteV2BondLive>;readMigrationEvents(input:{hanaId:Hex}):Promise<QuoteV2Fact&{hanaId:Hex;bond:Address;events:readonly QuoteV2MigrationEvent[]}>}
/** One canonical Launcher ReserveWithdrawn event; amounts are decimal strings. */
export interface QuoteV2ReserveRecord{readonly proposalId:Hex;readonly expectedRemaining:string;readonly bucket:0|1;readonly to:Address;readonly token:Address;readonly amount:string;readonly remaining:string;readonly transactionHash:Hex;readonly transactionIndex:number;readonly logIndex:number;readonly blockNumber:string;readonly blockHash:Hex;readonly blockTimestamp:string}
/** Same-block reserveState counters plus one page of the selected bucket; every page of a cursor chain has the same asOf block. */
export interface QuoteV2ReserveHistoryPage extends QuoteV2Fact{readonly mode:'test-only'|'production';readonly hanaKey:Hex;readonly token:Address;readonly platformAuthority:Address;readonly treasuryInitial:string;readonly treasuryWithdrawn:string;readonly treasuryRemaining:string;readonly creatorInitial:string;readonly creatorWithdrawn:string;readonly creatorRemaining:string;readonly bucket:0|1;readonly totalRecords:number;readonly records:readonly QuoteV2ReserveRecord[];readonly nextCursor:string|null}
/** Launcher reserveProposalUsed at the confirmed block. */
export interface QuoteV2ReserveProposalFact extends QuoteV2Fact{readonly proposalId:Hex;readonly used:boolean}
/** Snapshot block plus the original canonical Issued event; issuedAt equals issuance.blockTimestamp. */
export interface QuoteV2IssuedAtFact extends QuoteV2Fact{readonly mode:'test-only'|'production';readonly hanaKey:Hex;readonly token:Address;readonly bond:Address;readonly requestId:Hex;readonly authorizationHash:Hex;readonly issuedAt:string;readonly issuance:{readonly transactionHash:Hex;readonly transactionIndex:number;readonly logIndex:number;readonly blockNumber:string;readonly blockHash:Hex;readonly blockTimestamp:string}}
/** listQuotes: enabled Factory quoteConfig entries rebuilt from QuoteConfigured events, each equal to the same-block view. */
export interface QuoteV2QuoteList extends QuoteV2Fact{readonly mode:'test-only'|'production';readonly bondFactory:Address;readonly quotes:readonly {readonly quote:Address;readonly virtualQuote:string;readonly name:string;readonly symbol:string;readonly decimals:number;readonly configured:{readonly transactionHash:Hex;readonly blockNumber:string;readonly blockHash:Hex;readonly logIndex:number}}[]}
/** Registry market snapshot fields shared by every market read. */
export interface QuoteV2MarketFact extends QuoteV2Fact{readonly mode:'test-only'|'production';readonly sourceRef:string}
/** Fixed-block read: every view and log is taken at this confirmed block (e.g. the snapshot of an Issued enumeration). */
export interface QuoteV2MarketAnchor{blockNumber:string;blockHash:Hex}
export interface QuoteV2MarketAsset{readonly address:Address;readonly name:string;readonly symbol:string;readonly decimals:number}
export interface QuoteV2MarketIssuance{readonly hanaKey:Hex;readonly requestId:Hex;readonly token:Address;readonly bond:Address;readonly issuer:Address;readonly hanaTreasury:Address;readonly phase:'bond'|'migrated'|'inactive';readonly pointsBps:number;readonly earlyReleaseAllowed:boolean;readonly earlyReleaseAt:string|null;readonly migratedAt:string|null;readonly pair:Address|null;readonly pool:Address;readonly quote:Address;readonly releaseStartedAt:string|null;readonly releaseStartSource:'early-release'|'migration'|null}
export interface QuoteV2MarketBucket{readonly authority:Address;readonly holder:Address;readonly initial:string;readonly withdrawn:string;readonly remaining:string}
export interface QuoteV2MarketAllocation{readonly source:'canonical-launcher-issuance-and-reserves';readonly supply:{readonly pointsBps:number;readonly pointsAirdrop:string;readonly platformReserve:string;readonly creatorReserve:string;readonly curve:string;readonly liquidity:string};readonly pointsBps:number;readonly creatorCustody:QuoteV2MarketBucket;readonly platformReserve:QuoteV2MarketBucket;readonly frozenHolderAllocations:'separate-custody-provider'}
export type QuoteV2MarketFacts=QuoteV2MarketFact&({readonly hanaKey:Hex;readonly status:'unissued';readonly issuance:null}|{readonly hanaKey:Hex;readonly status:'issued';readonly issuance:QuoteV2MarketIssuance;readonly sold:string;readonly sales:string;readonly remaining:string;
 readonly price:{readonly kind:'curve-marginal-rational'|'pool-reserve-rational';readonly numerator:string;readonly denominator:string;readonly base:Address;readonly quote:Address}|null;
 readonly poolReserves:{readonly pair:Address;readonly baseToken:Address;readonly quoteToken:Address;readonly baseReserve:string;readonly quoteReserve:string}|null;readonly totalSupply:string;readonly tokenMetadata:QuoteV2MarketAsset;readonly quoteMetadata:QuoteV2MarketAsset;readonly allocation:QuoteV2MarketAllocation;
 readonly bondCurve:{readonly market:'bond';readonly bond:Address;readonly active:boolean;readonly virtualHana:string;readonly virtualQuote:string;readonly sales:string;readonly sold:string;readonly position:{readonly kind:'block-end';readonly blockNumber:string;readonly blockHash:Hex;readonly blockTimestamp:string}}});
export interface QuoteV2CanonicalEvent{readonly event:string;readonly address:Address;readonly args:Readonly<Record<string,string|number|boolean>>;readonly transactionHash:Hex;readonly transactionIndex:number;readonly logIndex:number;readonly blockNumber:string;readonly blockHash:Hex;readonly blockTimestamp:string;readonly eventId:string;readonly source:'canonical-chain-event'}
export type QuoteV2HistoryPosition={readonly kind:'event';readonly address:Address;readonly blockNumber:string;readonly blockHash:Hex;readonly blockTimestamp:string;readonly transactionHash:Hex;readonly transactionIndex:number;readonly logIndex:number}|{readonly kind:'block-end';readonly blockNumber:string;readonly blockHash:Hex;readonly blockTimestamp:string};
export interface QuoteV2HistoryPrice{readonly base:Address;readonly quote:Address;readonly numerator:string;readonly denominator:string;readonly basis:'quote-base-units-per-token-base-unit'}
export type QuoteV2HistorySupply={readonly status:'available';readonly totalSupply:string;readonly basis:'verified-constant-supply';readonly source:QuoteV2HistoryPosition}|null;
export type QuoteV2HistoryState={readonly position:QuoteV2HistoryPosition;readonly sourceRefs:readonly QuoteV2HistoryPosition[];readonly supply:QuoteV2HistorySupply}&(
 {readonly market:'bond';readonly bond:Address;readonly virtualQuote:string;readonly virtualHana:string;readonly sold:string;readonly netReserve:string;readonly price:QuoteV2HistoryPrice}|
 {readonly market:'swap'|'pool-pending';readonly pair:Address;readonly token0:Address;readonly token1:Address;readonly reserve0:string;readonly reserve1:string;readonly baseReserve:string;readonly quoteReserve:string;readonly price:QuoteV2HistoryPrice|null});
export type QuoteV2HistoryRecord={readonly kind:'trade';readonly event:QuoteV2CanonicalEvent&{readonly market:'bond'|'swap';readonly side:'buy'|'sell';readonly tokenAmount:string;readonly quoteAmount:string;readonly amountBasis:'bond-principal-excludes-fees'|'pool-swap-flow';readonly account:Address;readonly accountBasis:'bond-event-account'|'transaction-from';readonly recipient:Address|null};readonly before:QuoteV2HistoryState;readonly after:QuoteV2HistoryState;readonly fees:readonly unknown[];readonly flow:{readonly basis:'bond-protocol-flow'|'pool-swap-flow';readonly input:{readonly asset:Address;readonly amount:string};readonly output:{readonly asset:Address;readonly amount:string}};readonly walletFlow:{readonly status:'not-attested'}}|
 {readonly kind:'state-change';readonly event:QuoteV2CanonicalEvent;readonly reason:'pool-sync'|'migration';readonly relatedEvent:QuoteV2CanonicalEvent|null;readonly appliesToActiveMarket:boolean;readonly before:QuoteV2HistoryState;readonly after:QuoteV2HistoryState;readonly countAsTrade:false};
/** Public read failure projection: QuoteV2Error codes plus QUOTE_V2_RPC_RATE_LIMITED (JSON-RPC -32005 or HTTP 429)
 * and QUOTE_V2_RPC_TRANSPORT_FAILED (viem HttpRequestError/TimeoutError) found anywhere in the cause chain;
 * generic message; null for any other error. */
export declare function publicQuoteV2ReadError(error:unknown):{readonly statusCode:400|404|503;readonly code:string;readonly message:string;readonly need:{readonly action:string}}|null;
export declare function createQuoteV2Reader(options:{deployment:QuoteV2Deployment;publicClient:Pick<PublicClient,'getChainId'|'getBlock'|'getCode'|'readContract'|'getLogs'|'getTransaction'|'multicall'>;confirmations:number;fromBlock:bigint;mode:'test-only'|'production';multicall3Address?:`0x${string}`;readRpcBatch:QuoteV2ReadRpcBatch}):Promise<QuoteV2Reader>;

/** Fixed20% gas margin from Uniswap/interface v4.0.0 calculateGasMargin. */
export declare function calculateQuoteV2GasMargin(estimate:bigint):bigint;

/** Chain-owned issuance range and frozen inventory formula; used by custody. */
export declare function isValidPointsBps(value:unknown):boolean;
/** Chain-owned launch fee rule (Launcher uint256: 0 allowed, no other cap); bigint or canonical decimal wei string; used by custody. */
export declare function isLaunchFeeWei(value:unknown):boolean;
export declare function quoteV2SupplySplit(pointsBps:number|bigint):Readonly<{pointsAmount:bigint;treasuryReserve:bigint;creatorReserve:bigint;bondAmount:bigint}>;

export interface QuoteV2CampaignParams {campaignId:Hex;token:Address;bond:Address;rightsRoot:Hex;budget:bigint}
export interface QuoteV2ReleaseAuthorization {epoch:bigint;nonce:bigint;deadline:bigint}
export interface QuoteV2CreateCampaignInput extends QuoteV2ReleaseAuthorization {deployment:QuoteV2Deployment;params:QuoteV2CampaignParams}
export interface QuoteV2ReleaseIdInput {deployment:QuoteV2Deployment;campaignId:Hex}
export interface QuoteV2OpenRegistrationInput extends QuoteV2ReleaseIdInput,QuoteV2ReleaseAuthorization {}
export interface QuoteV2RegistrationAuthorization extends QuoteV2ReleaseAuthorization {campaignId:Hex;entitlementId:Hex;committedAccount:Address;account:Address;total:bigint;amount:0n;caseId:Hex;version:bigint}
export interface QuoteV2RegisterInput {deployment:QuoteV2Deployment;authorization:QuoteV2RegistrationAuthorization}
export interface QuoteV2Sender {account:Address;gas?:bigint}
export interface QuoteV2ReleaseTypedData<T extends string,M> {readonly domain:ReturnType<typeof quoteV2ReleaseDomain>;readonly primaryType:T;readonly types:Readonly<Record<T,readonly {readonly name:string;readonly type:string}[]>>;readonly message:M}
export declare function quoteV2CreateCampaignTypedData(input:QuoteV2CreateCampaignInput):QuoteV2ReleaseTypedData<'CreateCampaign',QuoteV2CampaignParams&QuoteV2ReleaseAuthorization>;
export declare function quoteV2OpenRegistrationTypedData(input:QuoteV2OpenRegistrationInput):QuoteV2ReleaseTypedData<'OpenRegistration',Omit<QuoteV2OpenRegistrationInput,'deployment'>>;
export declare function quoteV2RegisterTypedData(input:QuoteV2RegisterInput):QuoteV2ReleaseTypedData<'Register',QuoteV2RegistrationAuthorization>;
export interface QuoteV2ReleasePolicy {readonly 'release.initialBps':number;readonly 'release.linearDays':number;readonly 'release.stepHours':number;readonly 'release.cliffDays':number;readonly 'release.bindingClaimWindowDays':number}
export interface QuoteV2ReleaseStart {readonly started:boolean;readonly trigger:'early-release'|'migration'|'none';readonly startedAt:string;readonly earlyReleaseAllowed:boolean}
export interface QuoteV2StartTransaction {readonly transactionHash:Hex;readonly blockNumber:string;readonly blockHash:Hex}
export interface QuoteV2ReleaseStartFact extends QuoteV2Fact {readonly hanaId:Hex;readonly token:Address;readonly bond:Address;readonly releaseStart:QuoteV2ReleaseStart;readonly bondMigration:{readonly migrated:boolean;readonly migratedAt:string;readonly pair:Address};readonly startTransaction?:QuoteV2StartTransaction}
export interface QuoteV2CampaignState {readonly token:Address;readonly bond:Address;readonly rightsRoot:Hex;readonly budget:string;readonly releaseStartedAt:string;readonly openedAt:string;readonly registrationDeadline:string;readonly allocated:string;readonly funded:boolean}
export interface QuoteV2RightState {readonly committedAccount:Address;readonly account:Address;readonly total:string;readonly cap:string;readonly claimed:string;readonly deducted:string;readonly restored:string;readonly checkpointVested:string;readonly checkpointDay:string;readonly version:string;readonly registered:boolean;readonly swept:boolean;readonly originalCurve:boolean;readonly vested:string;readonly claimable:string}
export interface QuoteV2ReleaseStateQuery {readonly campaignId:Hex;readonly entitlementId:Hex;readonly token:Address;readonly bond:Address;/** Required for claim facts; application key provided by the host. */readonly hanaId?:Hex}
export interface QuoteV2ReleaseStateFact extends QuoteV2Fact {readonly mode:'test-only'|'production';readonly release:Address;readonly rootSigner:Address;readonly treasury:Address;readonly bondFactory:Address;readonly penaltyMode:'reschedule'|'original-cap';readonly policyLocked:true;readonly policy:QuoteV2ReleasePolicy;readonly campaignId:Hex;readonly entitlementId:Hex;readonly token:Address;readonly bond:Address;readonly observedAt:{readonly blockNumber:string;readonly blockHash:Hex;readonly timestamp:string};readonly epoch:string;readonly campaign:QuoteV2CampaignState;readonly right:QuoteV2RightState;readonly releaseStart:QuoteV2ReleaseStart;readonly bondMigration:QuoteV2ReleaseStartFact['bondMigration'];readonly startTransaction?:QuoteV2StartTransaction;readonly issuance?:Pick<QuoteV2Issuance,'pointsBps'|'earlyReleaseAllowed'>}
export interface QuoteV2EntitlementQuery {readonly protocol:'release-quote-v2';readonly evidence:'FIXTURE'|'TRUSTED';readonly hanaId:string;readonly chainId:number;readonly release:Address;readonly campaignId:Hex;readonly entitlementId:Hex;readonly token:Address;readonly bond:Address;readonly issuance:{readonly pointsBps:number;readonly earlyReleaseAllowed:boolean}}
export interface QuoteV2ClaimChainState {readonly protocol:'release-quote-v2';readonly evidence:'FIXTURE'|'TRUSTED';readonly chainId:number;readonly release:Address;readonly hanaId:string;readonly campaignId:Hex;readonly entitlementId:Hex;readonly sourceRef:string;readonly verifiedAt:string;readonly canonical:true;readonly block:{readonly number:string;readonly hash:Hex;/** ISO UTC */readonly timestamp:string;readonly confirmations:number;readonly requiredConfirmations:number};readonly policyVersion:string;readonly policy:QuoteV2ReleasePolicy;readonly penaltyMode:'reschedule'|'original-cap';readonly releaseStart:QuoteV2ReleaseStart;readonly campaign:(QuoteV2CampaignState&{readonly migratedAt:string})|null;readonly right:QuoteV2RightState|null}
export interface QuoteV2CustodyStartBase {readonly protocol:'custody-release-start-v1';readonly evidence:'TRUSTED'|'FIXTURE';readonly hanaId:string;readonly campaignId:string;readonly verifiedAt:string;readonly sourceRef:string;readonly earlyReleaseAllowed:boolean;readonly source:{readonly protocol:'release-quote-v2';readonly chainId:number;readonly hanaKey:Hex;readonly blockNumber:string;readonly blockHash:Hex;/** ISO UTC */readonly blockTimestamp:string;readonly confirmations:number;readonly requiredConfirmations:number}}
export type QuoteV2CustodyStartFact=QuoteV2CustodyStartBase&({readonly status:'not-started'}|({readonly status:'started';readonly trigger:'early-release'|'migration';/** ISO UTC */readonly startedAt:string}&QuoteV2StartTransaction));
export interface QuoteV2ReleasePorts {
 readonly publicationReader:{read(input:Omit<QuoteV2ReleaseStateQuery,'hanaId'>):Promise<Omit<QuoteV2ReleaseStateFact,'confirmations'>&{readonly confirmations:string}>};
 readonly chainState:{readonly protocol:'release-quote-v2';readonly evidence:'FIXTURE'|'TRUSTED';read(input:QuoteV2EntitlementQuery):Promise<QuoteV2ClaimChainState>};
 readonly releaseStartFacts:{readonly protocol:'custody-release-start-v1';readonly deploymentProtocol:'release-quote-v2';readonly evidence:'FIXTURE'|'TRUSTED';readReleaseStart(input:{hanaId:string;campaignId:string;asOf:string}):Promise<QuoteV2CustodyStartFact>};
}
export declare function createQuoteV2ReleasePorts(options:{reader:QuoteV2Reader;hanaKey:(hanaId:string)=>Hex;now?:()=>Date}):QuoteV2ReleasePorts;




export interface QuoteV2ReadRpcQuery {readonly method:'eth_chainId'|'eth_getCode'|'eth_getBlockByNumber'|'eth_getTransactionByHash';readonly params:readonly unknown[]}
export type QuoteV2ReadRpcBatch=(queries:readonly QuoteV2ReadRpcQuery[])=>Promise<readonly unknown[]>;
/** Compose the existing explicit viem HTTP client; no provider URL or credential inference. */
export declare function createQuoteV2ReadRpcBatch(rpc:Pick<ReturnType<typeof import('viem/utils').getHttpRpcClient>,'request'>):QuoteV2ReadRpcBatch;


/** CH1 indexer market reads. A binding is the one-time verified issuance of a Hana (owner 11-08: deployment once at
 * startup, each Hana once at its first materialization); a carry is its market state at the end of its last window.
 * Both are Chain outputs the caller stores verbatim; their domain digest binds them to this deployment and hanaKey. */
export interface QuoteV2MarketBinding {readonly schema:'hanamesh-chain-market-binding-v1';readonly hanaKey:Hex;readonly requestId:Hex;readonly token:Address;readonly bond:Address;readonly pool:Address;readonly quote:Address;readonly issuer:Address;readonly hanaTreasury:Address;readonly authorizationHash:Hex;readonly pointsBps:number;readonly pointsAmount:string;readonly treasuryReserve:string;readonly creatorReserve:string;readonly earlyReleaseAllowed:boolean;readonly virtualQuote:string;readonly launchFeeWei:string;readonly virtualHana:string;readonly sales:string;readonly liquidity:string;readonly total:string;readonly totalSupply:string;readonly buckets:{readonly treasury:0|1;readonly creator:0|1};readonly order:{readonly token0:Address;readonly token1:Address;readonly tokenFirst:boolean};readonly tokenMetadata:QuoteV2MarketAsset;readonly quoteMetadata:QuoteV2MarketAsset;readonly issued:QuoteV2CanonicalEvent;readonly verifiedAt:QuoteV2MarketAnchor;readonly domain:Hex}
export interface QuoteV2MarketCarry {readonly schema:'hanamesh-chain-market-carry-v1';readonly hanaKey:Hex;readonly cur:QuoteV2HistoryState;readonly pool:{readonly r0:string;readonly r1:string;readonly position:QuoteV2HistoryPosition|null};readonly closed:QuoteV2HistoryPosition|null;readonly boundary:QuoteV2MarketPhaseBoundary|null;readonly early:{readonly startedAt:string;readonly position:QuoteV2HistoryPosition}|null;readonly reserves:{readonly treasury:{readonly withdrawn:string;readonly remaining:string};readonly creator:{readonly withdrawn:string;readonly remaining:string}};readonly campaigns:readonly Hex[];readonly domain:Hex}
export interface QuoteV2MarketPhaseBoundary {readonly migratedAt:string;readonly event:QuoteV2CanonicalEvent;readonly tailState:QuoteV2HistoryState;readonly initialPoolState:QuoteV2HistoryState;readonly initialPoolSync:QuoteV2CanonicalEvent;readonly initialPoolMint:QuoteV2CanonicalEvent}
export interface QuoteV2MarketMember {readonly hanaKey:Hex;readonly binding:QuoteV2MarketBinding;readonly carry:QuoteV2MarketCarry}
/** One explicit block window [fromBlock, min(fromBlock+scanBlockSpan-1, anchor)] for every known member plus the Hanas issued in it.
 * `after` is the caller's previous window end (null only for the first window at the deployment block); it must still be
 * canonical (header identity only) and every member's carry is its state there. No archive state is read. */
export interface QuoteV2MarketWindowQuery {readonly anchor:QuoteV2MarketAnchor;readonly after:QuoteV2MarketAnchor|null;readonly fromBlock:string;readonly scanBlockSpan:number;readonly members:readonly QuoteV2MarketMember[]}
export interface QuoteV2MarketWindow extends QuoteV2MarketFact {readonly schema:'hanamesh-chain-market-window-v1';readonly launcher:Address;readonly fromBlock:string;readonly scanFromBlock:string;readonly scanToBlock:string;readonly throughBlockHash:Hex;
 readonly issued:readonly {readonly hanaKey:Hex;readonly event:QuoteV2CanonicalEvent;readonly binding:QuoteV2MarketBinding;readonly initialState:QuoteV2HistoryState}[];
 readonly members:readonly {readonly hanaKey:Hex;readonly records:readonly QuoteV2HistoryRecord[];readonly events:readonly QuoteV2CanonicalEvent[];readonly transfers:readonly QuoteV2CanonicalEvent[];readonly poolEvents:readonly QuoteV2CanonicalEvent[];readonly reserves:readonly QuoteV2CanonicalEvent[];readonly phaseBoundary?:QuoteV2MarketPhaseBoundary;readonly carry:QuoteV2MarketCarry}[] /* only members with activity in the window; every other carry is unchanged */}
/** Reconcile the members' current carries (the caller is synced through the anchor) with the Bond, reserve, pool and listed holders' balance views at that block. */
export interface QuoteV2MarketStateQuery {readonly anchor:QuoteV2MarketAnchor;readonly members:readonly (QuoteV2MarketMember&{readonly holders:readonly {readonly address:Address;readonly balance:string}[]})[]}
export interface QuoteV2MarketState extends QuoteV2MarketFact {readonly schema:'hanamesh-chain-market-state-v1';readonly launcher:Address;readonly records:readonly {readonly hanaKey:Hex;readonly holders:readonly {readonly address:Address;readonly balance:string}[];readonly pool:{readonly totalSupply:string;readonly minimumLiquidity:string}|null;readonly facts:Omit<Extract<QuoteV2MarketFacts,{status:'issued'}>,keyof QuoteV2MarketFact>}[]}
/** Trading-panel read at the latest confirmed block: exactly four HTTP requests. */
export interface QuoteV2BondLiveQuery {readonly hanaKey:Hex;readonly binding:QuoteV2MarketBinding;readonly account?:Address;readonly quote?:{readonly kind:'buyExact'|'buyBudget'|'sell';readonly amount:string}}
export interface QuoteV2BondLive extends QuoteV2MarketFact {readonly schema:'hanamesh-chain-bond-live-v1';readonly hanaKey:Hex;readonly token:Address;readonly bond:Address;readonly pool:Address;readonly quote:Address;readonly issuer:Address;readonly virtualQuote:string;readonly virtualHana:string;readonly sales:string;readonly totalSupply:string;readonly earlyReleaseAllowed:boolean;
 readonly active:boolean;readonly sold:string;readonly netReserve:string;readonly releaseStartedAt:string;readonly migrationStatus:QuoteV2MigrationStatus;readonly migrationState:QuoteV2MigrationState;readonly migrationHana:string;readonly migrationQuote:string;readonly migrationPoolHana:string;readonly migrationPoolQuote:string;
 readonly curvePrice:{readonly numerator:string;readonly denominator:string};readonly poolReserves:{readonly baseReserve:string;readonly quoteReserve:string};/** Facts price rule: curve marginal while active, pool reserves once migrated, else null. */readonly price:{readonly kind:'curve-marginal-rational'|'pool-reserve-rational';readonly numerator:string;readonly denominator:string;readonly base:Address;readonly quote:Address}|null;readonly quoted:{readonly kind:'buyExact'|'buyBudget'|'sell';readonly amount:string;readonly values:readonly string[]}|null;
 readonly account:{readonly address:Address;readonly sellQuota:string;readonly sellable:string;readonly hanaBalance:string;readonly quoteBalance:string;readonly nativeBalance:string;readonly allowances:{readonly hana:string;readonly quote:string}}|null}
/** Declared per-getter gas budgets of the market multicalls. */
export declare const QUOTE_V2_MARKET_GETTER_BUDGETS:Readonly<Record<string,bigint>>;
/** Header-only canonical identity of an already-known anchor (0.39.14). */
export interface QuoteV2MarketAnchorFact extends QuoteV2MarketFact {readonly schema:'hanamesh-chain-market-anchor-v1';readonly launcher:Address;readonly fromBlock:string}
/** Latest confirmed block identity (headers only, no contract state): the indexer round snapshot. */
export interface QuoteV2MarketHeadFact extends QuoteV2MarketFact {readonly schema:'hanamesh-chain-market-head-v1';readonly launcher:Address;readonly fromBlock:string}
