import assert from 'node:assert/strict';
import test from 'node:test';
import Ajv from 'ajv';
import {OPS_MANIFEST_SCHEMA, OPS_PAGE_CONTRIBUTION_SCHEMA} from '@hanamesh/api-contracts/host/ops-manifest';
import {
  OPS_COMPANION_LIMITS,
  OPS_TEXT_PAGE_SCHEMA,
  OPS_ACCESS_PAGE_SCHEMA,
  OPS_ROUTE_PAGE_SCHEMA,
} from '@hanamesh/api-contracts/host/ops-manifest/companions';
import {
  OPS_COVERAGE_SNAPSHOT_SCHEMA,
  OPS_SETTLEMENT_SNAPSHOT_SCHEMA,
} from '@hanamesh/api-contracts/ops/observatory/snapshots';
import textJson from '@hanamesh/api-contracts/host/ops-manifest/companions/texts.schema.json' with {type:'json'};
import accessJson from '@hanamesh/api-contracts/host/ops-manifest/companions/access.schema.json' with {type:'json'};
import routeJson from '@hanamesh/api-contracts/host/ops-manifest/companions/routes.schema.json' with {type:'json'};
import coverageJson from '@hanamesh/api-contracts/ops/observatory/snapshots/coverage.schema.json' with {type:'json'};
import settlementJson from '@hanamesh/api-contracts/ops/observatory/snapshots/settlement.schema.json' with {type:'json'};

const ajv = new Ajv({strict: true, coerceTypes: false, removeAdditional: false, useDefaults: false});
const validate = schema => ajv.compile(schema);
const row = {pageId: 'fixture.overview'};
const manifestPage = {
  id: row.pageId, moduleId: 'fixture', href: '/ops/overview', kind: 'page',
  titleKey: 'fixture.title', descriptionKey: 'fixture.desc',
  group: {id: 'g', labelKey: 'fixture.group', order: 0},
  order: 0, permission: {policyId: 'fixture.read'},
};
const text = {...row, texts: [{key: 'fixture.title', zh: '概览', en: 'Overview', ja: '概要'}]};
const access = {...row, actionId: null, scope: 'fixture:ops', policyRevision: 'policy-1', status: 'allowed', reason: null};
const web = {...row, kind: 'web-route', href: '/ops/manage/overview'};
const html = {...row, kind: 'host-html', hostPath: '/ops/legacy', href: '/hm/ops/legacy'};
const page = (kind, items, extra={}) => ({
  schema: 'hanamesh-ops-'+kind+'-v1', revision: 'config-2', items,
  nextAfter: null, complete: true, missing: [], ...extra
});

const window = {from: '2026-11-01T00:00:00.000Z', to: '2026-11-08T00:00:00.000Z'};
const scope = {deploymentId: 'fixture', scopeId: 'provider-1'};
const snapshot = {
  source: {module: 'fixture', port: 'readStats', definition: 'Fixture accepted records'},
  scope, requestedWindow: window, coveredWindow: window,
  snapshotId: 'snapshot-1', revision: 'source-1', asOf: window.to,
  complete: true, missing: [], nextAfter: null,
};
const coverage = {schema: 'hanamesh-ops-coverage-v1', ...snapshot};
const settlement = {schema: 'hanamesh-ops-settlement-snapshot-v1', ...snapshot, acceptanceRevision: 'accept-1', expectedRows: 0};

test('five added package schema exports match their JSON siblings and keep the public manifest closed', () => {
  for (const [schema, direct] of [
    [OPS_TEXT_PAGE_SCHEMA, textJson], [OPS_ACCESS_PAGE_SCHEMA, accessJson],
    [OPS_ROUTE_PAGE_SCHEMA, routeJson], [OPS_COVERAGE_SNAPSHOT_SCHEMA, coverageJson],
    [OPS_SETTLEMENT_SNAPSHOT_SCHEMA, settlementJson],
  ]) assert.deepEqual(schema, direct);
  assert.deepEqual(OPS_COMPANION_LIMITS, {pageItems: 200, responseBytes: 262144, manifestEntries: 512});
  const isManifest = validate(OPS_MANIFEST_SCHEMA);
  const manifest = {schemaVersion: 2, paths: [manifestPage.href], pages: [manifestPage]};
  assert.equal(isManifest(manifest), true);
  assert.equal(validate(OPS_PAGE_CONTRIBUTION_SCHEMA)(manifestPage), true);
  for (const extra of ['access', 'texts', 'routes', 'actor', 'revision']) {
    assert.equal(isManifest({...manifest, [extra]: {}}), false, extra);
  }
  assert.equal(isManifest({schemaVersion: 1, paths: []}), false);
});

test('texts require zh, en and ja and independently bound each revision page', () => {
  const check = validate(OPS_TEXT_PAGE_SCHEMA);
  assert.equal(check(page('texts', [text], {nextAfter:'snapshot-page-2'})), true);
  for (const lang of ['zh','en','ja']) {
    const translations = {...text.texts[0]};
    delete translations[lang];
    assert.equal(check(page('texts', [{...text, texts:[translations]}])), false, lang);
  }
  assert.equal(check(page('texts', [{...text, texts:[{...text.texts[0], zh:' '}]}])), false);
  assert.equal(check(page('texts', Array.from({length:200}, (_, id) => ({...text, pageId:'p'+id})))), true);
  assert.equal(check(page('texts', Array.from({length:201}, (_, id) => ({...text, pageId:'p'+id})))), false);
  assert.equal(check(page('texts', [], {complete:false, missing:['PRODUCER_UNAVAILABLE']})), true);
  assert.equal(check(page('texts', [], {complete:false})), false);
  assert.equal(check(page('texts', [], {complete:true, missing:['PRODUCER_UNAVAILABLE']})), false);
});

test('actor access distinguishes a page read, action scope, denial and unavailable policy', () => {
  const check = validate(OPS_ACCESS_PAGE_SCHEMA);
  assert.equal(check(page('access', Array.from({length:201}, (_, id) => ({...access, pageId:'p'+id})))), false);
  assert.equal(check(page('access', [access, {...access, actionId:'preview', status:'denied', reason:'FORBIDDEN'}])), true);
  assert.equal(check(page('access', [{...access, status:'unavailable', policyRevision:null, reason:'UNAVAILABLE'}])), true);
  for (const bad of [
    {...access, status:'allowed', policyRevision:null},
    {...access, status:'denied'},
    {...access, status:'denied', reason:' ', policyRevision:null},
    {...access, status:'unavailable', reason:null},
    {...access, principalId:'fixture-user'},
    {...access, cookie:'fixture-cookie'},
    {...access, allowed:true},
  ]) assert.equal(check(page('access', [bad])), false, JSON.stringify(bad));
});

test('route bindings list an explicit registered path and browser href without widening the manifest', () => {
  const check = validate(OPS_ROUTE_PAGE_SCHEMA);
  assert.equal(check(page('routes', Array.from({length:201}, (_, id) => ({...web, pageId:'p'+id})))), false);
  assert.equal(check(page('routes', [web, {...html, pageId:'fixture.legacy'}])), true);
  for (const href of ['/ops', '/ops#home', '/ops/foo?x=1', '/ops/:id', '/ops/*', '/ops/../a', '/ops/a%2fb', 'https://example.invalid/ops/a', '//example.invalid/ops/a', '/ops/a/', '/ops/a\n', '/hm/ops/a']) {
    assert.equal(check(page('routes', [{...web, href}])), false, href);
  }
  for (const bad of [
    {...html, href:'/ops/legacy'}, {...html, hostPath:'/hm/ops/legacy'},
    {...html, hostPath:'/v1/secret'}, {...web, hostPath:'/ops/manage/overview'},
    {...html, hostPath:undefined},
  ]) assert.equal(check(page('routes', [bad])), false);
});

test('coverage treats the end of pagination separately from coverage and carries a canonical chain anchor', () => {
  const check = validate(OPS_COVERAGE_SNAPSHOT_SCHEMA);
  assert.equal(check({...coverage, nextAfter:'cursor-2'}), true);
  const absent = {...coverage, complete:false, coveredWindow:null, snapshotId:null, revision:null, asOf:null, missing:['NOT_PUBLISHED']};
  assert.equal(check(absent), true);
  assert.equal(check({...absent, nextAfter:'unbound-cursor'}), false);
  assert.equal(check({...absent, missing:[]}), false);
  assert.equal(check({...coverage, complete:true, snapshotId:null}), false);
  assert.equal(check({...coverage, complete:true, missing:['SHARD_MISSING']}), false);
  const chainAnchor = {chainId:97, blockNumber:'9007199254740993', blockHash:'0x'+'ab'.repeat(32), confirmations:8, reorgCheckedThrough:'9007199254740993'};
  assert.equal(check({...coverage, chainAnchor}), true);
  assert.equal(check({...coverage, chainAnchor:{...chainAnchor, blockNumber:44}}), false);
  assert.equal(check({...coverage, chainAnchor:{...chainAnchor, blockHash:'0x1234'}}), false);
  assert.equal(check({...coverage, asOf:'2026-11-08T00:00:00+01:00'}), false);
});

test('settlement requires proof metadata, keeps complete empty explicit, and rejects browser receipt injection', () => {
  const check = validate(OPS_SETTLEMENT_SNAPSHOT_SCHEMA);
  const settlementScope = {deploymentId: scope.deploymentId, providerId: scope.scopeId};
  const proof = {...settlement, scope:settlementScope};
  assert.equal(check(proof), true);
  assert.equal(check({...proof, expectedRows:1200, nextAfter:'cursor-2'}), true);
  assert.equal(check({...proof, expectedRows:null}), false);
  assert.equal(check({...proof, acceptanceRevision:null}), false);
  assert.equal(check({...proof, expectedRows:-1}), false);
  assert.equal(check({...proof, expectedRows:9007199254740992}), false);
  assert.equal(check({...proof, receipts:[]}), false);
  assert.equal(check({...proof, nextAfter:null, complete:false, coveredWindow:null, snapshotId:null, revision:null, asOf:null,
    expectedRows:null, acceptanceRevision:null, missing:['RETENTION_GAP']}), true);
  assert.equal(check({...proof, scope}), false);
});
