import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import Ajv from 'ajv/dist/2020.js';
const file=new URL('../contracts/catalog/discovery/schema.json',import.meta.url);
function schema(){assert.equal(existsSync(file),true,'public discovery schema is shipped');return JSON.parse(readFileSync(file,'utf8'));}
const sparse={domainIds:[],subdivisions:[],taxonomyVersion:'hanamesh-discovery-taxonomy-v1',overview:null,score:{status:'insufficient',total:null,scale:100,displayTotal:null,displayScale:10,dimensions:{quality:null,popularity:null,maintenance:null},coverage:0,missing:[],evidence:[],rulesVersion:'hanamesh-initial-v1',assessedAt:'2026-11-19T00:00:00.000Z'},trustBadges:[],featured:[],similarGroup:null};
function validate(name,value){const ajv=new Ajv({strict:true});ajv.addSchema(schema(),'discovery');return ajv.compile({$ref:'discovery#/$defs/'+name})(value);}
test('list, search and detail share one discovery DTO; reasons are detail only',()=>{
 assert.equal(validate('listFields',sparse),true);assert.equal(validate('listFields',{...sparse,reasons:[]}),false);
 assert.equal(validate('detailFields',{...sparse,reasons:[]}),true);
 assert.equal(validate('page',{items:[{hanaId:'00000000-0000-4000-8000-000000000001',...sparse}],next:null,total:1,hiddenInsufficientCount:1,domains:[],subdivisions:[],phase:'early'}),true);
});
test('unknown score is null, never zero; a scored result requires an actual total',()=>{
 assert.equal(validate('listFields',{...sparse,score:{...sparse.score,total:0}}),false);
 assert.equal(validate('listFields',{...sparse,score:{...sparse.score,status:'scored'}}),false);
});
test('overview enforces Unicode code point limits 28/70/35 without truncation',()=>{
 const overview={does:{zh:'文'.repeat(28),en:'a'.repeat(70),ja:'字'.repeat(35)},facts:{},evidence:[]};
 assert.equal(validate('listFields',{...sparse,overview}),true);
 for(const [lang,n] of [['zh',29],['en',71],['ja',36]])assert.equal(validate('listFields',{...sparse,overview:{...overview,does:{...overview.does,[lang]:'𠮷'.repeat(n)}}}),false);
});
test('every trust badge and similar group carries a checkable source',()=>{
 assert.equal(validate('listFields',{...sparse,trustBadges:[{kind:'official'}]}),false);
 assert.equal(validate('listFields',{...sparse,similarGroup:{id:'g',kind:'fork',members:['a','b']}}),false);
});
