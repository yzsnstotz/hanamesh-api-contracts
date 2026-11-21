import schema from './schema.json' with {type:'json'};
export const CATALOG_QUERY_SCHEMA=schema;
export const CATALOG_QUERY_SORTS=Object.freeze(["relevance", "popular", "latest", "stars", "downloads"]);
export const CATALOG_QUERY_MODES=Object.freeze(['keyword','hybrid','names']);
