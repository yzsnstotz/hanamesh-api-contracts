import test from 'node:test';import assert from 'node:assert/strict';import Ajv from 'ajv/dist/2020.js';
import {GITHUB_NAMESPACES_SCHEMA as schema,GITHUB_NAMESPACES_PATH,GITHUB_NAMESPACES_MAX_ORGANIZATIONS} from '@hanamesh/api-contracts/identity/github-namespaces';
import published from '@hanamesh/api-contracts/identity/github-namespaces/schema.json' with {type:'json'};
const validate=new Ajv({strict:true}).compile(schema);
const org={login:'visible-org',avatarUrl:'https://avatars.githubusercontent.com/u/1'};
const value={login:'octocat',orgs:[org],checkedAt:'2026-11-21T00:00:00.000Z',truncated:false};
test('published namespaces DTO is bounded, browser safe and distinguishes unlinked from empty',()=>{
 assert.deepEqual(published,schema);assert.equal(GITHUB_NAMESPACES_PATH,'/v1/identity/me/github/namespaces');assert.equal(GITHUB_NAMESPACES_MAX_ORGANIZATIONS,1000);
 for(const v of [value,{...value,orgs:[]},{...value,login:null,orgs:[]},{...value,truncated:true},{...value,orgs:Array(1000).fill(org)}])assert.equal(validate(v),true,JSON.stringify(validate.errors));
 for(const v of [{...value,orgs:Array(1001).fill(org)},{...value,login:null},{...value,login:null,orgs:[],truncated:true},{...value,login:''},{...value,login:'x'.repeat(101)},{...value,checkedAt:'yesterday'},{...value,truncated:1},{...value,orgs:[{...org,avatarUrl:'http://unsafe.test/a'}]},{...value,orgs:[{...org,avatarUrl:'https://'+'x'.repeat(2048)}]}])assert.equal(validate(v),false);
});
test('no credentials, principal IDs, authorization status or unknown placeholder can enter the DTO',()=>{
 for(const key of ['token','accessToken','principalId','authorized','appAuthorization']){
  assert.equal(validate({...value,[key]:'unknown'}),false,key);
  assert.equal(validate({...value,orgs:[{...org,[key]:'unknown'}]}),false,key);
 }
 for(const key of ['login','orgs','checkedAt','truncated']){const v={...value};delete v[key];assert.equal(validate(v),false,key);}
});
