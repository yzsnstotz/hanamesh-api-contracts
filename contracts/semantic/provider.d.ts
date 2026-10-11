import { type SemanticDiagnostic } from './configuration.js';
import type { FastifyPluginAsync } from 'fastify';
import type { DecisionProvider, ProfileEnricher, ProviderMode, SemanticRepository, SemanticSourcePort, SemanticUnitOfWork, SourceRow, SqlExecutor } from './contracts.js';
import type { EmbeddingProvider } from './contracts.js';
import { createSemanticService } from './service.js';
import type { SemanticEmbeddingFactsReader, SemanticEmbeddingFactsRepository } from './contracts.js';
export interface SemanticModuleOptions {
    embeddingFactsRepository?: SemanticEmbeddingFactsRepository;
    embeddingFactsPageSize?: number;
    embeddingFactsMaxPageSize?: number;
    pool: SqlExecutor;
    unitOfWork: SemanticUnitOfWork;
    sourceCatalog?: SemanticSourcePort;
    embedding: EmbeddingProvider;
    allowedOrigins: readonly string[];
    decision?: DecisionProvider;
    fallback?: DecisionProvider;
    decisionTopK?: number;
    minimumConfidence?: number;
    decisionPolicy?: string;
    rateLimitPerMinute?: number;
    rateLimitWindowMs?: number;
    readmeTimeoutMs?: number;
    readmeMaxBytes?: number;
    actorResolver?: (request: unknown) => {
        kind: 'anon' | 'device' | 'account';
        ref: string;
    } | Promise<{
        kind: 'anon' | 'device' | 'account';
        ref: string;
    }>;
    readmeFetcher?: (row: SourceRow) => Promise<string | null>;
    enricher?: ProfileEnricher;
    repository?: SemanticRepository;
    diagnostic?: (event: Record<string, unknown>) => void;
}
export interface SemanticModule {
    plugin: FastifyPluginAsync;
    services: ReturnType<typeof createSemanticService>;
    mode: ProviderMode;
}
export interface ReadmeFetchOptions {
    fetcher?: typeof fetch;
    timeoutMs?: number;
    maxBytes?: number;
    diagnostic?: SemanticDiagnostic;
}
export declare function fetchCapabilityReadme(row: SourceRow, options?: ReadmeFetchOptions): Promise<string | null>;
export declare function createSemanticModule(options: SemanticModuleOptions): SemanticModule;
