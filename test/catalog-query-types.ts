import {CATALOG_QUERY_SCHEMA,CATALOG_QUERY_SORTS,type CatalogQuery,type CatalogQueryPage,type CatalogLoggedPage,type CatalogQueryNames} from '@hanamesh/api-contracts/catalog/query';
const q:CatalogQuery={q:'git',searchMode:'hybrid',sort:'relevance',official:true,categories:['git','office'],claim:'claimed',source:'awesome',channel:'claude',repo:'owner/repo',domain:'code',includeInsufficient:true,limit:20};
const page:CatalogQueryPage={items:[],total:0,capped:false,hiddenInsufficientCount:0,hiddenInsufficientCountCapped:false,facets:{all:0,categories:[],sources:[],channels:[],domains:[],subdivisions:[]},nextCursor:null,snapshot:'fixture',policyVersion:2,searchMode:'keyword',indexReady:true,directoryReady:true,rankingReady:false,rankingVersion:null};
const {directoryReady, ...withoutDirectoryReady}=page;
const {rankingReady, ...withoutRankingReady}=page;
const {rankingVersion, ...withoutRankingVersion}=page;
// @ts-expect-error every catalog page declares whether the directory is ready
const missingDirectoryReady:CatalogQueryPage=withoutDirectoryReady;
// @ts-expect-error every catalog page declares whether ranking is ready
const missingRankingReady:CatalogQueryPage=withoutRankingReady;
// @ts-expect-error an unknown ranking version is explicit null
const missingRankingVersion:CatalogQueryPage=withoutRankingVersion;
const logged:CatalogLoggedPage={page,searchId:null,semanticNotice:null};
// @ts-expect-error unified selection has no arbitrary old sort alias
const invalidSort:CatalogQuery={...q,sort:'authority'};
// @ts-expect-error a rank is part of the public per-result contract
const invalidItem:CatalogQueryPage['items'][number]={hanaId:'id',tier:1,matchKind:'meaning',authority:0,authorityVersion:null,stars:null,npmDownloads30d:null,updatedAt:'now'};
void [CATALOG_QUERY_SCHEMA,CATALOG_QUERY_SORTS,q,page,logged,invalidSort,invalidItem,
 directoryReady,rankingReady,rankingVersion,missingDirectoryReady,missingRankingReady,missingRankingVersion];

const names:CatalogQueryNames={items:[{hanaId:'id',name:'Fixture',rank:21}],nextCursor:null};
// @ts-expect-error suggestions expose the same provider rank; callers never invent it
const missingNamesRank:CatalogQueryNames={items:[{hanaId:'id',name:'Fixture'}],nextCursor:null};
void [names,missingNamesRank];

const ownershipScope:CatalogQuery={...q,repoOwner:['Personal','Admin-Org','Managed_CODE']};
// @ts-expect-error owner selectors are a bounded list, not a single repository/string
const scalarOwner:CatalogQuery={...q,repoOwner:'owner'};
void [ownershipScope,scalarOwner];

const detailSignals:import('@hanamesh/api-contracts/catalog/query').CatalogDetailSignals={stars:null,npmDownloads30d:100,storeInstalls30d:null,checkedAt:'2026-11-27T07:20:00Z',unknownReasons:{stars:'not_observed',storeInstalls30d:'history_unavailable'}};
void detailSignals;
