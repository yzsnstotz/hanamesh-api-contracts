/** Existing legal defaults. Retry controls affect provider transport only, never semantic validation. */
export declare const SEMANTIC_DEFAULTS: Readonly<{
    providerTimeoutMs: 15000;
    maxRetries: 3;
    retryBaseDelayMs: 250;
    retryBackoffFactor: 2;
    embeddingDimension: 1024;
    httpWindowMs: 60000;
    httpRequestsPerWindow: 30;
    readmeTimeoutMs: 10000;
    readmeResponseBytes: 1048576;
    embeddingFactsPageSize: 200;
    embeddingFactsMaxPageSize: 1000;
}>;
/** Protocol/security constraints: retained API schemas, provider batch shape, and the <=4KB distillate contract. */
export declare const SEMANTIC_LIMITS: Readonly<{
    timerDelayMs: 2147483647;
    readmeDistillateBytes: 4096;
    embeddingBatchSize: 128;
    queryCharacters: 500;
    retrievalTopK: 200;
    recommendMore: 20;
    httpSearchBodyBytes: 16384;
    httpFeedbackBodyBytes: 4096;
}>;
export type SemanticDiagnostic = (event: Record<string, unknown>) => void;
export interface ProviderTransportOptions {
    timeoutMs?: number;
    maxRetries?: number;
    retryBaseDelayMs?: number;
    retryBackoffFactor?: number;
    diagnostic?: SemanticDiagnostic;
}
