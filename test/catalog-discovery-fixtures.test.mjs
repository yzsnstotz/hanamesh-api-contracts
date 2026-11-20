import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import Ajv from 'ajv/dist/2020.js';
import {DISCOVERY_SCHEMA} from '@hanamesh/api-contracts/catalog/discovery';
import {LOCALIZED_SCHEMA} from '@hanamesh/api-contracts/catalog/localized';
const ajv=new Ajv({strict:true});ajv.addSchema(LOCALIZED_SCHEMA);ajv.addSchema(DISCOVERY_SCHEMA,'discovery');
const read=name=>JSON.parse(readFileSync(new URL('./fixtures/catalog-discovery/'+name,import.meta.url),'utf8'));
const valid=(type,value)=>{const v=ajv.compile({$ref:'discovery#/$defs/'+type});assert.equal(v(value),true,JSON.stringify(v.errors));};
test('shared draft fixtures validate as actual list/search/detail/directory/config response shapes',()=>{
 for(const n of ['list.json','search.json'])valid('page',read(n));
 valid('detailItem',read('detail.json'));valid('domainDirectory',read('domain-directory.json'));
 for(const p of Object.values(read('featured.json').byDomain)){valid('page',p);assert.equal(p.items.length,11);assert.deepEqual(p.items.map(i=>i.featured.find(f=>i.domainIds.includes(f.domainId)).rank),[1,2,3,4,5,6,7,8,9,10,11]);}
 for(const c of Object.values(read('stage-config.json')))valid('stageConfig',c);
});
test('owner display example and all fixture display values are ready for rendering without conversion',()=>{
 const page=read('list.json'),s=page.items[0].score;assert.equal(s.total,86);assert.equal(s.scale,100);assert.equal(s.displayTotal,8.6);assert.equal(s.displayScale,10);assert.equal(s.displayDecimals,1);
 assert.deepEqual(s.dimensionWeights,{quality:30,popularity:35,maintenance:35});assert.deepEqual(Object.keys(s.dimensions).sort(),['maintenance','popularity','quality']);
 for(const p of [page,read('search.json'),...Object.values(read('featured.json').byDomain)])for(const i of p.items){
  assert.equal('reasons' in i,false);if(i.score.displayTotal!==null)assert.equal(Number.isInteger(i.score.displayTotal*10),true);else assert.equal(i.score.total,null);
 }
});
