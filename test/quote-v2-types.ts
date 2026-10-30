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
