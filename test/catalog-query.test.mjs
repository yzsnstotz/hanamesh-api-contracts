import test from 'node:test';
import assert from 'node:assert/strict';
import Ajv from 'ajv/dist/2020.js';
import {CATALOG_QUERY_SCHEMA as schema,CATALOG_QUERY_SORTS,isCatalogQueryTextWithinBounds} from '@hanamesh/api-contracts/catalog/query';
const ajv=new Ajv({strict:true});ajv.addSchema(schema);
const check=name=>ajv.compile({$ref:schema.$id+'#/$defs/'+name});
const base={sort:'relevance',searchMode:'keyword',includeInsufficient:true,limit:20};
test('U1 query contract accepts all seven sorts, three modes and all common dimensions together',()=>{
 const query=check('query');
 for(const sort of CATALOG_QUERY_SORTS)for(const searchMode of ['keyword','hybrid','names'])assert.equal(query({...base,sort,searchMode,q:'git',official:true,categories:['git','office'],source:'awesome',claim:'claimed',repo:'owner/repo',channel:'claude',domain:'code',subdivision:'development',installable:true}),true,JSON.stringify(query.errors));
 for(const invalid of [{...base,sort:'unknown'},{...base,official:false},{...base,limit:201},{...base,unknown:true},{...base,searchMode:'semantic'},{...base,categories:['git','  ']}])assert.equal(query(invalid),false);
});
test('U1 pages require rank, cap flags, complete facet dimensions and an opaque nullable cursor',()=>{
 const page=check('page'),value={items:[],total:0,capped:false,hiddenInsufficientCount:0,hiddenInsufficientCountCapped:false,facets:{all:0,categories:[],sources:[],channels:[],domains:[],subdivisions:[]},nextCursor:null,snapshot:'snapshot',policyVersion:2,searchMode:'keyword',indexReady:true,directoryReady:true,rankingReady:true,rankingVersion:'12'};
 assert.equal(page(value),true,JSON.stringify(page.errors));
 const {all,...otherFacets}=value.facets;
 assert.equal(page({...value,facets:otherFacets}),false,'All is required');
 assert.equal(page({...value,facets:{...otherFacets,all:101}}),true,'a filtered empty page can have a nonzero All count');
 for(const invalidAll of [null,'3',-1,2.5,Number.MAX_SAFE_INTEGER+1]){
  assert.equal(page({...value,facets:{...otherFacets,all:invalidAll}}),false,String(invalidAll));
 }
 for(const key of Object.keys(value)){const v={...value};delete v[key];assert.equal(page(v),false,key);}
 const item={hanaId:'00000000-0000-4000-8000-000000000001',rank:1,tier:3,matchKind:'name',authority:100,authorityVersion:'fixture',stars:null,npmDownloads30d:0,updatedAt:'2026-11-21T00:00:00Z'};
 assert.equal(page({...value,items:[item],total:1}),true);
 const {rank,...missingRank}=item;assert.equal(page({...value,items:[missingRank]}),false);
 assert.equal(page({...value,searchId:'cached-personal-id'}),false);
 assert.equal(check('loggedPage')({page:value,searchId:'one-new-search',semanticNotice:null}),true);
});

test('U1 hybrid input is a separate bounded ordered canonical-ID queue',()=>{
 const candidates=check('semanticCandidates'),id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
 assert.equal(candidates({semanticHanaIds:Array.from({length:50},(_,n)=>id(n+1))}),true);
 assert.equal(candidates({semanticHanaIds:Array.from({length:51},(_,n)=>id(n+1))}),false);
 assert.equal(candidates({semanticHanaIds:[id(1),id(1)]}),false);
 assert.equal(candidates({semanticHanaIds:['not-an-id']}),false);
 assert.equal(check('query')({...base,semanticHanaIds:[id(1)]}),false,'internal provider candidates never become a user query override');
});

test('existing cursor bound and Semantic notices/match labels are the only public variants',()=>{
 const query=check('query');assert.equal(query({...base,after:'A'.repeat(4096)}),true);assert.equal(query({...base,after:'A'.repeat(4097)}),false);
 const page={items:[],total:0,capped:false,hiddenInsufficientCount:0,hiddenInsufficientCountCapped:false,facets:{all:0,categories:[],sources:[],channels:[],domains:[],subdivisions:[]},nextCursor:null,snapshot:'fixture',policyVersion:2,searchMode:'keyword',indexReady:true,directoryReady:true,rankingReady:false,rankingVersion:null};
 const logged=check('loggedPage');for(const semanticNotice of [null,'SEMANTIC_FREE_QUOTA_EXHAUSTED','SEMANTIC_UNAVAILABLE'])assert.equal(logged({page,searchId:null,semanticNotice}),true);assert.equal(logged({page,searchId:null,semanticNotice:'invented-notice'}),false);
 const item={hanaId:'00000000-0000-4000-8000-000000000001',rank:1,tier:1,authority:0,authorityVersion:null,stars:null,npmDownloads30d:null,updatedAt:'2026-11-21T00:00:00Z'};
 assert.equal(check('item')(item),true);for(const matchKind of ['name','meaning'])assert.equal(check('item')({...item,matchKind}),true);for(const matchKind of ['text','browse'])assert.equal(check('item')({...item,matchKind}),false);
});


test('names suggestions retain the provider rank for existing search logs',()=>{
 const names=check('names'),item={hanaId:'00000000-0000-4000-8000-000000000001',name:'Fixture',rank:21};
 assert.equal(names({items:[item],nextCursor:null}),true);
 for(const rank of [0,-1,'21',undefined]){const invalid={...item,rank};if(rank===undefined)delete invalid.rank;assert.equal(names({items:[invalid],nextCursor:null}),false);}
});

test('U1 repoOwner is a bounded multi-login selector for personal accounts and admin organizations',()=>{
 const query=check('query');
 for(const repoOwner of [['Owner'],['OWNER','org-a','Managed_CODE'],Array.from({length:20},(_,n)=>'owner-'+n)])assert.equal(query({...base,repoOwner}),true,JSON.stringify(query.errors));
 for(const repoOwner of [[],Array(21).fill('owner'),'owner',[null],[''],['owner/repo'],['https://github.com/owner'],['a'.repeat(40)],['org name'],['全角'],['x%']])assert.equal(query({...base,repoOwner}),false,JSON.stringify(repoOwner));
});

test('query schema enforces provider required fields, nonblank input and cursor alphabet',()=>{
 const query=check('query');
 for(const input of [
  {...base,searchMode:'hybrid'}, {...base,searchMode:'names'}, {...base,q:' \t\n '},
  {...base,subdivision:'development'}, {...base,after:'A+/='}, {...base,after:''},
  {...base,categories:[' ']}, {...base,source:'\t'}, {...base,repo:' '},
 ])assert.equal(query(input),false,JSON.stringify(input));
 assert.equal(query({...base,categories:['git','git'],after:'Aa_9-'}),true,JSON.stringify(query.errors));
});

test('catalog text counts raw UTF-8 bytes and distinct normalized terms',()=>{
 assert.equal(isCatalogQueryTextWithinBounds('界'.repeat(170)+'ab'),true);
 assert.equal(isCatalogQueryTextWithinBounds('界'.repeat(171)),false);
 assert.equal(isCatalogQueryTextWithinBounds('😀'.repeat(128)),true);
 assert.equal(isCatalogQueryTextWithinBounds('😀'.repeat(128)+' '),false);
 const terms=n=>Array.from({length:n},(_,i)=>'term'+i).join(' ');
 assert.equal(isCatalogQueryTextWithinBounds(terms(32)+' ＴＥＲＭ０'),true);
 assert.equal(isCatalogQueryTextWithinBounds(terms(33)),false);
 assert.equal(isCatalogQueryTextWithinBounds('x '.repeat(33)),true);
 assert.equal(isCatalogQueryTextWithinBounds('  \t '),false);
});

test('exact-ID detail signals keep real zero, optional repository scope and the reason for every unknown',()=>{
 const checkSignals=check('detailSignals');
 const signal={stars:7,repositoryStars:123,npmDownloads30d:28,storeInstalls30d:0,checkedAt:'2026-11-27T07:20:00.123Z'};
 assert.equal(checkSignals(signal),true,JSON.stringify(checkSignals.errors));
 const {repositoryStars,...item}=signal;
 assert.equal(checkSignals(item),true);
 const unknown={stars:null,repositoryStars:123,npmDownloads30d:null,storeInstalls30d:null,checkedAt:null,
  unknownReasons:{stars:'not_applicable',npmDownloads30d:'not_observed',storeInstalls30d:'history_unavailable',checkedAt:'not_observed'}};
 assert.equal(checkSignals(unknown),true,JSON.stringify(checkSignals.errors));
 assert.equal(checkSignals({...signal,repositoryStars:null,unknownReasons:{repositoryStars:'source_unavailable'}}),true);
 for(const field of ['stars','npmDownloads30d','storeInstalls30d','checkedAt']){
  const {unknownReasons,...metrics}=unknown;
  const incomplete={...unknownReasons};delete incomplete[field];
  assert.equal(checkSignals({...metrics,unknownReasons:incomplete}),false,field);
 }
 for(const invalid of [
  {...signal,checkedAt:'updated just now'}, {...signal,stars:-1}, {...signal,npmDownloads30d:1.25},
  {...signal,repositoryStars:null}, {...signal,unknownReasons:{storeInstalls30d:'source_unavailable'}},
  {...item,unknownReasons:{repositoryStars:'source_unavailable'}}, {...unknown,unknownReasons:{...unknown.unknownReasons,checkedAt:'other'}},
 ]) assert.equal(checkSignals(invalid),false,JSON.stringify(invalid));
});
