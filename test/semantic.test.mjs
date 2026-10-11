import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CONTRACTS} from '../index.js';
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const load = () => import('@hanamesh/api-contracts/semantic');

test('C-SEMANTIC has a formal public entry and provider-only factory signatures', async () => {
  assert.ok(packageJson.exports['./semantic']);
  const c = await load();
  assert.equal(CONTRACTS['C-SEMANTIC'].entry, '@hanamesh/api-contracts/semantic');
  assert.equal(CONTRACTS['C-SEMANTIC'].definition, c.SEMANTIC_CONTRACT_DEFINITION);
  for (const name of ['createSemanticModule', 'createSemanticService', 'createSemanticPlugin', 'bridgeSemanticUnitOfWork', 'VoyageEmbeddingProvider', 'StubEmbeddingProvider', 'JevDecisionProvider', 'StubDecisionProvider', 'FallbackDecisionProvider', 'PostgresSemanticRepository', 'identityProfileEnricher', 'fetchCapabilityReadme']) assert.equal(name in c, false, name);
});

test('provider examples are independent and repository fixture records explicit values for every port', async () => {
  assert.ok(packageJson.exports['./semantic']);
  const {createSemanticContractExamples: examples, createSemanticRepositoryFixture: fixture} = await load();
  const a = examples(), b = examples();
  assert.deepEqual(a, b);
  a.sourceRows[0].name = 'changed';
  assert.equal(b.sourceRows[0].name, 'Fixture');
  const f = fixture(b);
  b.candidates.length = 0;
  const rows = await f.repository.listSourceRows('ignored');
  rows[0].name = 'changed';
  assert.equal((await f.repository.listSourceRows())[0].name, 'Fixture');
  assert.deepEqual(await f.repository.listPendingEmbeddings('ignored', 'ignored'), examples().pending);
  assert.deepEqual(await f.repository.search(undefined, {}), examples().candidates);
  const p = {explicit: true};
  assert.deepEqual(await f.repository.upsertProfiles({}, [p]), examples().changed);
  await f.repository.upsertEmbeddings({}, [p]);
  await f.repository.logQuery({}, p);
  await f.repository.updateQueryDecision({}, p);
  await f.repository.logFeedback({}, p);
  p.explicit = false;
  for (const key of ['profiles', 'embeddings', 'queryLogs', 'decisions', 'feedbackLogs']) assert.deepEqual(f[key], [{explicit: true}]);
  for (const method of Object.keys(f.repository)) {
    const error = new Error(method);
    f.failures[method] = error;
    await assert.rejects(() => f.repository[method](), e => e === error);
  }
});

test('SemanticError retains its provider code/status/message and published provenance is fixed', async () => {
  assert.ok(packageJson.exports['./semantic']);
  const {SemanticError} = await load();
  const e = new SemanticError('SEMANTIC_SOURCE_CONTENT_HASH_REQUIRED', 500);
  assert.equal(e.code, e.message);
  assert.equal(e.statusCode, 500);
  assert.equal(e.name, 'SemanticError');
  const p = JSON.parse(readFileSync(new URL('../contracts/semantic/provenance.json', import.meta.url)));
  assert.equal(p.provider.commit, '6756523ee56939873fa6f8450089bd99d911a3d5');
  assert.equal(p.provider.tag, 'v0.2.0');
});
