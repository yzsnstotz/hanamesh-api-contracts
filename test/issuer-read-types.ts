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
