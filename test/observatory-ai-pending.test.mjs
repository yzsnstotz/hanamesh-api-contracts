import test from 'node:test';
import assert from 'node:assert/strict';
import Ajv from 'ajv';
import {OBSERVATORY_SCHEMA,OBSERVATORY_CONTRIBUTION_SCHEMA} from '@hanamesh/api-contracts/ops/observatory';
const source={module:'ai',port:'readPendingCount',definition:'All persisted pending reviews, across all UTC months; PostgreSQL statement snapshot.',asOf:'2026-11-19T00:00:00.000Z'};
const metric=count=>({id:'hl.ai',source,availability:'available',value:{pendingCount:count}});
const contribution=m=>({module:'ai',income:[],spending:[],people:[],health:[m],parameters:[]});
const response=m=>{const {module:_,...sections}=contribution(m);return {schemaVersion:1,timezone:'UTC',generatedAt:source.asOf,...sections};};
const validators=[new Ajv({strict:true}).compile(OBSERVATORY_SCHEMA),new Ajv({strict:true}).compile(OBSERVATORY_CONTRIBUTION_SCHEMA)];
function check(m,expected){for(const [n,validate] of validators.entries()){const v=n?contribution(m):response(m);assert.equal(validate(v),expected,JSON.stringify(validate.errors));}}

test('R429-F1 hl.ai preserves the AI global count, availability and source in both public schemas',()=>{
 for(const n of [0,2,1234])check(metric(n),true);
});
test('R429-F1 unknown or owner-forbidden is pending without a count; actual zero remains available',()=>{
 const pending={id:'hl.ai',source:{...source,asOf:null},availability:'pending',reason:'AI_OWNER_REQUIRED'};
 check(pending,true);check(metric(0),true);check({...pending,value:{pendingCount:0}},false);
});
test('R429-F1 rejects page/failure/text substitutions, invalid counts and manual AI approval facts',()=>{
 for(const count of [-1,0.5,'2',null,9007199254740992])check(metric(count),false);
 for(const value of [{},{failures:2},{reason:'2 pending'},{pendingCount:2,reviews:[]},{pendingCount:2,pageCount:2}])check({...metric(2),value},false);
 check({...metric(2),availability:'manual'},false);
 check({...metric(2),source:{...source,module:'host'}},false);
 check({...metric(2),source:{...source,port:'listReviews'}},false);
 // Reserved design id cannot fall through to the older generic health structure.
 check({...metric(2),value:{status:'unknown',lastSuccessAt:null,failures:2,failureWindow:null,paused:null,reason:null,attention:'unknown'}},false);
});
test('R429-F1 keeps open extension health IDs and the existing job/health contract',()=>{
 check({id:'extension.worker',source:{...source,module:'extension',port:'readHealth'},availability:'available',value:{status:'unknown',lastSuccessAt:null,failures:null,failureWindow:null,paused:null,reason:null,attention:'unknown'}},true);
});
