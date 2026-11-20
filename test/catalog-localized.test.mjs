import test from 'node:test';
import assert from 'node:assert/strict';
import Ajv from 'ajv/dist/2020.js';
import {LOCALIZED_SCHEMA, LOCALIZED_SCHEMA_VERSION, LOCALES, DOES_LIMITS, DOES_LIMITS_VERSION, LOCALIZED_FALLBACK_LOCALE} from '@hanamesh/api-contracts/catalog/localized';
import {DISCOVERY_SCHEMA} from '@hanamesh/api-contracts/catalog/discovery';
import jsonSchema from '@hanamesh/api-contracts/catalog/localized/schema.json' with {type:'json'};
const ajv=new Ajv({strict:true});
ajv.addSchema(LOCALIZED_SCHEMA);ajv.addSchema(DISCOVERY_SCHEMA);
const validate=ajv.getSchema(LOCALIZED_SCHEMA.$id);
const does=ajv.compile({$ref:LOCALIZED_SCHEMA.$id+'#/$defs/does'});
const locale=ajv.compile({$ref:LOCALIZED_SCHEMA.$id+'#/$defs/locale'});
const definition=name=>ajv.compile({$ref:DISCOVERY_SCHEMA.$id+'#/$defs/'+name});
const evidence=[{key:'does',sourceUrl:'https://example.invalid/source',observedAt:'2026-11-20T00:00:00Z',quote:'Source stays unchanged'}];
const texts={zh:'搜索代码',en:'Search code',ja:'コードを検索','pt-BR':'Pesquisar código',es:'Buscar código',ko:'코드 검색',vi:'Tìm kiếm mã',id:'Cari kode',ru:'Поиск кода'};

test('shared exports freeze nine canonical tags, schema version and per-language limits',()=>{
 assert.deepEqual(LOCALES,['zh','en','ja','pt-BR','es','ko','vi','id','ru']);
 assert.equal(LOCALIZED_SCHEMA_VERSION,'localized-v2');assert.equal(DOES_LIMITS_VERSION,'does-limits-v2');
 assert.equal(LOCALIZED_FALLBACK_LOCALE,'en');
 assert.deepEqual(DOES_LIMITS,{zh:28,en:70,ja:35,'pt-BR':80,es:80,ko:45,vi:90,id:80,ru:80});
 assert.deepEqual(jsonSchema,LOCALIZED_SCHEMA);
 assert.deepEqual(LOCALIZED_SCHEMA.$defs.locale.enum,LOCALES);
 assert.deepEqual(Object.keys(LOCALIZED_SCHEMA.$defs.localizedText.properties.byLocale.properties),LOCALES);
 for(const lang of LOCALES){assert.equal(locale(lang),true);assert.equal(LOCALIZED_SCHEMA.$defs.does.properties.byLocale.properties[lang].maxLength,DOES_LIMITS[lang]);}
 for(const invalid of ['pt','pt-br','en-US','fr','EN','',null,1])assert.equal(locale(invalid),false);
 assert.equal(Object.isFrozen(LOCALES),true);assert.equal(Object.isFrozen(DOES_LIMITS),true);
});

test('nine-language and sparse fixtures validate; missing English is a real missing translation',()=>{
 assert.equal(validate({byLocale:texts}),true);assert.equal(does({byLocale:texts}),true);
 for(const lang of LOCALES){assert.equal(validate({byLocale:{[lang]:texts[lang]}}),true);assert.equal(does({byLocale:{[lang]:texts[lang]}}),true);}
 assert.equal(validate({byLocale:{ru:''}}),true,'existing empty-string semantics are unchanged');
 assert.equal(validate({byLocale:{en:'x'.repeat(1000)}}),true,'no invented generic-text cap');
});

test('old shapes, empty maps, null translations, bad types and unknown tags are rejected',()=>{
 const invalid=[null,{},[],{zh:'中',en:'English',ja:'日'},{byLocale:{}},{byLocale:null},{byLocale:[]},{byLocale:'en'},
  {byLocale:{en:null}},JSON.parse(JSON.stringify({byLocale:{en:undefined}})),{byLocale:{en:42}},{byLocale:{en:false}},{byLocale:{en:{}}},
  {byLocale:{en:['a']}},{byLocale:{en:'ok'},source:'English'},{byLocale:{en:'ok'},zh:'旧'},
  {byLocale:{en:'ok',fr:'Non'}},{byLocale:{'pt-br':'não'}},{byLocale:{pt:'não'}}];
 for(const value of invalid){assert.equal(validate(value),false,JSON.stringify(value));assert.equal(does(value),false,JSON.stringify(value));}
});

for(const lang of LOCALES)test(`does ${lang}: limit−1 / limit / limit+1; astral characters count once`,()=>{
 const cap=DOES_LIMITS[lang];
 for(const char of [texts[lang][0],'𠮷']){
  for(const n of [cap-1,cap])assert.equal(does({byLocale:{[lang]:char.repeat(n)}}),true);
  assert.equal(does({byLocale:{[lang]:char.repeat(cap+1)}}),false);
 }
 const mixed={...texts,[lang]:'𠮷'.repeat(cap+1)};
 assert.equal(does({byLocale:mixed}),false,'one overlong locale rejects a complete map');
});

test('NFC is a producer boundary; schema counts serialized code points and never mutates evidence',()=>{
 const decomposed='e\u0301'.repeat(90);
 assert.equal(does({byLocale:{vi:decomposed}}),false);
 assert.equal(does({byLocale:{vi:decomposed.normalize('NFC')}}),true);
 const input={does:{byLocale:{vi:decomposed.normalize('NFC')}},facts:{},evidence};
 const frozen=JSON.stringify(input);assert.equal(definition('overview')(input),true);assert.equal(JSON.stringify(input),frozen);
});

test('discovery references shared does, textual facts and reason shapes; null facts preserve evidence rules',()=>{
 const overview=definition('overview'),reason=definition('reason');
 for(const lang of LOCALES){
  const text={byLocale:{[lang]:texts[lang]}};
  assert.equal(overview({does:text,facts:{audience:{value:text,evidence},difficultyReason:{value:text,evidence}},evidence}),true);
  assert.equal(reason({text,evidence}),true);
 }
 assert.equal(overview({does:null,facts:{audience:{value:null,evidence:[]}},evidence:[]}),true);
 assert.equal(overview({does:null,facts:{audience:{value:null,evidence}},evidence:[]}),false);
 for(const old of [{zh:'中',en:'English',ja:'日'},'legacy string',{byLocale:{}}]){
  assert.equal(overview({does:old,facts:{},evidence}),false);
  for(const field of ['audience','difficultyReason'])assert.equal(overview({does:null,facts:{[field]:{value:old,evidence}},evidence:[]}),false);
  assert.equal(reason({text:old,evidence}),false);
 }
 assert.equal(reason({text:{byLocale:texts},evidence:[]}),false);
});

test('every page and directory facet name requires shared LocalizedText',()=>{
 let count=0;
 function walk(node){
  if(!node||typeof node!=='object')return;
  if(node.properties?.name){
   count++;assert.deepEqual(node.properties.name,{$ref:LOCALIZED_SCHEMA.$id});
   const check=ajv.compile(node.properties.name);
   assert.equal(check({byLocale:texts}),true);assert.equal(check('old name'),false);assert.equal(check({zh:'中',en:'English',ja:'日'}),false);
  }
  for(const child of Object.values(node))walk(child);
 }
 walk(DISCOVERY_SCHEMA);assert.equal(count,4,'page domain/subdivision and directory domain/subdivision');
});
