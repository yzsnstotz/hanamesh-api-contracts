import type {DiscoveryListFields} from '../discovery/index.js';

export type CatalogQuerySort='relevance'|'popular'|'latest'|'stars'|'downloads'|'id'|'trending';
export type CatalogQueryMode='keyword'|'hybrid'|'names';
export interface CatalogQuery {
 readonly ranking?:'plugins';readonly q?:string;readonly searchMode:CatalogQueryMode;readonly sort:CatalogQuerySort;readonly official?:true;
 readonly categories?:readonly string[];readonly source?:string;readonly claim?:'claimed'|'unclaimed';readonly repo?:string;
 /** Exact case-insensitive GitHub owner logins: a nonempty OR-set of at most20 raw entries. */
 readonly repoOwner?:readonly string[];
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
export interface CatalogQueryNames {readonly items:readonly {readonly hanaId:string;readonly name:string;readonly rank:number}[];readonly nextCursor:string|null}
export declare const CATALOG_QUERY_SCHEMA:Readonly<Record<string,unknown>>;
export declare const CATALOG_QUERY_SORTS:readonly CatalogQuerySort[];
export declare const CATALOG_QUERY_MODES:readonly CatalogQueryMode[];
export declare const CATALOG_QUERY_HTTP_PATH: '/v1/host/catalog/query';

export interface CatalogHttpQuery {
  readonly query: CatalogQuery;
  /** One-based direct navigation when no opaque cursor is available. */
  readonly page?: number;
}

export declare function decodeCatalogQueryParams(params: URLSearchParams): CatalogHttpQuery;
export declare function encodeCatalogQueryParams(query: CatalogQuery, options?: { readonly page?: number }): URLSearchParams;

type CatalogChannel = NonNullable<CatalogQuery['channel']>;
interface CatalogNpmOwnership {
  readonly status: 'matched' | 'mismatch' | 'missing-repository' | 'not-found' | 'unchecked';
  readonly repository: string | null;
}
type CatalogInstallTarget =
  | { readonly source: 'npm'; readonly name: string; readonly version: string; readonly allowBuild: readonly string[] }
  | { readonly source: 'github'; readonly repo: string; readonly ref: string; readonly path: string | null; readonly packageName: string; readonly allowBuild: readonly string[] };
export interface CatalogHttpInstallMethod {
  readonly channel: CatalogChannel;
  readonly kind: 'npm' | 'github' | 'agent';
  readonly spec: string;
  readonly command: string | null;
  readonly allowBuild: readonly string[];
  readonly sourceId: string;
  readonly sourceRef: string;
  readonly target?: CatalogInstallTarget;
  readonly targetUnavailableReason?: string;
  readonly npmOwnership?: CatalogNpmOwnership;
}

export interface CatalogHttpCard {
  readonly hanaId: string;
  readonly displayName: string;
  readonly githubRepo: string | null;
  readonly repoSubdirectory: string | null;
  readonly npmPackageName: string | null;
  readonly summary: { readonly en: string | null; readonly zh: string | null };
  readonly categories: readonly string[];
  readonly keywords: readonly string[];
  readonly publisher: { readonly name: string; readonly url: string | null } | null;
  readonly ownerPrincipalId: string | null;
  readonly sourceLinks: readonly { readonly sourceId: string; readonly sourceRef: string; readonly sourceUrl: string; readonly lastSeenAt: string }[];
  readonly official?: boolean;
  readonly channels: readonly CatalogChannel[];
  readonly installMethods: readonly CatalogHttpInstallMethod[];
  readonly oneClickInstall: { readonly allowed: boolean; readonly reason: string | null };
  readonly npmOwnership: CatalogNpmOwnership | null;
  readonly browseOnlyReason: 'no-install-method' | 'unrecognized-install-command' | null;
  readonly suite?: Readonly<Record<string, unknown>>;
  readonly claimStatus?: { readonly state: 'unclaimed' | 'claiming' | 'claimed' | 'on_chain' | 'withdrawable'; readonly claimedByPrincipalId: string | null; readonly firstClaimedAt?: string | null };
  readonly claimStatusError?: string;
  readonly discovery?: DiscoveryListFields;
}

interface CatalogHttpSearchContext {
  readonly searchId: string | null;
  readonly semanticNotice: CatalogSemanticNotice | null;
  readonly paginationReset: boolean;
}

export interface CatalogHttpPage extends CatalogHttpSearchContext {
  readonly kind: 'page';
  readonly page: CatalogQueryPage;
  readonly pageNumber: number;
  readonly limit: number;
  readonly cards: readonly CatalogHttpCard[];
  readonly popularityAsOf: string | null;
}

export interface CatalogHttpNames extends CatalogHttpSearchContext {
  readonly kind: 'names';
  readonly page: CatalogQueryNames;
  readonly cards: readonly CatalogHttpCard[];
}

export type CatalogHttpResponse = CatalogHttpPage | CatalogHttpNames;

/** Semantic's already-authorized candidate IDs in retrieval order (at most50); Indexer resolves stored canonical identities in SQL. */
export interface CatalogQueryCandidates {readonly semanticHanaIds:readonly string[]}
/** Module read port; no SQL, transaction, billing, log or model execution is delegated to Host. */
export interface CatalogQueryReadPort {
 readPage(query:CatalogQuery,candidates?:CatalogQueryCandidates):Promise<CatalogQueryPage>;
 readNames(query:CatalogQuery):Promise<CatalogQueryNames>;
}

/** Checks nonblank text, the 512-byte raw UTF-8 cap and the 32 distinct normalized-term cap. */
export declare function isCatalogQueryTextWithinBounds(value: unknown): value is string;
