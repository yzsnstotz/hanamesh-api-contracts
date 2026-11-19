import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import Ajv from 'ajv/dist/2020.js';
const file=new URL('../contracts/catalog/discovery/schema.json',import.meta.url);
function schema(){assert.equal(existsSync(file),true,'public discovery schema is shipped');return JSON.parse(readFileSync(file,'utf8'));}
const sparse={domainIds:[],subdivisions:[],taxonomyVersion:'hanamesh-discovery-taxonomy-v1',overview:null,score:{checks:['readme','license','scorecard','npmDownloads7d','githubStars','pushedAt'].map((key,i)=>({key,dimension:i<3?'quality':i<5?'popularity':'maintenance',weight:[10,10,10,20,15,35][i],normalized:null,value:null,state:'missing',reason:'not_available'})),status:'insufficient',total:null,scale:100,displayTotal:null,displayScale:10,displayDecimals:1,displayDimensions:{quality:null,popularity:null,maintenance:null},dimensionWeights:{quality:30,popularity:35,maintenance:35},dimensions:{quality:null,popularity:null,maintenance:null},coverage:0,missing:[],evidence:[],rulesVersion:'hanamesh-initial-v1',assessedAt:'2026-11-19T00:00:00.000Z'},trustBadges:[],featured:[],similarGroup:null};
function validate(name,value){const ajv=new Ajv({strict:true});ajv.addSchema(schema(),'discovery');return ajv.compile({$ref:'discovery#/$defs/'+name})(value);}
test('list, search and detail share one discovery DTO; reasons are detail only',()=>{
 assert.equal(validate('listFields',sparse),true);assert.equal(validate('listFields',{...sparse,reasons:[]}),false);
 assert.equal(validate('detailFields',{...sparse,reasons:[]}),true);
 assert.equal(validate('item',{hanaId:'fixture',displayName:'existing catalog field',...sparse}),true);
 assert.equal(validate('item',{hanaId:'fixture',...sparse,reasons:[]}),false);
 assert.equal(validate('detailItem',{hanaId:'fixture',displayName:'existing catalog field',...sparse,reasons:[]}),true);
 assert.equal(validate('page',{items:[{hanaId:'00000000-0000-4000-8000-000000000001',...sparse}],next:null,total:1,hiddenInsufficientCount:1,domains:[],subdivisions:[],phase:'early'}),true);
});
test('unknown score is null, never zero; a scored result requires an actual total',()=>{
 assert.equal(validate('listFields',{...sparse,score:{...sparse.score,total:0}}),false);
 assert.equal(validate('listFields',{...sparse,score:{...sparse.score,status:'scored'}}),false);
 assert.equal(validate('listFields',{...sparse,score:{...sparse.score,status:'scored',total:100,displayTotal:10}}),false);
});
test('overview enforces Unicode code point limits 28/70/35 without truncation',()=>{
 const overview={does:{zh:'文'.repeat(28),en:'a'.repeat(70),ja:'字'.repeat(35)},facts:{},evidence:[{key:'does',sourceUrl:'https://github.com/example/plugin',observedAt:'2026-11-19T00:00:00Z',quote:'Synthetic capability'}]};
 assert.equal(validate('listFields',{...sparse,overview}),true);
 assert.equal(validate('listFields',{...sparse,overview:{...overview,evidence:[]}}),false);
 for(const [lang,n] of [['zh',29],['en',71],['ja',36]])assert.equal(validate('listFields',{...sparse,overview:{...overview,does:{...overview.does,[lang]:'𠮷'.repeat(n)}}}),false);
});
test('every trust badge and similar group carries a checkable source',()=>{
 assert.equal(validate('listFields',{...sparse,trustBadges:[{kind:'official'}]}),false);
 assert.equal(validate('listFields',{...sparse,similarGroup:{id:'g',kind:'fork',members:['a','b']}}),false);
 assert.equal(validate('listFields',{...sparse,similarGroup:{id:'g',kind:'manual',members:['a'],sources:[{sourceUrl:'https://example.invalid/group',observedAt:'2026-11-19T00:00:00Z'}]}}),false);
});
