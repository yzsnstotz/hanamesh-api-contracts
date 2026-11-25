import type {OwnAttachedAddresses,IssuedHanaProfilesQuery,IssuedHanaProfiles,OwnIssuedTokensQuery,OwnIssuedTokensPage} from '@hanamesh/api-contracts/issuer/read';
import {ISSUER_READ_LIMITS,ISSUER_READ_ORDER} from '@hanamesh/api-contracts/issuer/read';
const q:OwnIssuedTokensQuery={deploymentId:'fixture',limit:50};
// @ts-expect-error The caller cannot select a principal for a self resource.
const foreign:OwnIssuedTokensQuery={deploymentId:'fixture',principalId:'other'};
const profiles:IssuedHanaProfilesQuery={deploymentId:'fixture',hanaKeys:[]};
const wallets:OwnAttachedAddresses={schema:'hanamesh-own-attached-addresses-v1',namespace:'eip155',version:1,maxWallets:10,addresses:[]};
const result:IssuedHanaProfiles={schema:'hanamesh-issued-hana-profiles-v1',deploymentId:'fixture',maxKeys:50,items:[]};
const bounded:50=ISSUER_READ_LIMITS.pageMax;const order:OwnIssuedTokensPage['order']=ISSUER_READ_ORDER;
void [q,foreign,profiles,wallets,result,bounded,order];

import type {IndexerIssuerHttpFailure,IdentityAttachedHttpFailure,RegistryIssuedProfilesFailure,IssuerReadConfigurationFailure} from '@hanamesh/api-contracts/issuer/read';
import {ISSUER_READ_ERRORS} from '@hanamesh/api-contracts/issuer/read';
const authFailure:IndexerIssuerHttpFailure={statusCode:401,body:{error:{code:'AUTH_REQUIRED',message:'AUTH_REQUIRED'}}};
const cursorFailure:IndexerIssuerHttpFailure={statusCode:409,body:{error:{code:'INDEXER_MARKET_HEAD_CHANGED',message:'INDEXER_MARKET_HEAD_CHANGED'}}};
const parserFailure:IdentityAttachedHttpFailure={statusCode:413,body:{error:{code:'IDENTITY_INPUT_INVALID',message:'Invalid identity request.'}}};
const registryFailure:RegistryIssuedProfilesFailure={statusCode:503,code:'REGISTRY_UNAVAILABLE',message:'Registry dependency is unavailable'};
const configFailure:IssuerReadConfigurationFailure={statusCode:500,code:'INDEXER_ISSUER_CONFIG_INVALID',message:'INDEXER_ISSUER_CONFIG_INVALID'};
const sourceStatus:503=ISSUER_READ_ERRORS.indexer.INDEXER_ISSUER_SOURCE_UNAVAILABLE;
// @ts-expect-error Actual code and HTTP status must agree.
const wrongStatus:IndexerIssuerHttpFailure={statusCode:400,body:{error:{code:'AUTH_REQUIRED',message:'login'}}};
// @ts-expect-error Registry errors are normalized by the Indexer, not directly exposed from its route.
const leakedProvider:IndexerIssuerHttpFailure={statusCode:503,body:{error:{code:'REGISTRY_UNAVAILABLE',message:'no'}}};
// @ts-expect-error The server-only Registry port throws fields, not an invented HTTP envelope.
const fakeRegistryEnvelope:RegistryIssuedProfilesFailure={error:{code:'REGISTRY_UNAVAILABLE',message:'no'}};
// @ts-expect-error Removed pending placeholder is neither a success field nor a resource error.
const rewardFailure:IndexerIssuerHttpFailure={statusCode:503,body:{error:{code:'ISSUER_REWARDS_BOUNDED_SOURCE_REQUIRED',message:'no'}}};
void [authFailure,cursorFailure,parserFailure,registryFailure,configFailure,sourceStatus,wrongStatus,leakedProvider,fakeRegistryEnvelope,rewardFailure];
