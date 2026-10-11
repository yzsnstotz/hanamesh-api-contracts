import type { SemanticEmbeddingFactsReader, SemanticEmbeddingFactsRepository } from './contracts.js';
export interface SemanticEmbeddingFactsOptions {
    repository: Partial<SemanticEmbeddingFactsRepository>;
    pageSize?: number;
    maxPageSize?: number;
}
/** Trusted in-process host port. No HTTP route, credentials, model call, UOW write or cross-schema SQL. */
export declare function createSemanticEmbeddingFactsReader(options: SemanticEmbeddingFactsOptions): SemanticEmbeddingFactsReader;
