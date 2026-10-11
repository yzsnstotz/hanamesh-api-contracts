import type { SqlExecutor as ContractSqlExecutor, SqlResult, UnitOfWork } from '../uow/index.js';
import type { IndexerReadService } from '../indexer-catalog/index.js';
export type { RegistryCatalogPort, HanaProfileDTO } from '../catalog/index.js';
export type { IndexerReadService, IndexedHanaWithContentHashDTO } from '../indexer-catalog/index.js';
export type { UnitOfWork, WriteContext } from '../uow/index.js';
/** Host supplies the published read port. No product source implementation is imported. */
export type SemanticSourcePort = Pick<IndexerReadService, 'listItems' | 'getItem'>;
/** Legacy executor callback is retained; formal C-UOW is adapted explicitly. */
export type SemanticUnitOfWork = <T>(work: (executor: SqlExecutor) => Promise<T>) => Promise<T>;
export declare function bridgeSemanticUnitOfWork(unitOfWork: UnitOfWork): SemanticUnitOfWork;
export type CapabilityType = 'dsh_plugin' | 'hana' | 'harness' | 'tool' | 'skill' | 'model' | 'workspace' | 'a2a_service' | 'future_capability';
export type ProviderMode = 'real' | 'stub';
/** Compatibility surface derived from the formal executor/result: readonly parameters and optional rowCount remain supported. */
export interface SqlExecutor {
    query(text: Parameters<ContractSqlExecutor['query']>[0], values?: readonly unknown[]): Promise<Omit<SqlResult, 'rowCount'> & Partial<Pick<SqlResult, 'rowCount'>>>;
}
export interface SourceRow {
    hanaId: string;
    sourceId: string;
    sourceRef: string;
    name: string;
    kind: string;
    githubRepo: string | null;
    homepage: string | null;
    npmPackageName: string | null;
    summaryEn: string | null;
    summaryZh: string | null;
    license: string | null;
    categories: readonly string[];
    keywords: readonly string[];
    repoUrl: string | null;
    repoSubdirectory: string | null;
    contentHash: string;
    updatedAt: string;
    cachedReadme?: string;
}
export interface NormalizerInput {
    name: string;
    summary: string;
    categories: readonly string[];
    keywords: readonly string[];
    readme: string;
}
export interface CapabilityProfile {
    name: string;
    purpose: string;
    capabilities: string[];
    suitableTasks: string[];
    inputs: string[];
    outputs: string[];
    runtime: string[];
    interfaces: string[];
    semanticDescription: string;
    readme: string;
}
export interface CapabilityMetadata {
    npmPackageName?: string;
    githubRepo?: string;
    categories: string[];
    license?: string;
    runtime: string[];
    os: string[];
    interfaces: string[];
    available: boolean;
    installed: boolean;
    sourceContentHash: string;
}
export interface NormalizedCapability {
    object: {
        id: string;
        type: CapabilityType;
        sourceKind: string;
        sourceRef: string;
        hanaId: string | null;
    };
    profile: CapabilityProfile;
    metadata: CapabilityMetadata;
    semanticHash: string;
}
export interface EmbeddingResult {
    vectors: number[][];
    model: string;
    usage: {
        tokens: number;
    };
}
export interface EmbeddingProvider {
    readonly name: string;
    readonly mode: ProviderMode;
    readonly documentModel: string;
    readonly queryModel: string;
    readonly dimension: number;
    embedDocument(texts: readonly string[]): Promise<EmbeddingResult>;
    embedQuery(texts: readonly string[]): Promise<EmbeddingResult>;
}
export interface PendingEmbedding {
    objectId: string;
    profile: CapabilityProfile;
    semanticHash: string;
}
export interface StoredEmbedding {
    objectId: string;
    provider: string;
    model: string;
    dimension: number;
    vector: readonly number[];
    semanticHash: string;
    tokens: number;
}
export interface SearchCandidate {
    objectId: string;
    hanaId: string;
    type: 'dsh_plugin';
    name: string;
    score: number;
    summary: string;
    capabilities: string[];
    metadata: {
        npmPackageName?: string;
        githubRepo?: string;
        categories: string[];
        license?: string;
        runtime: string[];
        os?: string[];
        installed: boolean;
        available?: boolean;
    };
}
export interface SearchRequest {
    query: string;
    type?: 'dsh_plugin';
    context?: {
        runtime?: 'local' | 'cloud';
        os?: 'macos' | 'linux' | 'windows';
        arch?: string;
        dshVersion?: string;
        installed?: string[];
        locale?: 'zh' | 'en' | 'ja';
    };
    constraints?: {
        localOnly?: boolean;
        free?: boolean;
        noShell?: boolean;
        license?: string[];
        excludeInstalled?: boolean;
    };
    topK?: number;
    telemetry?: boolean;
}
export interface RecommendRequest extends SearchRequest {
    more?: number;
}
export interface SearchResponse {
    candidates: SearchCandidate[];
    retrieval: {
        provider: string;
        model: string;
        topK: number;
        filtered: number;
        mode: ProviderMode;
    };
    requestId: string;
}
export interface DecisionSelection {
    objectId: string;
    rank: number;
    confidence: number;
    reasons: string[];
}
export interface DecisionResult {
    selected: DecisionSelection[];
    alternatives: DecisionSelection[];
    noMatch: boolean;
    confidence: number;
    usage: {
        tokens: number;
    };
    raw?: unknown;
}
export interface DecisionInput {
    request: SearchRequest;
    candidates: readonly SearchCandidate[];
    policy: string;
}
export interface DecisionProvider {
    readonly name: string;
    readonly mode: ProviderMode;
    choose(input: DecisionInput): Promise<DecisionResult>;
    rank?(input: DecisionInput): Promise<DecisionResult>;
    score?(input: DecisionInput): Promise<DecisionResult>;
}
export interface RecommendationItem {
    objectId: string;
    hanaId: string;
    name: string;
    matchPercent: number;
    reasons: string[];
    checks: {
        label: string;
        ok: boolean;
    }[];
    install: {
        kind: 'dsh_plugin' | 'hanamesh_app' | 'none';
        command?: string;
        libraryUrl?: string;
    };
    detailsUrl: string;
}
export interface RecommendResponse {
    recommendation: {
        primary: RecommendationItem | null;
        alternatives: RecommendationItem[];
        noMatch: boolean;
        confidence: number;
    };
    candidates: SearchCandidate[];
    meta: {
        requestId: string;
        latencyMs: number;
        providers: {
            embedding: {
                name: string;
                mode: ProviderMode;
            };
            decision: {
                name: string;
                mode: ProviderMode;
            };
        };
    };
}
export interface FeedbackInput {
    requestId: string;
    objectId: string;
    action: 'select' | 'install' | 'open' | 'dismiss';
}
export interface FeedbackLogInput extends FeedbackInput {
    id: string;
    at: string;
}
export interface QueryLogInput {
    id: string;
    at: string;
    actorKind: 'anon' | 'device' | 'account';
    actorRef: string | null;
    queryHash: string;
    queryText: string | null;
    context: Record<string, unknown>;
    constraints: Record<string, unknown>;
    retrieval: Record<string, unknown>;
    decision: null;
    latencyMs: number;
    cost: Record<string, unknown>;
}
export interface SemanticRepository {
    listSourceRows(since?: string): Promise<readonly SourceRow[]>;
    upsertProfiles(executor: SqlExecutor, values: readonly NormalizedCapability[]): Promise<readonly string[]>;
    listPendingEmbeddings(provider: string, model: string): Promise<readonly PendingEmbedding[]>;
    upsertEmbeddings(executor: SqlExecutor, values: readonly StoredEmbedding[]): Promise<void>;
    search(executor: SqlExecutor | undefined, input: {
        vector: readonly number[];
        topK: number;
        type: 'dsh_plugin';
        provider: string;
        model: string;
        context: SearchRequest['context'];
        constraints: SearchRequest['constraints'];
    }): Promise<readonly SearchCandidate[]>;
    logQuery(executor: SqlExecutor, row: QueryLogInput): Promise<void>;
    updateQueryDecision(executor: SqlExecutor, row: {
        requestId: string;
        decision: Record<string, unknown>;
        cost: Record<string, unknown>;
    }): Promise<void>;
    logFeedback(executor: SqlExecutor, row: FeedbackLogInput): Promise<void>;
}
export interface ProfileEnricher {
    enrich(profile: CapabilityProfile, row: SourceRow): Promise<CapabilityProfile>;
}
export declare const identityProfileEnricher: ProfileEnricher;
