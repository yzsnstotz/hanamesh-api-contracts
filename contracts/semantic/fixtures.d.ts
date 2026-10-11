import type { FeedbackInput, FeedbackLogInput, NormalizedCapability, PendingEmbedding, QueryLogInput, SearchCandidate, SearchRequest, SemanticRepository, SemanticEmbeddingFact, SemanticEmbeddingFactsRepository, SourceRow, StoredEmbedding } from './contracts.js';
export declare const SEMANTIC_FIXTURE_LABEL = "FIXTURE \u00B7 C-SEMANTIC \u00B7 explicit recorded values/errors; no SQL, source fetching, hash validation or paid model";
export interface SemanticFixtureSeed {
    sourceRows: readonly SourceRow[];
    pending: readonly PendingEmbedding[];
    candidates: readonly SearchCandidate[];
    changed: readonly string[];
}
export declare const SEMANTIC_EMBEDDING_FACTS_FIXTURE_LABEL = "FIXTURE \u00B7 current Semantic embedding facts \u00B7 recorded reads only; no Registry denominator, SQL, historical first time or model";
export interface SemanticEmbeddingFactsExamples {
    label: string;
    all: readonly SemanticEmbeddingFact[];
    exact: readonly {
        provider: string;
        model: string;
        items: readonly SemanticEmbeddingFact[];
    }[];
}
export declare function createSemanticEmbeddingFactsExamples(): SemanticEmbeddingFactsExamples;
/** Separate new fixture preserves the original formal fixture bytes/shape. Never used by module defaults. */
export declare function createSemanticEmbeddingFactsFixture(seed: SemanticEmbeddingFactsExamples): {
    label: string;
    repository: SemanticEmbeddingFactsRepository;
    calls: {
        afterHanaId: string | null;
        limit: number;
        selection: import("./contracts.js").SemanticEmbeddingSelection;
    }[];
    failures: {
        listEmbeddingFacts?: Error;
    };
};
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
