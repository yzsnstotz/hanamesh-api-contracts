import { type ProviderTransportOptions } from '../configuration.js';
import type { EmbeddingProvider, EmbeddingResult, ProviderMode } from '../contracts.js';
export declare class StubEmbeddingProvider implements EmbeddingProvider {
    readonly name = "stub";
    readonly mode: ProviderMode;
    readonly documentModel = "stub-hash-v1";
    readonly queryModel = "stub-hash-v1";
    readonly dimension: number;
    constructor(options?: {
        dimension?: number;
    });
    private vector;
    private embed;
    embedDocument(texts: readonly string[]): Promise<EmbeddingResult>;
    embedQuery(texts: readonly string[]): Promise<EmbeddingResult>;
}
export interface VoyageOptions extends ProviderTransportOptions {
    apiKey: string;
    dimension?: number;
    endpoint?: string;
    fetcher?: typeof fetch;
    sleep?: (milliseconds: number) => Promise<void>;
    timeoutMs?: number;
    maxRetries?: number;
    documentModel?: string;
    queryModel?: string;
}
export declare class VoyageEmbeddingProvider implements EmbeddingProvider {
    readonly name = "voyage";
    readonly mode: ProviderMode;
    readonly documentModel: string;
    readonly queryModel: string;
    readonly dimension: number;
    private readonly apiKey;
    private readonly endpoint;
    private readonly fetcher;
    private readonly sleep;
    private readonly timeoutMs;
    private readonly maxRetries;
    private readonly retryBaseDelayMs;
    private readonly retryBackoffFactor;
    private readonly diagnostic;
    constructor(options: VoyageOptions);
    private embed;
    embedDocument(texts: readonly string[]): Promise<EmbeddingResult>;
    embedQuery(texts: readonly string[]): Promise<EmbeddingResult>;
}
