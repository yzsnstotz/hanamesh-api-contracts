import schema from './schema.json' with {type:'json'};
export const CATALOG_QUERY_SCHEMA=schema;
export const CATALOG_QUERY_SORTS=Object.freeze(["relevance", "popular", "latest", "stars", "downloads", "id", "trending"]);
export const CATALOG_QUERY_MODES=Object.freeze(['keyword','hybrid','names']);
export const CATALOG_QUERY_HTTP_PATH = '/v1/host/catalog/query';
export const CATALOG_READINESS_HTTP_PATH = '/v1/host/catalog/readiness';
export const CATALOG_BOARD_CHANGES_HTTP_PATH = '/v1/indexer/community/board-changes';

const queryProperties = schema.$defs.query.properties;
const repeated = new Set(['categories', 'repoOwner']);
const booleans = new Set(['official', 'installable', 'includeInsufficient']);

function positiveInteger(value, name) {
  if (!/^[1-9][0-9]*$/u.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new RangeError(`Invalid catalog ${name}`);
  }
  return Number(value);
}

/** Decode the wire syntax. The provider still validates taxonomy, filters and cursor binding. */
export function decodeCatalogQueryParams(params) {
  const query = {};
  let page;
  for (const [key, value] of params) {
    if (repeated.has(key)) {
      (query[key] ??= []).push(value);
      continue;
    }
    if (key === 'page' && page === undefined) {
      page = positiveInteger(value, key);
      continue;
    }
    if (!Object.hasOwn(queryProperties, key) || Object.hasOwn(query, key)) {
      throw new RangeError(`Invalid catalog parameter ${key}`);
    }
    if (booleans.has(key)) {
      if (value !== 'true' && !(key === 'includeInsufficient' && value === 'false')) {
        throw new RangeError(`Invalid catalog ${key}`);
      }
      query[key] = value === 'true';
      continue;
    }
    query[key] = key === 'limit' ? positiveInteger(value, key) : value;
  }
  if (!CATALOG_QUERY_SORTS.includes(query.sort) || !CATALOG_QUERY_MODES.includes(query.searchMode)
      || query.limit === undefined || query.limit > queryProperties.limit.maximum
      || (query.after !== undefined && page !== undefined)
      || (query.searchMode === 'names' && page !== undefined && page !== 1)) {
    throw new RangeError('Invalid catalog query or pagination');
  }
  return page === undefined ? { query } : { query, page };
}

/** Encode a deterministic URL for Web, Market and the public GET cache. */
export function encodeCatalogQueryParams(query, { page } = {}) {
  const params = new URLSearchParams();
  for (const key of Object.keys(query).sort()) {
    const value = query[key];
    if (value === undefined) continue;
    if (repeated.has(key)) {
      if (!Array.isArray(value) || value.length === 0
          || (key === 'repoOwner' && value.length > queryProperties.repoOwner.maxItems)) {
        throw new RangeError(`Invalid catalog ${key}`);
      }
      for (const item of [...new Set(value)].sort()) params.append(key, item);
    } else {
      params.set(key, String(value));
    }
  }
  if (page !== undefined) params.set('page', String(page));
  decodeCatalogQueryParams(params);
  return params;
}

const MAX_QUERY_UTF8_BYTES = 512;
const MAX_NORMALIZED_TERMS = 32;

/** Catalog text rules that go beyond JSON Schema string length. */
export function isCatalogQueryTextWithinBounds(value) {
  if (typeof value !== 'string' || !value.trim() || new TextEncoder().encode(value).length > MAX_QUERY_UTF8_BYTES) {
    return false;
  }
  // Keep both normalization passes in the same order as Indexer.
  const query = value.normalize('NFKC').trim().toLowerCase();
  const terms = query.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}\p{M}]+/gu);
  return new Set(terms).size <= MAX_NORMALIZED_TERMS;
}
