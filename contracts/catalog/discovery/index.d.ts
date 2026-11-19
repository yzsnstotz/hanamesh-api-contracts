export declare const DISCOVERY_SCHEMA: object;
export declare const DISCOVERY_RULES_VERSION: 'hanamesh-initial-v1';
export declare const DISCOVERY_TAXONOMY_VERSION: 'hanamesh-discovery-taxonomy-v1';
export interface DiscoverySource {readonly sourceUrl:string;readonly observedAt:string}
export interface DiscoveryEvidence extends DiscoverySource {readonly key:string;readonly quote?:string}
export interface DiscoveryLocalizedText {readonly zh:string;readonly en:string;readonly ja:string}
export interface DiscoveryFact {readonly value:unknown;readonly evidence:readonly DiscoveryEvidence[]}
export type DiscoveryFactKey='audience'|'difficulty'|'difficultyReason'|'apiKey'|'commandLine'|'selfHostedService'|'installation'|'examples'|'localFileRead'|'localFileWrite'|'network'|'paidAccount'|'scenarioTags';
export interface DiscoveryOverview {readonly does:DiscoveryLocalizedText|null;readonly facts:Readonly<Partial<Record<DiscoveryFactKey,DiscoveryFact>>>;readonly evidence:readonly DiscoveryEvidence[]}
export interface DiscoveryScoreCheck {readonly key:string;readonly dimension:'quality'|'popularity'|'maintenance';readonly weight:number;readonly normalized:number|null;readonly value:unknown;readonly state:'observed'|'missing';readonly reason:string|null}
export interface DiscoveryScore {readonly checks:readonly DiscoveryScoreCheck[];readonly status:'scored'|'insufficient';readonly total:number|null;readonly scale:100;readonly displayTotal:number|null;readonly displayScale:10;readonly dimensions:Readonly<Record<'quality'|'popularity'|'maintenance',number|null>>;readonly coverage:number;readonly missing:readonly {readonly key:string;readonly reason:string}[];readonly evidence:readonly DiscoveryEvidence[];readonly rulesVersion:'hanamesh-initial-v1';readonly assessedAt:string}
export interface DiscoveryTrustBadge {readonly kind:'official'|'author-claimed'|'installation-tested'|'recent-maintenance';readonly sources:readonly DiscoverySource[]}
export interface DiscoverySimilarGroup {readonly id:string;readonly kind:'fork'|'manual';readonly members:readonly string[];readonly sources:readonly DiscoverySource[]}
export interface DiscoveryFeatured {readonly domainId:string;readonly rank:number}
/** List/search use these fields. Unknown facts are null/empty. Host alone composes Registry claim evidence. */
export interface DiscoveryListFields {readonly domainIds:readonly string[];readonly subdivisions:readonly string[];readonly taxonomyVersion:'hanamesh-discovery-taxonomy-v1';readonly overview:DiscoveryOverview|null;readonly score:DiscoveryScore;readonly trustBadges:readonly DiscoveryTrustBadge[];readonly featured:readonly DiscoveryFeatured[];readonly similarGroup:DiscoverySimilarGroup|null}
export interface DiscoveryReason {readonly text:DiscoveryLocalizedText;readonly evidence:readonly DiscoveryEvidence[]}
/** Recommendation reasons never appear in list/search DTOs. */
export interface DiscoveryDetailFields extends DiscoveryListFields {readonly reasons:readonly DiscoveryReason[]}
export interface DiscoveryFacet {readonly id:string;readonly name:string;readonly count:number}
export interface DiscoveryPage<T extends {readonly hanaId:string}={readonly hanaId:string}> {readonly items:readonly (T & DiscoveryListFields)[];readonly next:string|null;readonly total:number;readonly hiddenInsufficientCount:number;readonly domains:readonly DiscoveryFacet[];readonly subdivisions:readonly DiscoveryFacet[];readonly phase:'early'|'growth'}
