import type {LocalizedText} from '@hanamesh/api-contracts/catalog/localized';
export declare const DISCOVERY_SCHEMA: object;
export declare const DISCOVERY_RULES_VERSION: 'hanamesh-initial-v1';
export declare const DISCOVERY_TAXONOMY_VERSION: 'hanamesh-discovery-taxonomy-v1';
export interface DiscoverySource {readonly sourceUrl:string;readonly observedAt:string}
export interface DiscoveryEvidence extends DiscoverySource {readonly key:string;readonly quote?:string}
export interface DiscoveryFact<T=unknown> {readonly value:T;readonly evidence:readonly DiscoveryEvidence[]}
export type DiscoveryFactKey='audience'|'difficulty'|'difficultyReason'|'apiKey'|'commandLine'|'selfHostedService'|'installation'|'examples'|'localFileRead'|'localFileWrite'|'network'|'paidAccount'|'scenarioTags';
export interface DiscoveryOverview {readonly does:LocalizedText|null;readonly facts:Readonly<Partial<Record<Exclude<DiscoveryFactKey,'audience'|'difficultyReason'>,DiscoveryFact>> & {readonly audience?:DiscoveryFact<LocalizedText|null>;readonly difficultyReason?:DiscoveryFact<LocalizedText|null>}>;readonly evidence:readonly DiscoveryEvidence[]}
export interface DiscoveryScoreCheck {readonly key:string;readonly dimension:'quality'|'popularity'|'maintenance';readonly weight:number;readonly normalized:number|null;readonly value:unknown;readonly state:'observed'|'missing';readonly reason:string|null}
export interface DiscoveryScore {readonly checks:readonly DiscoveryScoreCheck[];readonly status:'scored'|'insufficient';readonly total:number|null;readonly scale:100;readonly displayTotal:number|null;readonly displayScale:10;readonly displayDecimals:1;readonly displayDimensions:Readonly<Record<'quality'|'popularity'|'maintenance',number|null>>;readonly dimensionWeights:{readonly quality:30;readonly popularity:35;readonly maintenance:35};readonly dimensions:Readonly<Record<'quality'|'popularity'|'maintenance',number|null>>;readonly coverage:number;readonly missing:readonly {readonly key:string;readonly reason:string}[];readonly evidence:readonly DiscoveryEvidence[];readonly rulesVersion:'hanamesh-initial-v1';readonly assessedAt:string}
export interface DiscoveryTrustBadge {readonly kind:'official'|'author-claimed'|'installation-tested'|'recent-maintenance';readonly sources:readonly DiscoverySource[]}
export interface DiscoverySimilarGroup {readonly id:string;readonly kind:'fork'|'manual';readonly members:readonly string[];readonly sources:readonly DiscoverySource[]}
export interface DiscoveryFeatured {readonly domainId:string;readonly rank:number}
/** List/search use these fields. Unknown facts are null/empty. Host alone composes Registry claim evidence. */
/** Completed per-item projection; a page/directory watermark is the greatest published row version, not a whole-catalog freshness guarantee. */
export interface DiscoveryProjection {readonly watermark:string|null;readonly assessedAt:string|null;readonly rulesVersion:'hanamesh-initial-v1';readonly projectionAt:string|null}
export interface DiscoveryListFields {readonly projection:DiscoveryProjection;readonly domainIds:readonly string[];readonly subdivisions:readonly string[];readonly taxonomyVersion:'hanamesh-discovery-taxonomy-v1';readonly overview:DiscoveryOverview|null;readonly score:DiscoveryScore;readonly trustBadges:readonly DiscoveryTrustBadge[];readonly featured:readonly DiscoveryFeatured[];readonly similarGroup:DiscoverySimilarGroup|null}
export interface DiscoveryReason {readonly text:LocalizedText;readonly evidence:readonly DiscoveryEvidence[]}
/** Recommendation reasons never appear in list/search DTOs. */
export interface DiscoveryDetailFields extends DiscoveryListFields {readonly reasons:readonly DiscoveryReason[];readonly rating?:CatalogRatingV1}
export interface DiscoveryFacet {readonly id:string;readonly name:LocalizedText;readonly count:number;readonly capped:boolean}
export interface DiscoveryPage<T extends {readonly hanaId:string}={readonly hanaId:string}> {readonly projection:DiscoveryProjection;readonly capped:boolean;readonly items:readonly (T & DiscoveryListFields)[];readonly next:string|null;readonly total:number;readonly domains:readonly DiscoveryFacet[];readonly subdivisions:readonly DiscoveryFacet[];readonly phase:'early'|'growth';readonly window?:{readonly capped:boolean;readonly countsCapped:boolean;readonly indexReady:boolean}}

export interface DiscoveryQuery {readonly domain?:string;readonly subdivision?:string;readonly channel?:'hanamesh'|'claude'|'codex'|'dsh';readonly search?:string;readonly sort?:'authority';readonly limit:number;readonly after?:string}

export interface DiscoveryDomainDirectory {readonly projection:DiscoveryProjection;readonly taxonomyVersion:'hanamesh-discovery-taxonomy-v1';readonly domains:readonly (DiscoveryFacet & {readonly subdivisions:readonly DiscoveryFacet[]})[]}
export interface DiscoveryStageConfig {readonly phase:'early'|'growth';readonly showPlatformData:boolean}

export type CatalogRatingDimensionId = 'onboarding' | 'documentation' | 'maintenance' | 'safety' | 'popularity';
export interface CatalogRatingDimension {readonly score:number|null;readonly reason:string}
export interface CatalogRatingEvidence {
  readonly section:CatalogRatingDimensionId|'copy'|'strongest'|'weakest';
  readonly point:string;
  readonly sources:readonly {readonly path:string;readonly lines:string;readonly quote:string;readonly url:string}[];
}
export interface CatalogRatingV1 {
  readonly version:1;
  readonly language:'zh';
  readonly repository:string;
  readonly directory:string;
  readonly revision:string;
  readonly overview:{readonly what:string;readonly helps:string;readonly howToStart:string;readonly who:string};
  readonly oneLiner:string;
  readonly total:number|null;
  readonly unratedReason:string|null;
  readonly dimensions:Readonly<Record<CatalogRatingDimensionId,CatalogRatingDimension>>;
  readonly popularity:{readonly stars:number|null;readonly downloads30d:number|null;readonly pushedAt:string|null};
  readonly recommendation:string;
  readonly cautions:readonly string[];
  readonly verdict:string;
  readonly evidence:readonly CatalogRatingEvidence[];
  readonly basisNote:string|null;
}
export interface CatalogRatingBatch {
  readonly key:string;
  readonly items:readonly {readonly hanaId:string;readonly rating:CatalogRatingV1}[];
}
export interface CatalogRatingBatchReceipt {
  readonly key:string;
  readonly payloadSha256:string;
  readonly importedAt:string;
  readonly items:readonly {readonly hanaId:string;readonly status:'stored'|'unchanged'}[];
}
