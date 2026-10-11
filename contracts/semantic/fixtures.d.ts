import type { FeedbackInput, FeedbackLogInput, NormalizedCapability, PendingEmbedding, QueryLogInput, SearchCandidate, SearchRequest, SemanticRepository, SourceRow, StoredEmbedding } from './contracts.js';
export declare const SEMANTIC_FIXTURE_LABEL = "FIXTURE \u00B7 C-SEMANTIC \u00B7 explicit recorded values/errors; no SQL, source fetching, hash validation or paid model";
export interface SemanticFixtureSeed {
    sourceRows: readonly SourceRow[];
    pending: readonly PendingEmbedding[];
    candidates: readonly SearchCandidate[];
    changed: readonly string[];
}
export interface SemanticContractExamples extends SemanticFixtureSeed {
    label: string;
    request: SearchRequest;
    feedback: FeedbackInput;
}
/** Deterministic independent values for consumer assembly; never an operational provider. */
export declare function createSemanticContractExamples(): SemanticContractExamples;
/** Scripted repository: records writes, returns caller supplied reads, and throws caller supplied failures. */
export declare function createSemanticRepositoryFixture(seed: SemanticFixtureSeed): {
    label: string;
    repository: SemanticRepository;
    failures: Partial<Record<keyof SemanticRepository, Error | undefined>>;
    profiles: NormalizedCapability[];
    embeddings: StoredEmbedding[];
    queryLogs: QueryLogInput[];
    feedbackLogs: FeedbackLogInput[];
    decisions: {
        requestId: string;
        decision: Record<string, unknown>;
        cost: Record<string, unknown>;
    }[];
};
