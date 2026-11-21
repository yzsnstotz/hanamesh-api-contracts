export type CatalogQuerySort='relevance'|'popular'|'latest'|'stars'|'downloads'|'id'|'trending';
export type CatalogQueryMode='keyword'|'hybrid'|'names';
export interface CatalogQuery {
 readonly ranking?:'plugins';readonly q?:string;readonly searchMode:CatalogQueryMode;readonly sort:CatalogQuerySort;readonly official?:true;
 readonly categories?:readonly string[];readonly source?:string;readonly claim?:'claimed'|'unclaimed';readonly repo?:string;
 readonly channel?:'hanamesh'|'claude'|'codex'|'dsh';readonly installable?:true;
 readonly domain?:string;readonly subdivision?:string;readonly includeInsufficient?:boolean;readonly limit:number;readonly after?:string;
}
export interface CatalogQueryItem {
 readonly hanaId:string;readonly rank:number;readonly tier:number;readonly matchKind?:'name'|'meaning';
 readonly authority:number;readonly authorityVersion:string|null;readonly stars:number|null;readonly npmDownloads30d:number|null;readonly updatedAt:string;
}
export interface CatalogQueryFacet {readonly id:string;readonly count:number;readonly capped:boolean}
export interface CatalogQueryPage {
 readonly items:readonly CatalogQueryItem[];readonly total:number;readonly capped:boolean;
 readonly hiddenInsufficientCount:number;readonly hiddenInsufficientCountCapped:boolean;
 readonly facets:Readonly<Record<'categories'|'sources'|'channels'|'domains'|'subdivisions',readonly CatalogQueryFacet[]>>;
 readonly nextCursor:string|null;readonly snapshot:string;readonly policyVersion:number;readonly searchMode:CatalogQueryMode;readonly indexReady:boolean;
}
/** Host supplies an existing SL1 search event ID only for a logged new search; list/anonymous core has no search identity. */
export type CatalogSemanticNotice='SEMANTIC_FREE_QUOTA_EXHAUSTED'|'SEMANTIC_UNAVAILABLE';
export interface CatalogLoggedPage {readonly page:CatalogQueryPage;readonly searchId:string|null;readonly semanticNotice:CatalogSemanticNotice|null}
export interface CatalogQueryNames {readonly items:readonly {readonly hanaId:string;readonly name:string}[];readonly nextCursor:string|null}
export declare const CATALOG_QUERY_SCHEMA:Readonly<Record<string,unknown>>;
export declare const CATALOG_QUERY_SORTS:readonly CatalogQuerySort[];
export declare const CATALOG_QUERY_MODES:readonly CatalogQueryMode[];

/** Semantic's already-authorized candidate IDs in retrieval order (at most50); Indexer resolves stored canonical identities in SQL. */
export interface CatalogQueryCandidates {readonly semanticHanaIds:readonly string[]}
/** Module read port; no SQL, transaction, billing, log or model execution is delegated to Host. */
export interface CatalogQueryReadPort {
 readPage(query:CatalogQuery,candidates?:CatalogQueryCandidates):Promise<CatalogQueryPage>;
 readNames(query:CatalogQuery):Promise<CatalogQueryNames>;
}
