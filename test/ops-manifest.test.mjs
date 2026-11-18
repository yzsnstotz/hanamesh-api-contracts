import test from 'node:test';
import assert from 'node:assert/strict';
import Ajv from 'ajv';
import {OPS_MANIFEST_SCHEMA} from '@hanamesh/api-contracts/host/ops-manifest';
const validate=new Ajv({strict:true}).compile(OPS_MANIFEST_SCHEMA);
test('ops manifest describes only bounded exact ops GET paths, with no business list',()=>{
 for(const paths of [[],['/ops/ai','/ops/ai/page.js'],['/ops/new/provider/file.js']])assert.equal(validate({schemaVersion:1,paths}),true);
 for(const paths of [['/v1/private'],['/ops/:id'],['/ops/*'],['/ops/a?x'],['/ops/a/../b'],['/ops/a%2fb'],['/ops/a/'],['https://evil.example/ops/a'],['/ops/a','/ops/a'],Array.from({length:513},(_,i)=>'/ops/a'+i),['/ops/'+ 'a'.repeat(257)]])assert.equal(validate({schemaVersion:1,paths}),false,JSON.stringify(paths));
 for(const value of [{paths:[]},{schemaVersion:2,paths:[]},{schemaVersion:1,paths:[],secret:'no'},{schemaVersion:1,paths:[null]}])assert.equal(validate(value),false);
});
