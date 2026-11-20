import type {Locale,LocalizedText} from '@hanamesh/api-contracts/catalog/localized';
import {LOCALES,DOES_LIMITS,DOES_LIMITS_VERSION,LOCALIZED_SCHEMA_VERSION,LOCALIZED_FALLBACK_LOCALE} from '@hanamesh/api-contracts/catalog/localized';
import type {DiscoveryOverview,DiscoveryReason,DiscoveryFacet} from '@hanamesh/api-contracts/catalog/discovery';
const all:LocalizedText={byLocale:{zh:'文',en:'English',ja:'日','pt-BR':'Texto',es:'Texto',ko:'문',vi:'Chữ',id:'Teks',ru:'Текст'}};
const sparse:LocalizedText={byLocale:{ru:'Текст'}};
const tags:readonly Locale[]=LOCALES;
const caps:Readonly<Record<Locale,number>>=DOES_LIMITS;
const frozenVi:90=DOES_LIMITS.vi;
const versions:readonly ['localized-v2','does-limits-v2','en']=[LOCALIZED_SCHEMA_VERSION,DOES_LIMITS_VERSION,LOCALIZED_FALLBACK_LOCALE];
// @ts-expect-error map must contain at least one real translation
const empty:LocalizedText={byLocale:{}};
// @ts-expect-error removed top-level three-key shape
const old:LocalizedText={zh:'文',en:'English',ja:'日'};
// @ts-expect-error unknown locale
const unknown:Locale='fr';
// @ts-expect-error only canonical pt-BR
const wrongCase:Locale='pt-br';
// @ts-expect-error extra locale in a literal
const extra:LocalizedText={byLocale:{en:'English',fr:'Non'}};
// @ts-expect-error null translations are not strings
const nullEntry:LocalizedText={byLocale:{en:null}};
// @ts-expect-error explicit undefined is not a real translation
const undefinedEntry:LocalizedText={byLocale:{en:undefined}};
// @ts-expect-error removed declaration; no old-type alias retained
import type {DiscoveryLocalizedText} from '@hanamesh/api-contracts/catalog/discovery';
const overview:DiscoveryOverview={does:sparse,facts:{audience:{value:all,evidence:[]},difficultyReason:{value:null,evidence:[]}},evidence:[]};
// @ts-expect-error typed audience cannot accept legacy string value
const badAudience:DiscoveryOverview={does:null,facts:{audience:{value:'old',evidence:[]}},evidence:[]};
const reason:DiscoveryReason={text:all,evidence:[]};
const facet:DiscoveryFacet={id:'tools',name:sparse,count:1,capped:false};
// @ts-expect-error facet name is localized
const badFacet:DiscoveryFacet={id:'tools',name:'old',count:1,capped:false};
void [all,sparse,tags,caps,frozenVi,versions,empty,old,unknown,wrongCase,extra,nullEntry,undefinedEntry,overview,badAudience,reason,facet,badFacet];
