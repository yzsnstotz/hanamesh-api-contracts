import type {OwnIssuedToken,OwnIssuedTokensPage,IndexerIssuerHttpFailure} from '../read/index.js';
export interface IssuerRewardKey {readonly hanaId:string;readonly requestKey:string}
/** Frozen issuer role only; not a current claimable or received balance. */
export interface OwnIssuerReward extends IssuerRewardKey {readonly requestId:string;readonly frozenAt:string;readonly snapshotHash:string;readonly amount:string;readonly entitlementAmount:string;readonly route:'ordinary'|'empty'|'no-airdrop';readonly status:'frozen'|'no-reward'}
export type IssuerRewardResult=OwnIssuerReward|Readonly<IssuerRewardKey&{status:'not-owned'}>;
export interface OwnIssuerRewardsQuery {readonly limit?:number;readonly cursor?:string}
export interface OwnIssuerEntitlementsQuery {readonly issuances:readonly IssuerRewardKey[]}
export interface OwnIssuerEntitlements {readonly schema:'hanamesh-own-issuer-entitlements-v1';readonly evidence:'FIXTURE'|'TRUSTED';readonly items:readonly IssuerRewardResult[]}
export interface OwnIssuerRewardsPage {readonly schema:'hanamesh-own-issuer-rewards-v1';readonly evidence:'FIXTURE'|'TRUSTED';readonly asOf:string;readonly limit:number;readonly maxLimit:50;readonly items:readonly OwnIssuerReward[];readonly nextCursor:string|null;readonly coverage:'frozen-initiator-role'}
export type OwnIssuedAccountToken=OwnIssuedToken&Readonly<{reward:IssuerRewardResult|{readonly status:'unavailable';readonly code:'HOST_ISSUER_PROFILE_REQUIRED'}}>;
export interface OwnIssuedAccountPage extends Omit<OwnIssuedTokensPage,'schema'|'items'> {readonly schema:'hanamesh-own-issued-account-v1';readonly items:readonly OwnIssuedAccountToken[]}
export declare const ISSUER_ACCOUNT_SCHEMA:Readonly<Record<string,unknown>>;
export declare const ISSUER_ACCOUNT_ERRORS:Readonly<{
 readonly custody:Readonly<{readonly CUSTODY_AUTH_REQUIRED:401;readonly CUSTODY_ORIGIN_REJECTED:403;readonly CUSTODY_READ_INPUT_INVALID:400;readonly CUSTODY_READ_CURSOR_INVALID:400;readonly CUSTODY_READ_CURSOR_FORBIDDEN:403;readonly CUSTODY_READ_SOURCE_REQUIRED:503}>;
 readonly host:Readonly<{readonly HOST_ISSUER_ORIGIN_REJECTED:403;readonly HOST_ISSUER_SOURCE_REQUIRED:503;readonly HOST_ISSUER_SOURCE_INVALID:503;readonly HOST_ISSUER_RESPONSE_TOO_LARGE:503}>;
}>;
type Failures<G extends Readonly<Record<string,number>>,Need extends boolean>= {[C in keyof G]:Readonly<{statusCode:G[C];body:{readonly error:Readonly<{code:C;message:string}>&(Need extends true?Readonly<{need?:{readonly input:string;readonly scope:'custody-read-model'}}>:object)}}>}[keyof G];
export type IssuerAccountHttpFailure=IndexerIssuerHttpFailure|Failures<typeof ISSUER_ACCOUNT_ERRORS.custody,true>|Failures<typeof ISSUER_ACCOUNT_ERRORS.host,false>;
