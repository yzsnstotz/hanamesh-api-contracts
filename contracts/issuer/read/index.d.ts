/** IR1: a resource module owns authentication and bounded SQL; Host only composes its public ports. */
export interface OwnAttachedAddresses {readonly schema:'hanamesh-own-attached-addresses-v1';readonly namespace:'eip155';readonly version:number;readonly maxWallets:10;readonly addresses:readonly string[]}
export interface IssuedHanaProfile {readonly hanaKey:string;readonly hanaId:string|null;readonly displayName:string|null;readonly status:'available'|'not-found'}
export interface IssuedHanaProfilesQuery {readonly deploymentId:string;readonly hanaKeys:readonly string[]}
export interface IssuedHanaProfiles {readonly schema:'hanamesh-issued-hana-profiles-v1';readonly deploymentId:string;readonly maxKeys:50;readonly items:readonly IssuedHanaProfile[]}
export interface IssuerAsset {readonly address:string;readonly name:string;readonly symbol:string;readonly decimals:number}
export interface IssuerSnapshot {readonly protocol:'release-quote-v2';readonly chainId:number;readonly mode:'test-only'|'production';readonly evidence:'FIXTURE'|'READ_ONLY_RPC';readonly sourceCommit:string;readonly sourceRef:string;readonly blockNumber:string;readonly blockHash:string;readonly blockTimestamp:string;readonly confirmations:number;readonly requiredConfirmations:number;readonly launcher:string;readonly fromBlock:string}
export interface OwnIssuedToken {readonly hanaKey:string;readonly requestId:string;readonly issuer:string;readonly token:IssuerAsset;readonly bond:string;readonly pool:string;readonly quote:IssuerAsset;readonly launchFeeWei:string;readonly issuedAt:string;readonly issuedTimestamp:string;readonly transactionHash:string;readonly eventId:string;readonly blockNumber:string;readonly blockHash:string;readonly phase:'bond'|'migrated'|'inactive';readonly sold:string;readonly sales:string;readonly earlyReleaseAllowed:boolean;readonly releaseStartedAt:string|null;readonly releaseStartSource:'early-release'|'migration'|null;readonly migratedAt:string|null;readonly profile:IssuedHanaProfile}
export interface OwnIssuedTokensQuery {readonly deploymentId:string;readonly limit?:number;readonly cursor?:string}
export interface OwnIssuedTokensPage {readonly schema:'hanamesh-own-issued-tokens-v1';readonly deploymentId:string;readonly snapshot:IssuerSnapshot;readonly order:'issued-time-token-desc';readonly limit:number;readonly maxLimit:50;readonly items:readonly OwnIssuedToken[];readonly nextCursor:string|null;readonly rewards:{readonly status:'source-required';readonly code:'ISSUER_REWARDS_BOUNDED_SOURCE_REQUIRED'}}
export declare const ISSUER_READ_SCHEMA:Readonly<Record<string,unknown>>;
export declare const ISSUER_READ_LIMITS:Readonly<{wallets:10;pageDefault:20;pageMax:50;profileKeys:50;cursorBytes:2048;itemBytes:16384;responseBytes:1048576}>;
export declare const ISSUER_READ_ORDER:'issued-time-token-desc';

/** Native resource codes; configuration failures are thrown during construction, never a successful response. */
export declare const ISSUER_READ_ERRORS: Readonly<{
 readonly indexer: Readonly<{readonly AUTH_REQUIRED:401;readonly AUTH_FORBIDDEN:403;readonly INDEXER_ISSUER_INPUT_INVALID:400;readonly INDEXER_ISSUER_CURSOR_INVALID:400;readonly INDEXER_ISSUER_CURSOR_FORBIDDEN:403;readonly INDEXER_ISSUER_WALLETS_CHANGED:409;readonly INDEXER_ISSUER_ORIGIN_REJECTED:403;readonly INDEXER_MARKET_HEAD_CHANGED:409;readonly INDEXER_ISSUED_NOT_READY:409;readonly INDEXER_ISSUED_SOURCE_REQUIRED:503;readonly INDEXER_ISSUED_SOURCE_INVALID:503;readonly INDEXER_ISSUER_SOURCE_INVALID:503;readonly INDEXER_ISSUER_SOURCE_UNAVAILABLE:503;readonly INDEXER_ISSUER_RESPONSE_TOO_LARGE:503;}>;
 readonly identity: Readonly<{readonly AUTH_REQUIRED:401;readonly AUTH_FORBIDDEN:403;readonly IDENTITY_INPUT_INVALID:400;readonly AUTH_UNAVAILABLE:503;readonly IDENTITY_NOT_READY:503;}>;
 readonly registry: Readonly<{readonly REGISTRY_INPUT_INVALID:400;readonly REGISTRY_UNAVAILABLE:503;}>;
 readonly configuration: Readonly<{readonly INDEXER_ISSUER_CONFIG_INVALID:500;readonly INDEXER_ISSUED_CONFIG_INVALID:500;readonly REGISTRY_CONFIG_INVALID:500;}>;
}>;
export interface IssuerReadErrorResponse<C extends string> {readonly error:{readonly code:C;readonly message:string}}
export type IndexerIssuerErrorCode=keyof typeof ISSUER_READ_ERRORS.indexer;
export type IdentityAttachedErrorCode=keyof typeof ISSUER_READ_ERRORS.identity;
export type RegistryIssuedProfilesErrorCode=keyof typeof ISSUER_READ_ERRORS.registry;
export type IndexerIssuerErrorResponse=IssuerReadErrorResponse<IndexerIssuerErrorCode>;
export type IdentityAttachedErrorResponse=IssuerReadErrorResponse<IdentityAttachedErrorCode>;
/** The Registry reader is server-only: it rejects with this shape, and does not declare an HTTP route/envelope. */
export type RegistryIssuedProfilesFailure={ [C in RegistryIssuedProfilesErrorCode]:Readonly<{code:C;statusCode:(typeof ISSUER_READ_ERRORS.registry)[C];message:string}> }[RegistryIssuedProfilesErrorCode];
export type IndexerIssuerHttpFailure={ [C in IndexerIssuerErrorCode]:Readonly<{statusCode:(typeof ISSUER_READ_ERRORS.indexer)[C];body:IssuerReadErrorResponse<C>}> }[IndexerIssuerErrorCode];
/** Shared Identity parser also maps transport 413/415 to IDENTITY_INPUT_INVALID; service throws retain status400. */
export type IdentityAttachedHttpFailure={ [C in IdentityAttachedErrorCode]:Readonly<{statusCode:C extends 'IDENTITY_INPUT_INVALID'?400|413|415:(typeof ISSUER_READ_ERRORS.identity)[C];body:IssuerReadErrorResponse<C>}> }[IdentityAttachedErrorCode];
export type IssuerReadConfigurationFailure={ [C in keyof typeof ISSUER_READ_ERRORS.configuration]:Readonly<{code:C;statusCode:500;message:string}> }[keyof typeof ISSUER_READ_ERRORS.configuration];
