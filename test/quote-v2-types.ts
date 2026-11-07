import type {QuoteV2Deployment,QuoteV2Authorization,QuoteV2Reader,QuoteV2MarketWindow,QuoteV2MarketState,QuoteV2BondLive,QuoteV2MarketAnchorFact,QuoteV2MarketHeadFact,QuoteV2ReadRpcQuery} from '@hanamesh/api-contracts/chain/quote-v2';
import {QUOTE_V2_CONTRACT} from '@hanamesh/api-contracts/chain/quote-v2';
import type {createQuoteV2Reader as CreateReader,createQuoteV2ReadRpcBatch as CreateRpcBatch,calculateQuoteV2GasMargin as Margin,QuoteV2MigrationReason} from '@hanamesh/api-contracts';
import type {createQuoteV2Reader as CreateSubpathReader} from '@hanamesh/api-contracts/chain/quote-v2';
import type {PublicClient} from 'viem';

const protocol:'release-quote-v2'=QUOTE_V2_CONTRACT.protocol;
declare const d:QuoteV2Deployment;
declare const auth:QuoteV2Authorization;
declare const reader:QuoteV2Reader;
const fee:bigint=auth.launchFeeWei;
const quote:`0x${string}`=auth.quote;
// @ts-expect-error only the current deployment protocol is accepted
const bad:QuoteV2Deployment={...d,protocol:'unsupported'};
// @ts-expect-error only the active migration reasons are exposed
const retiredFour:QuoteV2MigrationReason=4;
// @ts-expect-error only the active migration reasons are exposed
const retiredFive:QuoteV2MigrationReason=5;
declare const margin:typeof Margin;
const gas:bigint=margin(604617n);

// The current market ports preserve the explicit anchor, binding and carry types.
async function marketPorts(){
 const head:QuoteV2MarketHeadFact=await reader.readMarketHead();
 const anchor={blockNumber:head.blockNumber,blockHash:head.blockHash};
 const captured:QuoteV2MarketAnchorFact=await reader.withMarketAnchorScope(()=>reader.readMarketAnchor({anchor}));
 const window:QuoteV2MarketWindow=await reader.readMarketWindow({anchor,after:null,fromBlock:'40',scanBlockSpan:10,members:[]});
 const issued=window.issued[0]!;
 const member={hanaKey:issued.hanaKey,binding:issued.binding,carry:window.members[0]!.carry};
 const state:QuoteV2MarketState=await reader.readMarketState({anchor,members:[{...member,holders:[{address:auth.payer,balance:'0'}]}]});
 const live:QuoteV2BondLive=await reader.readBondLive({hanaKey:issued.hanaKey,binding:issued.binding,account:auth.payer,quote:{kind:'buyExact',amount:'1'}});
 const balance:string|undefined=live.account?.hanaBalance;
 const phase:'open'|'pending'|'completed'=live.migrationState;
 const result:string=await reader.withMarketAnchorScope(async()=>captured.schema);
 // @ts-expect-error every window requires an explicit anchor
 reader.readMarketWindow({after:null,fromBlock:'40',scanBlockSpan:10,members:[]});
 // @ts-expect-error carries are required for existing members
 reader.readMarketState({anchor,members:[{hanaKey:issued.hanaKey,binding:issued.binding,holders:[]}]});
 // @ts-expect-error live reads require the sealed Chain binding
 reader.readBondLive({hanaKey:issued.hanaKey});
 // @ts-expect-error quote kind remains a closed union
 reader.readBondLive({hanaKey:issued.hanaKey,binding:issued.binding,quote:{kind:'buy',amount:'1'}});
 // @ts-expect-error the head read takes no cursor or implicit transport options
 reader.readMarketHead({cursor:'old'});
 return [state,live,balance,phase,result];
}

type ReaderClient=Parameters<typeof CreateReader>[0]['publicClient'];
declare const publicClient:ReaderClient;
const multicall:PublicClient['multicall']=publicClient.multicall;
declare const readRpcBatch:ReturnType<typeof CreateRpcBatch>;
const rawReads:Promise<readonly unknown[]>=readRpcBatch([{method:'eth_chainId',params:[]},{method:'eth_getCode',params:[auth.payer,'0x2a']}]);
const chainIdMethod:QuoteV2ReadRpcQuery['method']='eth_chainId';
// @ts-expect-error the transport cannot submit transactions
readRpcBatch([{method:'eth_sendRawTransaction',params:['0x12']}]);

declare const createRootReader:typeof CreateReader;
declare const createSubpathReader:typeof CreateSubpathReader;
declare const readerOptions:Parameters<typeof CreateReader>[0];
const {readRpcBatch:requiredBatch,...withoutReadRpcBatch}=readerOptions;
const requiredCapability:ReturnType<typeof CreateRpcBatch>=requiredBatch;
const createdReader:Promise<QuoteV2Reader>=createRootReader({...withoutReadRpcBatch,readRpcBatch});
const createdSubpathReader:Promise<QuoteV2Reader>=createSubpathReader({...withoutReadRpcBatch,readRpcBatch});
// @ts-expect-error no implicit transport fallback
createRootReader(withoutReadRpcBatch);
// @ts-expect-error the subpath has the same required capability
createSubpathReader(withoutReadRpcBatch);
// @ts-expect-error explicitly undefined is invalid
createRootReader({...withoutReadRpcBatch,readRpcBatch:undefined});

// Zero compatibility: retired methods must remain absent from the public reader.
// @ts-expect-error retired in Chain 0.40.0
reader.withMarketReadBatch;
// @ts-expect-error retired in Chain 0.40.0
reader.withMarketHistoryBatch;
// @ts-expect-error retired in Chain 0.40.0
reader.readMarketHistoryBatch;
// @ts-expect-error retired in Chain 0.40.0
reader.readMarketFactsBatch;
// @ts-expect-error retired in Chain 0.40.0
reader.readMarketHistory;
// @ts-expect-error retired in Chain 0.40.0
reader.readMarketFacts;
// @ts-expect-error retired in Chain 0.40.0
reader.readMarketPhases;
// @ts-expect-error retired in Chain 0.40.0
reader.readMarketBalances;
// @ts-expect-error retired in Chain 0.40.0
reader.readMarketIssuedWindow;
// @ts-expect-error retired in Chain 0.40.0
reader.listIssuedHanaKeys;
// @ts-expect-error retired in Chain 0.40.0
reader.readHoldersAllocation;
// @ts-expect-error retired in Chain 0.40.0
reader.readTimeline;
// @ts-expect-error retired in Chain 0.40.0
reader.readBond;
// @ts-expect-error retired in Chain 0.40.0
reader.quoteBuy;
// @ts-expect-error retired in Chain 0.40.0
reader.previewSell;
// @ts-expect-error retired in Chain 0.40.0
reader.quoteSell;

// The removed DTOs must not survive through either type export.
// @ts-expect-error retired DTO
import type {QuoteV2MarketHistoryBatchPage} from '@hanamesh/api-contracts';
// @ts-expect-error retired DTO
import type {QuoteV2MarketFactsBatch} from '@hanamesh/api-contracts/chain/quote-v2';
// @ts-expect-error retired DTO
import type {QuoteV2BondFact} from '@hanamesh/api-contracts';
// @ts-expect-error retired DTO
import type {QuoteV2MarketBalances} from '@hanamesh/api-contracts/chain/quote-v2';

void [protocol,fee,quote,bad,retiredFour,retiredFive,gas,marketPorts,multicall,rawReads,chainIdMethod,requiredCapability,createdReader,createdSubpathReader];
