import type { DecisionProvider, EmbeddingProvider, FeedbackInput, ProfileEnricher, RecommendRequest, RecommendResponse, SearchRequest, SearchResponse, SemanticRepository, SourceRow, SemanticUnitOfWork } from './contracts.js';
export interface ServiceOptions {
    repository: SemanticRepository;
    embedding: EmbeddingProvider;
    readmeFetcher: (row: SourceRow) => Promise<string | null>;
    unitOfWork: SemanticUnitOfWork;
    decision?: DecisionProvider;
    fallback?: DecisionProvider;
    decisionTopK?: number;
    minimumConfidence?: number;
    decisionPolicy?: string;
    enricher?: ProfileEnricher;
    now?: () => Date;
    queryCacheTtlMs?: number;
    diagnostic?: (event: Record<string, unknown>) => void;
}
export interface RequestActor {
    kind: 'anon' | 'device' | 'account';
    ref: string | null;
}
export declare function createSemanticService(options: ServiceOptions): Readonly<{
    syncProfiles(input?: {
        since?: Date;
    }): Promise<{
        scanned: number;
        changed: number;
        failed: number;
    }>;
    runEmbeddingJob(): Promise<{
        embedded: number;
        skipped: number;
        failed: number;
    }>;
    search: (input: SearchRequest, actor?: RequestActor) => Promise<SearchResponse>;
    recommend(input: RecommendRequest, actor?: RequestActor): Promise<RecommendResponse>;
    feedback(input: FeedbackInput): Promise<{
        ok: true;
    }>;
}>;
