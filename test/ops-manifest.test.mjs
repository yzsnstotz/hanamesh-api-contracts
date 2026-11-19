import test from 'node:test';
import assert from 'node:assert/strict';
import Ajv from 'ajv';
import {OPS_MANIFEST_SCHEMA, OPS_PAGE_CONTRIBUTION_SCHEMA} from '@hanamesh/api-contracts/host/ops-manifest';
const ajv = new Ajv({strict:true});
const validate = ajv.compile(OPS_MANIFEST_SCHEMA);
const validatePage = ajv.compile(OPS_PAGE_CONTRIBUTION_SCHEMA);
const page = () => ({
 id:'provider.dashboard', moduleId:'provider', href:'/ops/provider-ui', kind:'page',
 titleKey:'ops.provider.title', descriptionKey:'ops.provider.description',
 group:{id:'provider.operations',labelKey:'ops.provider.group',order:30},
 order:10, permission:{policyId:'provider.ops.read'}
});
const manifest = (paths=[],pages=[]) => ({schemaVersion:2,paths,pages});

test('ops manifest retains bounded exact GET allowlist paths, separate from declared pages',()=>{
 for(const paths of [[],['/ops/ai','/ops/ai/page.js'],['/ops/new/provider/file.js']])assert.equal(validate(manifest(paths)),true);
 for(const paths of [['/v1/private'],['/ops/:id'],['/ops/*'],['/ops/a?x'],['/ops/a/../b'],['/ops/a%2fb'],['/ops/a/'],['https://evil.example/ops/a'],['/ops/a','/ops/a'],Array.from({length:513},(_,i)=>'/ops/a'+i),['/ops/'+ 'a'.repeat(257)]])assert.equal(validate(manifest(paths)),false,JSON.stringify(paths));
 for(const value of [{paths:[],pages:[]},{schemaVersion:1,paths:[]},{schemaVersion:1,paths:[],pages:[]},{schemaVersion:2,paths:[]},{schemaVersion:2,pages:[]},{...manifest(),secret:'no'},{...manifest(),paths:[null]}])assert.equal(validate(value),false);
});

test('modules declare their own group, group order, page order and permission policy reference',()=>{
 assert.equal(validatePage(page()),true);
 assert.equal(validate(manifest(['/ops/provider-ui','/ops/provider-ui/page.js'],[page()])),true);
 const custom=page(); custom.moduleId='another-provider';custom.group.id='new-group';custom.permission.policyId='another-provider.admin-and-owner';custom.order=-1;
 assert.equal(validatePage(custom),true,'no Host module, group or policy-name whitelist');
});

test('group, order and permission and their nested fields are required without defaults',()=>{
 for(const key of ['id','moduleId','href','kind','titleKey','descriptionKey','group','order','permission']){
  const value=page();delete value[key];assert.equal(validatePage(value),false,key);
 }
 for(const key of ['id','labelKey','order']){
  const value=page();delete value.group[key];assert.equal(validatePage(value),false,'group.'+key);
 }
 const value=page();delete value.permission.policyId;assert.equal(validatePage(value),false);
 for(const bad of [null,'operations',[],{}]){const value=page();value.group=bad;assert.equal(validatePage(value),false);}
 for(const bad of [null,'admin',[],{admin:true},{policyId:''}]){const value=page();value.permission=bad;assert.equal(validatePage(value),false);}
});

test('page declarations reject wildcard paths, resources masquerading as pages, extra grants and unsafe ordering values',()=>{
 for(const href of ['/v1/data','/hm/ops/provider-ui','/ops/:id','/ops/*','/ops/a/../b','/ops/a%2fb','/ops/a?x','/ops/a/','https://evil.example/ops/a']){const value=page();value.href=href;assert.equal(validatePage(value),false,href);}
 for(const key of ['order','groupOrder'])for(const bad of [1.5,'10',null,9007199254740992]){const value=page();if(key==='order')value.order=bad;else value.group.order=bad;assert.equal(validatePage(value),false,key+':'+bad);}
 const resource=page();resource.kind='resource';assert.equal(validatePage(resource),false);
 const grants=page();grants.permission.canManage=true;assert.equal(validatePage(grants),false,'metadata is not an authorization grant');
 const secret=page();secret.secret='no';assert.equal(validatePage(secret),false);
 const inferred=page();inferred.group.label='Inferred Host group';assert.equal(validatePage(inferred),false);
});

test('page metadata and arrays are bounded, including the empty installation case',()=>{
 assert.equal(validate(manifest()),true);
 assert.equal(validate(manifest([],Array.from({length:513},(_,i)=>({...page(),id:'page.'+i,href:'/ops/page-'+i})))),false);
 assert.equal(validate(manifest([], [page(),page()])),false,'exact duplicate contributions are invalid');
 for(const key of ['id','moduleId','titleKey','descriptionKey'])for(const bad of ['', 'x'.repeat(257)]){const value=page();value[key]=bad;assert.equal(validatePage(value),false,key);}
});
