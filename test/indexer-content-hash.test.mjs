import test from 'node:test';
import assert from 'node:assert/strict';
import * as api from '@hanamesh/api-contracts/indexer-catalog';

test('published read metadata follows provider contentHash guarantee and read errors', () => {
  assert.equal(api.INDEXER_CONTRACT_DEFINITION.contentHash?.requiredOnProviderSuccess, true);
  for (const call of ['items','hana']) assert.ok(api.INDEXER_CONTRACT_DEFINITION.calls[call].errors.includes('INDEXER_CONTENT_SOURCE_UNKNOWN'));
});
test('new examples preserve the original hashless examples and first identity', () => {
  assert.equal(Object.hasOwn(api.INDEXER_EXAMPLES.item, 'contentHash'), false);
  const e=api.createIndexerContentHashExamples();
  assert.equal(e.item.contentHash, 'awesome:f76b8be341d4de20e710054d30ee5e036527d77f26fbe52520270e5d9aa9a16f');
  assert.equal(e.items.items[0].contentHash,e.item.contentHash);
  assert.equal(e.winningContent.sourceId,'1024store');
  assert.ok(e.winningContent.contentHash.startsWith('hanamesh:'));
  e.item.summary.en='mutated';
  assert.equal(api.createIndexerContentHashExamples().item.summary.en,'Example');
});
test('explicit read fixture forwards seeded list/get and empty continuation pages', async () => {
  const e=api.createIndexerContentHashExamples();
  const f=api.createIndexerContentHashReadFixture({pages:{'':e.emptyPage,[e.emptyPage.next]:e.items},item:e.item});
  assert.match(f.label,/FIXTURE/);
  assert.deepEqual(await f.service.listItems(),e.emptyPage);
  assert.deepEqual(await f.service.listItems({after:e.emptyPage.next}),e.items);
  assert.deepEqual(await f.service.getItem(e.item.hanaId),e.item);
  const value=await f.service.getItem(e.item.hanaId);value.contentHash='mutated';
  assert.equal((await f.service.getItem(e.item.hanaId)).contentHash,e.item.contentHash);
});
test('explicit failure fixture exposes missing/null/damaged hash read failure without computing hashes', async () => {
  const e=api.createIndexerContentHashExamples();
  for (const scenario of Object.values(e.invalidStoredHash)) {
    assert.deepEqual(scenario.http,{status:500,body:{error:{code:'INDEXER_CONTENT_SOURCE_UNKNOWN',message:'INDEXER_CONTENT_SOURCE_UNKNOWN'}}});
    const f=api.createIndexerContentHashReadFixture({failure:scenario.service});
    for (const operation of [()=>f.service.listItems(),()=>f.service.getItem(e.item.hanaId)]) {
      await assert.rejects(operation,error => error instanceof Error && error.code==='INDEXER_CONTENT_SOURCE_UNKNOWN' && error.statusCode===500 && error.message===scenario.service.message);
    }
  }
});
test('legacy fixtures continue accepting hashless v0.16.0 values', async () => {
  const item=structuredClone(api.INDEXER_EXAMPLES.item);
  const f=api.createIndexerProviderFixture({items:[item]});
  assert.deepEqual(await f.service.getItem(item.hanaId),item);
  assert.equal(Object.hasOwn((await f.service.listItems()).items[0],'contentHash'),false);
});

test('read provenance pins provider formal main/tag and current published bytes', async () => {
  const {readFileSync}=await import('node:fs');
  const {createHash}=await import('node:crypto');
  const p=JSON.parse(readFileSync(new URL('../contracts/indexer-catalog/read-provenance.json',import.meta.url)));
  assert.equal(p.commit,'f2a089ae2981324abf432aa73a1546c89693d817');
  assert.equal(p.providerTag,'v0.2.0');
  assert.equal(p.providerTagCommit,'ab47919137ad7e930bb1661cc3c5f494bff3642c');
  for(const [file,hash] of Object.entries(p.publishedFiles)) assert.equal(createHash('sha256').update(readFileSync(new URL(`../contracts/indexer-catalog/${file}`,import.meta.url))).digest('hex'),hash,file);
  for(const factory of ['createIndexerModule','createIndexerService','buildIndexerService','createIndexerPlugin','createIndexerRunner'])assert.equal(api[factory],undefined);
});

test('scripted cursors only use own keys, including prototype names', async () => {
  const f=api.createIndexerContentHashReadFixture();
  for (const after of ['__proto__','toString','unseeded']) await assert.rejects(f.service.listItems({after}), {message:'FIXTURE: unscripted cursor'});
});
