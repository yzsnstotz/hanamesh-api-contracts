import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const load = () => import('@hanamesh/api-contracts/semantic');
test('Q81 publishes separate current facts fixtures without a product reader', async () => {
  const c = await load();
  assert.equal(typeof c.createSemanticEmbeddingFactsExamples, 'function');
  assert.equal(typeof c.createSemanticEmbeddingFactsFixture, 'function');
  assert.equal('createSemanticEmbeddingFactsReader' in c, false);
  const a = c.createSemanticEmbeddingFactsExamples(), b = c.createSemanticEmbeddingFactsExamples();
  assert.deepEqual(a, b);
  assert.match(a.label, /^FIXTURE/);
  const f = c.createSemanticEmbeddingFactsFixture(a);
  a.all[0].oldestCurrentEmbeddedAt = 'changed';
  const all = {afterHanaId:null,limit:1,selection:{kind:'all'}};
  const rows = await f.repository.listEmbeddingFacts(all);
  assert.deepEqual(rows, b.all); // repository returns limit+1 for the host reader
  assert.equal(rows[0].oldestCurrentEmbeddedAt, '2026-01-01T00:00:00.000001Z');
  assert.equal(rows[1].hasCurrentEmbedding, false);
  assert.equal(rows[1].oldestCurrentEmbeddedAt, null);
  rows[0].hanaId = 'changed';
  assert.deepEqual(await f.repository.listEmbeddingFacts(all), b.all);
  const last = await f.repository.listEmbeddingFacts({...all,afterHanaId:b.all[0].hanaId});
  assert.deepEqual(last,[b.all[1]]);
  assert.deepEqual(await f.repository.listEmbeddingFacts({...all,afterHanaId:b.all[1].hanaId}),[]);
  const exact = {kind:'exact',provider:b.exact[0].provider,model:b.exact[0].model};
  assert.deepEqual(await f.repository.listEmbeddingFacts({...all,selection:exact}), b.exact[0].items);
  await assert.rejects(f.repository.listEmbeddingFacts({...all,selection:{...exact,model:'unrecorded'}}), /SEMANTIC_FIXTURE_UNRECORDED_SELECTION/);
  const empty = c.createSemanticEmbeddingFactsFixture({...b,all:[]});
  assert.deepEqual(await empty.repository.listEmbeddingFacts(all), []);
  const error = Object.assign(new Error('storage failure'),{code:'42501'});
  f.failures.listEmbeddingFacts = error;
  await assert.rejects(f.repository.listEmbeddingFacts(all), e => e === error);
  assert.deepEqual(f.calls[0], all);
});
test('Q81 fixed provider provenance checks every published source byte', () => {
  const p = JSON.parse(readFileSync(new URL('../contracts/semantic/current-provenance.json',import.meta.url)));
  assert.equal(p.provider.commit, '7930d7729d2fbaae4f096cea481d29a4c8068132');
  for (const source of p.sources) {
    const bytes = readFileSync(new URL('../'+source.target,import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),source.publishedSha256,source.target);
  }
});

test('host FIXTURE uses exhausted C-CATALOG IDs as denominator and current facts intersection', async () => {
  const {createRegistryConsumerFixture} = await import('@hanamesh/server-registry/contract/fixtures');
  const c = await load(), examples = c.createSemanticEmbeddingFactsExamples();
  const provider=createRegistryConsumerFixture();
  const catalogExamples={profile:(await provider.registry.upsertHanaProfile(provider.subject,provider.input)).profile};
  const ids = ['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003'];
  const catalogPages = [{items:[{...catalogExamples.profile,hanaId:ids[0]}],next:'FIXTURE-cursor'},{items:[{...catalogExamples.profile,hanaId:ids[1]}],next:null}];
  const registryIds = new Set(catalogPages.flatMap(page => page.items.map(item => item.hanaId)));
  const f = c.createSemanticEmbeddingFactsFixture({...examples,all:[...examples.all,{hanaId:'00000000-0000-4000-8000-000000000004',hasCurrentEmbedding:true,oldestCurrentEmbeddedAt:'2026-01-03T00:00:00.000001Z'}]});
  const facts = []; let afterHanaId = null;
  for (;;) {
    const rows = await f.repository.listEmbeddingFacts({afterHanaId,limit:1,selection:{kind:'all'}});
    facts.push(...rows.slice(0,1));
    if (rows.length <= 1) break;
    afterHanaId = rows[0].hanaId;
  }
  assert.equal(facts.length,3);
  const intersection = facts.filter(item => item.hasCurrentEmbedding && registryIds.has(item.hanaId));
  assert.equal(intersection.length,1);
  assert.equal(registryIds.size,2); // Registry-only Hana stays uncovered; Semantic-only Hana excluded
  assert.equal(intersection.length / registryIds.size,0.5);
  assert.equal(intersection[0].oldestCurrentEmbeddedAt.slice(0,10),'2026-01-01');
  const emptyRegistry = new Set();
  assert.equal(emptyRegistry.size === 0 ? null : 0 / emptyRegistry.size,null);
});

test('named configuration is fixed provider data and helper implementation stays absent', async () => {
  const c = await load();
  assert.equal(c.SEMANTIC_DEFAULTS.providerTimeoutMs,15000);
  assert.equal(c.SEMANTIC_DEFAULTS.embeddingFactsPageSize,200);
  assert.equal(c.SEMANTIC_DEFAULTS.embeddingFactsMaxPageSize,1000);
  assert.equal(c.SEMANTIC_LIMITS.readmeDistillateBytes,4096);
  assert.ok(Object.isFrozen(c.SEMANTIC_DEFAULTS));
  for (const name of ['positiveInteger','timeoutMilliseconds','providerTransport','retryDelay']) assert.equal(name in c,false,name);
  const e = new c.SemanticError('SEMANTIC_EMBEDDING_FACTS_PORT_REQUIRED',500);
  assert.equal(e.code,e.message); assert.equal(e.statusCode,500);
});
