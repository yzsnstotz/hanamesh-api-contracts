import schema from './schema.json' with {type:'json'};
export const CATALOG_QUERY_SCHEMA=schema;
export const CATALOG_QUERY_SORTS=Object.freeze(["relevance", "popular", "latest", "stars", "downloads", "id", "trending"]);
export const CATALOG_QUERY_MODES=Object.freeze(['keyword','hybrid','names']);

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
