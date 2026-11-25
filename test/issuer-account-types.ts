import type {OwnIssuerReward,OwnIssuerRewardsPage,OwnIssuerRewardsQuery,OwnIssuerEntitlementsQuery,OwnIssuedAccountPage,IssuerAccountHttpFailure} from '@hanamesh/api-contracts/issuer/account';
declare const reward:OwnIssuerReward;declare const page:OwnIssuerRewardsPage;declare const account:OwnIssuedAccountPage;
const amount:string=reward.amount,total:string=reward.entitlementAmount,count:number=account.totalIssued;
const q:OwnIssuerRewardsQuery={limit:20},batch:OwnIssuerEntitlementsQuery={issuances:[{hanaId:reward.hanaId,requestKey:reward.requestKey}]};
// @ts-expect-error frozen-only DTO has no current claimable estimate
const claimable=reward.claimable;
// @ts-expect-error self resource cannot select another principal
const foreign:OwnIssuerRewardsQuery={principalId:'foreign'};
// @ts-expect-error current wallet is not frozen principal ownership
const wallet:OwnIssuerEntitlementsQuery={issuances:[],wallet:'0x0'};
const failure:IssuerAccountHttpFailure={statusCode:403,body:{error:{code:'CUSTODY_READ_CURSOR_FORBIDDEN',message:'scope'}}};
// @ts-expect-error code and status remain correlated
const wrong:IssuerAccountHttpFailure={statusCode:401,body:{error:{code:'CUSTODY_READ_CURSOR_FORBIDDEN',message:'scope'}}};
void [amount,total,count,q,batch,page,claimable,foreign,wallet,failure,wrong];
