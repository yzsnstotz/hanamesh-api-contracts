import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const ids=['rev.launch','rev.mesh','rev.split','rev.hana','rev.protocolFee','rev.reserve','rev.fiat','exp.ai','exp.ai.use','exp.server','exp.gas','ppl.reg','ppl.30d','ppl.dau','ppl.dev','svc.install','svc.install.p','svc.uses','svc.search','svc.ai','svc.issue','svc.issue.p','svc.points','svc.comm','svc.claim','svc.agent','hl.ai','hl.self','hl.vec','hl.sync','hl.idx','hl.safe','hl.all'];
test('R429-F2 shipped authority maps all33 ops-v3 ids to sections, typed values and owned sources',async()=>{
 const {default:m}=await import('@hanamesh/api-contracts/ops/observatory/metrics.ops-v3.json',{with:{type:'json'}});
 assert.equal(m.contractVersion,'0.26.0');assert.equal(m.design,'ops-v3');assert.equal(m.metrics.length,33);
 assert.deepEqual(m.metrics.map(x=>x.id),ids);assert.equal(new Set(m.metrics.map(x=>x.id)).size,33);
 for(const row of m.metrics){
  assert(row.label.length>0);assert(['income','spending','people','health'].includes(row.designSection));assert(row.projections.length>0);
  for(const p of row.projections){
   assert(p.id===row.id||p.id.startsWith(row.id+'.'),p.id);
   assert(['income','spending','people','health','parameters'].includes(p.section));
   assert(['ObservatoryIncome','ObservatorySpending','ObservatoryPeople','ObservatoryHealth','ObservatoryAiPendingCountValue','ObservatoryParameter'].includes(p.valueType));
   assert(p.fields.length>0&&p.fields.every(x=>typeof x==='string'&&x.length>0));
   assert(['pending','manual'].includes(p.defaultAvailability));assert(p.availabilityRule.length>0);
   assert(['published','pending','manual'].includes(p.supply.status));assert(p.supply.module===null||typeof p.supply.module==='string');
   if(p.supply.status==='pending'){assert.equal(p.defaultAvailability,'pending');assert(p.supply.missing.length>0);}
   if(p.supply.status==='published')assert(p.supply.port.length>0);
   assert.equal('value'in p,false,'mapping is declaration, never sample or default live data');
  }
 }
 assert.equal(m.metrics.find(x=>x.id==='hl.ai').projections[0].valueType,'ObservatoryAiPendingCountValue');
 assert.deepEqual(m.metrics.find(x=>x.id==='ppl.dau').projections.map(x=>x.id),['ppl.dau.day','ppl.dau.week']);
 assert(m.metrics.find(x=>x.id==='svc.install.p').projections[0].fields.some(x=>x.includes('7')),'design is seven-day installation people, not lifetime or90days');
 assert.equal(m.hostRegistry,false);assert.equal(m.extensionIdsAllowed,true);
});
test('R429-N1 shipped current-version prose matches the assigned package release',async()=>{
 const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
 for(const name of ['README.md','docs/observatory.md','docs/ops-manifest.md']){
  const s=await readFile(new URL('../'+name,import.meta.url),'utf8');assert(s.includes(pkg.version),name);
  assert.doesNotMatch(s,/本候选未分配版本|包发布版本尚未分配|版本及 Host 采用尚待编排分配|本候选0\.25\.0 tarball/);
 }
});
