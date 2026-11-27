import test from 'node:test';
import assert from 'node:assert/strict';
import Ajv from 'ajv/dist/2020.js';
import {DISCOVERY_SCHEMA} from '@hanamesh/api-contracts/catalog/discovery';
import {LOCALIZED_SCHEMA} from '@hanamesh/api-contracts/catalog/localized';
import detail from './fixtures/catalog-discovery/detail.json' with {type:'json'};

const ajv = new Ajv({strict:true});
ajv.addSchema(LOCALIZED_SCHEMA);
ajv.addSchema(DISCOVERY_SCHEMA);
const valid = name => ajv.getSchema(DISCOVERY_SCHEMA.$id+'#/$defs/'+name);
const dimension = {score:8,reason:'装好就能用。'};
const rating = {
  version:1, language:'zh', repository:'example/plugin', directory:'', revision:'a'.repeat(40),
  overview:{what:'插件',helps:'整理笔记',howToStart:'在市场安装',who:'笔记用户'},
  oneLiner:'整理笔记', total:8, unratedReason:null,
  dimensions:{onboarding:dimension,documentation:dimension,maintenance:dimension,safety:{...dimension,score:null},popularity:{...dimension,score:0}},
  popularity:{stars:0,downloads30d:null,pushedAt:null},
  recommendation:'适合整理资料', cautions:['先备份'], verdict:'装好后就可以整理笔记。',
  evidence:['onboarding','documentation'].map(section=>({section,point:'安装说明',sources:[{
    path:'README.md',lines:'3-4',quote:'Installation',
    url:'https://github.com/example/plugin/blob/'+ 'a'.repeat(40) +'/README.md#L3-L4'
  }]})),
  basisNote:null
};

test('the five-dimension rating is optional and belongs to detail only',()=>{
  assert.equal(valid('detailItem')(detail),true);
  assert.equal(valid('detailItem')({...detail,rating}),true);
  assert.equal(valid('item')({...detail,rating}),false);
  for(const invalid of [
    {...rating,version:2},
    {...rating,cautions:['一','二','三','四']},
    {...rating,evidence:[{...rating.evidence[0],sources:[{...rating.evidence[0].sources[0],url:'javascript:alert(1)'}]}]},
    {...rating,dimensions:{...rating.dimensions,safety:{score:0,reason:'零分'}}},
    {...rating,total:null},
    {...rating,dimensions:{...rating.dimensions,onboarding:{...dimension,score:null}}},
    {...rating,requestId:'private'},
  ]) assert.equal(valid('rating')(invalid),false,JSON.stringify(invalid));
  assert.equal(valid('rating')({...rating,total:null,unratedReason:'没有安装说明'}),true);
});

test('the bounded import batch has a closed envelope and requires UUIDs',()=>{
  const batch={key:'scb4-fixture',items:[{hanaId:'00000000-0000-4000-8000-000000000001',rating}]};
  assert.equal(valid('ratingBatch')(batch),true);
  assert.equal(valid('ratingBatch')({...batch,items:[]}),false);
  assert.equal(valid('ratingBatch')({...batch,items:[{hanaId:'wrong',rating}]}),false);
  assert.equal(valid('ratingBatch')({...batch,debug:true}),false);
});
