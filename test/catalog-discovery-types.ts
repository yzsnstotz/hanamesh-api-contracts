import type {DiscoveryPage,DiscoveryListFields,DiscoveryDetailFields} from '@hanamesh/api-contracts/catalog/discovery';
import {DISCOVERY_SCHEMA,DISCOVERY_RULES_VERSION} from '@hanamesh/api-contracts/catalog/discovery';
const schema:object=DISCOVERY_SCHEMA;
const version:'hanamesh-initial-v1'=DISCOVERY_RULES_VERSION;
declare const page:DiscoveryPage<{hanaId:string;displayName:string}>;
const display:string=page.items[0]!.displayName;
declare const list:DiscoveryListFields;
// @ts-expect-error detail-only reasons may not be consumed on a list card
list.reasons;
declare const detail:DiscoveryDetailFields;
const reason:string|undefined=detail.reasons[0]?.text.byLocale.zh;
void [schema,version,display,reason];
