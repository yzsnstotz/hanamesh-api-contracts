import test from 'node:test';
import assert from 'node:assert/strict';
import Ajv from 'ajv/dist/2020.js';
import {ISSUER_READ_SCHEMA as schema,ISSUER_READ_LIMITS as limits,ISSUER_READ_ORDER as order,ISSUER_READ_ERRORS as errors} from '@hanamesh/api-contracts/issuer/read';
import published from '@hanamesh/api-contracts/issuer/read/schema.json' with {type:'json'};
const ajv=new Ajv({strict:true});ajv.addSchema(schema);
const validate=name=>ajv.compile({$ref:schema.$id+'#/$defs/'+name});
const address='0x'+'1'.repeat(40),hash='0x'+'2'.repeat(64);
const asset={address,name:'Token',symbol:'TOK',decimals:18};
const profile={hanaKey:hash,hanaId:null,displayName:null,status:'not-found'};
const snapshot={protocol:'release-quote-v2',chainId:97,mode:'test-only',evidence:'READ_ONLY_RPC',sourceCommit:'commit',sourceRef:'chain:canonical',blockNumber:'100',blockHash:hash,blockTimestamp:'1795000000',confirmations:2,requiredConfirmations:1,launcher:address,fromBlock:'1'};
const item={hanaKey:hash,requestId:hash,issuer:address,token:asset,bond:address,pool:address,quote:asset,launchFeeWei:'50000000000000000',issuedAt:'2026-11-20T00:00:00.000Z',issuedTimestamp:'1795132800',transactionHash:hash,eventId:'1:0:0',blockNumber:'1',blockHash:hash,phase:'bond',sold:'0',sales:'650000000000000000000000000',earlyReleaseAllowed:true,releaseStartedAt:null,releaseStartSource:null,migratedAt:null,profile};
const page={schema:'hanamesh-own-issued-tokens-v1',deploymentId:'fixture-deployment',snapshot,order,limit:20,maxLimit:50,items:[item],nextCursor:null,totalIssued:1};

test('published contract distinguishes exact totals, confirmed empty and exact integer money',()=>{
 assert.deepEqual(published,schema);assert.equal(Object.isFrozen(limits),true);assert.equal(limits.pageMax,50);
 const v=validate('page');assert.equal(v(page),true,JSON.stringify(v.errors));
 assert.equal(v({...page,items:[]}),true);assert.equal(v({...page,rewards:{status:'available',amount:'0'}}),false);
 for(const key of ['launchFeeWei','sold','sales'])for(const value of [0,-1,'-1','1.1','01','9'.repeat(79)])assert.equal(v({...page,items:[{...item,[key]:value}]}),false,key+':'+value);
});
test('limits reject overlong pages, cursors, addresses, metadata and undeclared identity input',()=>{
 const v=validate('page');for(const limit of [0,51,1.5,'20'])assert.equal(v({...page,limit}),false);
 assert.equal(v({...page,items:Array(51).fill(item)}),false);assert.equal(v({...page,nextCursor:'x'.repeat(2049)}),false);
 assert.equal(v({...page,principalId:'foreign'}),false);assert.equal(v({...page,items:[{...item,principalId:'private'}]}),false);
 assert.equal(v({...page,items:[{...item,token:{...asset,symbol:'x'.repeat(257)}}]}),false);
 assert.equal(v({...page,items:[{...item,issuer:'0x'+'A'.repeat(40)}]}),false);
 assert.equal(v({...page,total:page.items.length}),false,'page length cannot masquerade as an exact total');
});
test('release and migration are independent facts and unavailable source is not forged zero',()=>{
 const v=validate('item');assert.equal(v({...item,phase:'migrated',releaseStartedAt:'1795132800',releaseStartSource:'early-release',migratedAt:'1795132900'}),true);
 assert.equal(v({...item,phase:'inactive'}),true);assert.equal(v({...item,releaseStartedAt:0}),false);assert.equal(v({...item,phase:'unknown'}),false);
});
test('current wallet response is finite, unique, proof-free and may be empty',()=>{
 const v=validate('attachedAddresses'),p={schema:'hanamesh-own-attached-addresses-v1',namespace:'eip155',version:0,maxWallets:10,addresses:[]};
 assert.equal(v(p),true);assert.equal(v({...p,addresses:[address]}),true);assert.equal(v({...p,addresses:[address,address]}),false);
 assert.equal(v({...p,addresses:Array.from({length:11},(_,i)=>'0x'+(i+1).toString(16).padStart(40,'0'))}),false);
 assert.equal(v({...p,proofs:[]}),false);assert.equal(v({...p,principalId:'private'}),false);
});
test('profile batch has a fixed maximum and explicit missing mappings',()=>{
 const v=validate('profiles'),p={schema:'hanamesh-issued-hana-profiles-v1',deploymentId:'fixture-deployment',maxKeys:50,items:[profile]};
 assert.equal(v(p),true);assert.equal(v({...p,items:Array(51).fill(profile)}),false);
 assert.equal(v({...p,items:[{...profile,ownerPrincipalId:'private'}]}),false);
});

const expectedErrors = {
  "indexer": {
    "AUTH_REQUIRED": 401,
    "AUTH_FORBIDDEN": 403,
    "INDEXER_ISSUER_INPUT_INVALID": 400,
    "INDEXER_ISSUER_CURSOR_INVALID": 400,
    "INDEXER_ISSUER_CURSOR_FORBIDDEN": 403,
    "INDEXER_ISSUER_WALLETS_CHANGED": 409,
    "INDEXER_ISSUER_ORIGIN_REJECTED": 403,
    "INDEXER_MARKET_HEAD_CHANGED": 409,
    "INDEXER_ISSUED_NOT_READY": 409,
    "INDEXER_ISSUED_SOURCE_REQUIRED": 503,
    "INDEXER_ISSUED_SOURCE_INVALID": 503,
    "INDEXER_ISSUER_SOURCE_INVALID": 503,
    "INDEXER_ISSUER_SOURCE_UNAVAILABLE": 503,
    "INDEXER_ISSUER_RESPONSE_TOO_LARGE": 503
  },
  "identity": {
    "AUTH_REQUIRED": 401,
    "AUTH_FORBIDDEN": 403,
    "IDENTITY_INPUT_INVALID": 400,
    "AUTH_UNAVAILABLE": 503,
    "IDENTITY_NOT_READY": 503
  },
  "registry": {
    "REGISTRY_INPUT_INVALID": 400,
    "REGISTRY_UNAVAILABLE": 503
  },
  "configuration": {
    "INDEXER_ISSUER_CONFIG_INVALID": 500,
    "INDEXER_ISSUED_CONFIG_INVALID": 500,
    "REGISTRY_CONFIG_INVALID": 500
  }
};
test('native endpoint code and status catalogue is complete and deeply immutable',()=>{
 assert.deepEqual(errors,expectedErrors);assert(Object.isFrozen(errors));
 for(const group of Object.values(errors))assert(Object.isFrozen(group));
 assert(!Object.values(errors).some(group=>'ISSUER_REWARDS_BOUNDED_SOURCE_REQUIRED' in group));
});
for(const [group,codes] of Object.entries(expectedErrors))for(const [code,statusCode] of Object.entries(codes))test(`${group}: ${code} preserves its actual failure shape and status`,()=>{
 const body={error:{code,message:code}};
 if(group==='indexer'||group==='identity'){
  const prefix=group==='indexer'?'indexer':'attachedAddresses';
  assert.equal(validate(prefix+'Error')(body),true);
  const v=validate(prefix+'HttpFailure');assert.equal(v({statusCode,body}),true,JSON.stringify(v.errors));
  assert.equal(v({statusCode:statusCode===400?401:400,body}),false);
 }else{
  const v=validate(group==='registry'?'profilesFailure':'configurationFailure');
  assert.equal(v({code,statusCode,message:code}),true,JSON.stringify(v.errors));
  assert.equal(v({code,statusCode:200,message:code}),false);
 }
});
test('failure schemas reject unknown codes, private details, false success, and wrong provider envelopes',()=>{
 for(const name of ['indexerError','attachedAddressesError']){
  const v=validate(name);assert.equal(v({error:{code:'SECRET_SQL_FAILURE',message:'arbitrary'}}),false);
  assert.equal(v({error:{code:'AUTH_REQUIRED',message:'login',cause:'private'}}),false);
  assert.equal(v({error:{code:'AUTH_REQUIRED',message:'login'},principalId:'private'}),false);
  assert.equal(v({error:{code:'AUTH_REQUIRED',message:''}}),false);
 }
 assert.equal(validate('indexerError')({error:{code:'REGISTRY_UNAVAILABLE',message:'upstream'}}),false);
 assert.equal(validate('profilesFailure')({error:{code:'REGISTRY_UNAVAILABLE',message:'wrong envelope'}}),false);
 assert.equal(validate('page')({error:{code:'AUTH_REQUIRED',message:'login'}}),false);
 assert.equal(validate('indexerError')({error:{code:'ISSUER_REWARDS_BOUNDED_SOURCE_REQUIRED',message:'success-only'}}),false);
});
test('Identity shared HTTP parser 413 and415 retain IDENTITY_INPUT_INVALID, not invented business codes',()=>{
 const v=validate('attachedAddressesHttpFailure');
 for(const statusCode of [400,413,415])assert.equal(v({statusCode,body:{error:{code:'IDENTITY_INPUT_INVALID',message:'Invalid identity request.'}}}),true);
 assert.equal(v({statusCode:413,body:{error:{code:'AUTH_UNAVAILABLE',message:'no'}}}),false);
});

test('totalIssued is a required exact integer count; old pending success is rejected',()=>{
 const v=validate('page');for(const n of [-1,1.5,'1',9007199254740992,null])assert.equal(v({...page,totalIssued:n}),false);
 const {totalIssued,...missing}=page;assert.equal(v(missing),false);assert.equal(v({...missing,rewards:{status:'source-required',code:'ISSUER_REWARDS_BOUNDED_SOURCE_REQUIRED'}}),false);
 assert.equal(v({...page,items:[],totalIssued:0}),true);
});
