import assert from 'node:assert/strict';
import test from 'node:test';
import Ajv from 'ajv/dist/2020.js';
import {DISCOVERY_SCHEMA} from '@hanamesh/api-contracts/catalog/discovery';
import {LOCALIZED_SCHEMA} from '@hanamesh/api-contracts/catalog/localized';
import {
  CATALOG_BOARD_CHANGES_HTTP_PATH,
  CATALOG_QUERY_HTTP_PATH,
  CATALOG_READINESS_HTTP_PATH,
  CATALOG_QUERY_SCHEMA,
  decodeCatalogQueryParams,
  encodeCatalogQueryParams,
} from '@hanamesh/api-contracts/catalog/query';

const query = { sort: 'latest', searchMode: 'keyword', limit: 24 };

test('Web and Market share one GET resource with byte-stable query parameters', () => {
  assert.equal(CATALOG_QUERY_HTTP_PATH, '/v1/host/catalog/query');
  const inputs = {
    ...query, q: '分面', categories: ['device', 'Business & Operations'], repoOwner: ['author', 'org'],
    domain: 'office', subdivision: 'documents', includeInsufficient: false,
  };
  const params = encodeCatalogQueryParams(inputs, { page: 1875 });
  assert.deepEqual(decodeCatalogQueryParams(params), {
    query: { ...inputs, categories: ['Business & Operations', 'device'] }, page: 1875,
  });
  assert.equal(params.toString(), encodeCatalogQueryParams({ ...inputs, categories: ['Business & Operations', 'device', 'Business & Operations'] }, { page: 1875 }).toString());
  assert.deepEqual(decodeCatalogQueryParams(encodeCatalogQueryParams({ ...query, after: 'a_b' })), {
    query: { ...query, after: 'a_b' },
  });
});

test('HTTP parser rejects duplicate scalars, unknown selectors and ambiguous pagination', () => {
  const base = 'sort=latest&searchMode=keyword';
  for (const tail of [
    'sort=id', 'after=x&page=2', 'page=01', 'page=0', 'page=9007199254740992',
    'limit=201', 'official=false', 'category=app', 'includeInsufficient=1', 'semanticHanaIds=forged',
  ]) {
    const limit = tail.startsWith('limit=') ? '' : '&limit=24';
    assert.throws(() => decodeCatalogQueryParams(new URLSearchParams(`${base}${limit}&${tail}`)), RangeError, tail);
  }
});

test('HTTP envelopes validate reset pages and carry search ID on both response variants', () => {
  const ajv = new Ajv({ strict: true });
  ajv.addSchema(LOCALIZED_SCHEMA);
  ajv.addSchema(DISCOVERY_SCHEMA);
  ajv.addSchema(CATALOG_QUERY_SCHEMA);
  const validate = ajv.compile({ $ref: `${CATALOG_QUERY_SCHEMA.$id}#/$defs/httpResponse` });
  const metadata = { searchId: '0192c7e8-0410-4000-8000-000000000001', semanticNotice: null, paginationReset: false };
  const names = { kind: 'names', ...metadata, page: { items: [], nextCursor: null }, cards: [] };
  assert.equal(validate(names), true, JSON.stringify(validate.errors));
  const page = {
    kind: 'page', ...metadata, pageNumber: 2, limit: 24, popularityAsOf: null, cards: [],
    page: {
      items: [], total: 25, capped: false, hiddenInsufficientCount: 0, hiddenInsufficientCountCapped: false,
      facets: { all: 101, categories: [], sources: [], channels: [], domains: [], subdivisions: [] },
      nextCursor: null, snapshot: 's', policyVersion: 2, searchMode: 'keyword', indexReady: true,
    },
  };
  assert.equal(validate(page), true, JSON.stringify(validate.errors));
  assert.equal(validate({ ...page, paginationReset: true }), false);
  assert.equal(validate({ ...page, paginationReset: true, pageNumber: 1 }), true, JSON.stringify(validate.errors));
  const { searchId, ...unbound } = page;
  assert.equal(validate(unbound), false, searchId);
});

test('board changes and readiness use the same opaque watermark format and require explicit nulls', () => {
  assert.equal(CATALOG_BOARD_CHANGES_HTTP_PATH, '/v1/indexer/community/board-changes');
  assert.equal(CATALOG_READINESS_HTTP_PATH, '/v1/host/catalog/readiness');
  const ajv = new Ajv({ strict: true }).addSchema(CATALOG_QUERY_SCHEMA);
  const board = ajv.compile({ $ref: `${CATALOG_QUERY_SCHEMA.$id}#/$defs/boardChangePage` });
  const readiness = ajv.compile({ $ref: `${CATALOG_QUERY_SCHEMA.$id}#/$defs/cutoverReadiness` });
  const cursor = 'a_c-72';
  const fact = {
    hanaId: '0192c7e8-0410-4000-8000-000000000001', displayName: 'Merged board',
    listingStatus: 'delisted', canonicalHanaId: '0192c7e8-0410-4000-8000-000000000002', ownerPrincipalId: null,
  };
  assert.equal(board({ items: [fact], cursor, more: false }), true, JSON.stringify(board.errors));
  assert.equal(board({ items: [{ ...fact, listingStatus: 'listed' }], cursor, more: false }), false);
  assert.equal(board({ items: [{ ...fact, ownerPrincipalId: undefined }], cursor, more: false }), false);
  assert.equal(board({ items: [], cursor, more: false }), true);
  assert.equal(board({ items: [], cursor: 'not.a.cursor', more: false }), false);
  const ready = { ready: true, claimsReady: true, popularityAsOf: '2026-11-27T00:00:00.000Z', snapshot: '12', watermark: cursor };
  assert.equal(readiness(ready), true, JSON.stringify(readiness.errors));
  assert.equal(readiness({ ...ready, popularityAsOf: null }), false);
  assert.equal(readiness({ ...ready, claimsReady: false }), false);
  assert.equal(readiness({ ...ready, claimsReady: false, ready: false }), true);
});

test('sitemap reads a closed manifest or a generation-bound segment at the same public GET', async () => {
  const { decodeCatalogSitemapParams, encodeCatalogSitemapParams } = await import('@hanamesh/api-contracts/catalog/query');
  const generation = '0192c7e8-0410-4000-8000-000000000001';
  const after = '0192c7e8-0410-4000-8000-000000000002';
  const manifest = { view: 'sitemap' };
  const segment = { view: 'sitemap', generation, segment: 2, limit: 200, after };
  assert.equal(decodeCatalogSitemapParams(new URLSearchParams('sort=id')), null);
  assert.deepEqual(decodeCatalogSitemapParams(encodeCatalogSitemapParams(manifest)), manifest);
  assert.deepEqual(decodeCatalogSitemapParams(encodeCatalogSitemapParams(segment)), segment);
  for (const tail of [`generation=${generation}`, 'q=hello', 'limit=1', 'view=sitemap', `generation=${generation}&segment=0&limit=1`, `generation=${generation}&segment=1&limit=201`, `generation=${generation}&segment=1&limit=2&after=other`]) {
    assert.throws(() => decodeCatalogSitemapParams(new URLSearchParams(`view=sitemap&${tail}`)), RangeError, tail);
  }
  const ajv = new Ajv({ strict: true }).addSchema(CATALOG_QUERY_SCHEMA);
  const valid = ajv.compile({ $ref: `${CATALOG_QUERY_SCHEMA.$id}#/$defs/sitemapResponse` });
  assert.equal(valid({ kind: 'sitemap-manifest', generation, segmentCount: 0, segmentSize: 2000 }), true, JSON.stringify(valid.errors));
  const page = { kind: 'sitemap-segment', generation, segment: 2, items: [{ hanaId: after }], nextCursor: null };
  assert.equal(valid(page), true, JSON.stringify(valid.errors));
  assert.equal(valid({ ...page, items: [{ hanaId: after, lastmod: 'guessed' }] }), false);
});
