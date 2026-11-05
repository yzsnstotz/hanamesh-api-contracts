import type {QuoteV2Deployment,QuoteV2Authorization,QuoteV2Reader,QuoteV2BondFact} from '@hanamesh/api-contracts/chain/quote-v2';
import {QUOTE_V2_CONTRACT} from '@hanamesh/api-contracts/chain/quote-v2';
const protocol:'release-quote-v2'=QUOTE_V2_CONTRACT.protocol;declare const d:QuoteV2Deployment;declare const auth:QuoteV2Authorization;declare const reader:QuoteV2Reader;
const fee:bigint=auth.launchFeeWei;const quote:`0x${string}`=auth.quote;
async function check(){const f:QuoteV2BondFact=await reader.readBond({hanaId:auth.hanaId,account:auth.payer});const state:'open'|'pending'|'completed'=f.migrationState;return state;}
// @ts-expect-error quote-v2 metadata cannot use the old generation
const bad:QuoteV2Deployment={...d,protocol:'unsupported'};
void [protocol,fee,quote,check,bad];

import type {calculateQuoteV2GasMargin as Margin} from '@hanamesh/api-contracts/chain/quote-v2';
declare const margin:typeof Margin;
const gas:bigint=margin(604617n);void gas;

import type {QuoteV2MigrationReason} from '@hanamesh/api-contracts';
// @ts-expect-error only the active migration reasons are exposed
const retiredFour:QuoteV2MigrationReason=4;
// @ts-expect-error only the active migration reasons are exposed
const retiredFive:QuoteV2MigrationReason=5;
void [retiredFour,retiredFive];


import type {QuoteV2MarketBalances,createQuoteV2Reader as CreateReader} from '@hanamesh/api-contracts';
import type {PublicClient} from 'viem';
async function balances(){
 const page:QuoteV2MarketBalances=await reader.readMarketBalances({hanaKeys:[auth.hanaId],account:auth.payer,anchor:{blockNumber:'42',blockHash:auth.snapshot}});
 const amount:string=page.records[0]!.balance;return amount;
}
type BalanceClient=Parameters<typeof CreateReader>[0]['publicClient'];
declare const balanceClient:BalanceClient;const multicall:PublicClient['multicall']=balanceClient.multicall;
// @ts-expect-error balances always use an explicit Issued enumeration anchor
reader.readMarketBalances({hanaKeys:[auth.hanaId],account:auth.payer});
void [balances,multicall];

async function issuedIndexSources(){
 const captured=await reader.readMarketPhases({hanaKeys:[]});
 const anchor={blockNumber:captured.blockNumber,blockHash:captured.blockHash};
 const phase=await reader.readMarketPhases({hanaKeys:[auth.hanaId],anchor});
 const stage:'bond'|'migrated'|'inactive'=phase.records[0]!.phase;
 const window=await reader.readMarketIssuedWindow({fromBlock:'40',scanBlockSpan:10,anchor});
 const schema:'quote-v2-issued-window-v1'=window.schema;
 // @ts-expect-error a delta window cannot select a new anchor implicitly
 reader.readMarketIssuedWindow({fromBlock:'40',scanBlockSpan:10});
 return [stage,schema];
}
void issuedIndexSources;

async function publicSell(){
 const q=await reader.previewSell({hanaId:auth.hanaId,amount:1n});
 const principal:string=q.principal,receive:string=q.receive;
 // @ts-expect-error public reference has no account-bound sell quota
 q.sellable;
 // @ts-expect-error public reference has no account
 q.account;
 return [principal,receive];
}
void publicSell;
