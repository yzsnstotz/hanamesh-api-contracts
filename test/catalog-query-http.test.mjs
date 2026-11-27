import assert from 'node:assert/strict';
import test from 'node:test';
import Ajv from 'ajv/dist/2020.js';
import {DISCOVERY_SCHEMA} from '@hanamesh/api-contracts/catalog/discovery';
import {LOCALIZED_SCHEMA} from '@hanamesh/api-contracts/catalog/localized';
import {
  CATALOG_QUERY_HTTP_PATH,
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
      facets: { categories: [], sources: [], channels: [], domains: [], subdivisions: [] },
      nextCursor: null, snapshot: 's', policyVersion: 2, searchMode: 'keyword', indexReady: true,
    },
  };
  assert.equal(validate(page), true, JSON.stringify(validate.errors));
  assert.equal(validate({ ...page, paginationReset: true }), false);
  assert.equal(validate({ ...page, paginationReset: true, pageNumber: 1 }), true, JSON.stringify(validate.errors));
  const { searchId, ...unbound } = page;
  assert.equal(validate(unbound), false, searchId);
});
