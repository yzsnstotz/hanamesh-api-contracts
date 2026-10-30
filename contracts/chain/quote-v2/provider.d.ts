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
export type QuoteV2MigrationReason=0|1|2|3|4|5;
export declare const QUOTE_V2_MIGRATION_REASONS:readonly ['None','HistoryUnavailable','PriceOutsideBand','NoFeasibleLiquidity','PoolUnavailable','ExecutionFailed'];
export interface QuoteV2MigrationStatus{closed:boolean;completed:boolean;historyReady:boolean;lastReason:QuoteV2MigrationReason;closedAt:string;migratedAt:string;closingQuote:string;windowSeconds:string;averageX112:string;spotX112:string}
export type QuoteV2MigrationState='open'|'pending'|'completed';
export declare function quoteV2MigrationState(status:Pick<QuoteV2MigrationStatus,'closed'|'completed'>):QuoteV2MigrationState;
export interface QuoteV2Fact{protocol:'release-quote-v2';chainId:number;evidence:'FIXTURE'|'READ_ONLY_RPC';blockNumber:string;blockHash:Hex;blockTimestamp:string;sourceCommit:string;requiredConfirmations:number}
export interface QuoteV2Issuance extends QuoteV2Fact{hanaId:Hex;token:Address;bond:Address;pool:Address;payer:Address;hanaTreasury:Address;requestId:Hex;authorizationHash:Hex;quote:Address;virtualQuote:string;launchFeeWei:string;pointsBps:string;pointsAmount:string;earlyReleaseAllowed:boolean;treasuryReserve:string;creatorReserve:string}
export interface QuoteV2BondFact extends QuoteV2Fact{hanaId:Hex;token:Address;bond:Address;pool:Address;quote:Address;virtualQuote:string;account:Address;active:boolean;sold:string;netReserve:string;sellQuota:string;sellable:string;releaseStartedAt:string;migrationStatus:QuoteV2MigrationStatus;migrationState:QuoteV2MigrationState;migrationHana:string;migrationQuote:string;migrationPoolHana:string;migrationPoolQuote:string}
export interface QuoteV2MigrationEvent{eventName:'BondClosed'|'MigrationDeferred'|'Migrated';args:Readonly<Record<string,string|number|boolean>>;blockNumber:string;blockHash:Hex;transactionHash:Hex;logIndex:number}
export interface QuoteV2BuyQuote extends QuoteV2Fact{hanaId:Hex;bond:Address;quote:Address;kind:'exact'|'budget';hana:string;principal:string;hanaFee:string;meshFee:string;total:string;nativePaymentAvailable:boolean}
export interface QuoteV2SellQuote extends QuoteV2Fact{hanaId:Hex;bond:Address;quote:Address;account:Address;amount:string;principal:string;hanaFee:string;meshFee:string;receive:string;sellable:string;nativeProceeds:boolean}
export interface QuoteV2Reader{quoteBuy(input:{hanaId:Hex;kind:'exact'|'budget';amount:bigint}):Promise<QuoteV2BuyQuote>;quoteSell(input:{hanaId:Hex;amount:bigint;account:Address}):Promise<QuoteV2SellQuote>;verifyDeployment():Promise<QuoteV2Fact&{deployment:QuoteV2Deployment}>;readQuoteConfig(input:{quote:Address}):Promise<QuoteV2Fact&{quote:Address;virtualQuote:string;enabled:boolean}>;readIssuance(input:{hanaId:Hex}):Promise<QuoteV2Issuance>;readBond(input:{hanaId:Hex;account:Address}):Promise<QuoteV2BondFact>;readMigrationEvents(input:{hanaId:Hex}):Promise<QuoteV2Fact&{hanaId:Hex;bond:Address;events:readonly QuoteV2MigrationEvent[]}>}
export declare function createQuoteV2Reader(options:{deployment:QuoteV2Deployment;publicClient:Pick<PublicClient,'getChainId'|'getBlock'|'getCode'|'readContract'|'getLogs'>;confirmations:number;fromBlock:bigint;mode:'test-only'|'production'}):Promise<QuoteV2Reader>;

export declare function prepareQuoteV2Migration(options:Parameters<typeof createQuoteV2Reader>[0]&{publicClient:PublicClient;hanaId:Hex;account:Address}):Promise<{readonly call:QuoteV2Call&{gas:bigint};readonly completed:boolean;readonly simulations:number;readonly blockNumber:string;readonly blockHash:Hex}>;
