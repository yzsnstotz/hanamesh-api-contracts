import {CATALOG_QUERY_SCHEMA,CATALOG_QUERY_SORTS,type CatalogQuery,type CatalogQueryPage,type CatalogLoggedPage,type CatalogQueryNames} from '@hanamesh/api-contracts/catalog/query';
const q:CatalogQuery={q:'git',searchMode:'hybrid',sort:'relevance',official:true,categories:['git','office'],claim:'claimed',source:'awesome',channel:'claude',repo:'owner/repo',domain:'code',includeInsufficient:true,limit:20};
const page:CatalogQueryPage={items:[],total:0,capped:false,hiddenInsufficientCount:0,hiddenInsufficientCountCapped:false,facets:{categories:[],sources:[],channels:[],domains:[],subdivisions:[]},nextCursor:null,snapshot:'fixture',policyVersion:2,searchMode:'keyword',indexReady:true};
const logged:CatalogLoggedPage={page,searchId:null,semanticNotice:null};
// @ts-expect-error unified selection has no arbitrary old sort alias
const invalidSort:CatalogQuery={...q,sort:'authority'};
// @ts-expect-error a rank is part of the public per-result contract
const invalidItem:CatalogQueryPage['items'][number]={hanaId:'id',tier:1,matchKind:'meaning',authority:0,authorityVersion:null,stars:null,npmDownloads30d:null,updatedAt:'now'};
void [CATALOG_QUERY_SCHEMA,CATALOG_QUERY_SORTS,q,page,logged,invalidSort,invalidItem];

const names:CatalogQueryNames={items:[{hanaId:'id',name:'Fixture',rank:21}],nextCursor:null};
// @ts-expect-error suggestions expose the same provider rank; callers never invent it
const missingNamesRank:CatalogQueryNames={items:[{hanaId:'id',name:'Fixture'}],nextCursor:null};
void [names,missingNamesRank];
