import type {FastifyPluginAsync} from 'fastify';
import type {DecisionProvider, ProfileEnricher, ProviderMode, SemanticRepository, SemanticSourcePort, SemanticUnitOfWork, SourceRow, SqlExecutor, EmbeddingProvider} from './contracts.js';
import type {createSemanticService} from './service.js';
export interface SemanticModuleOptions {
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
export declare function fetchCapabilityReadme(row: SourceRow, options?: {
    fetcher?: typeof fetch;
    timeoutMs?: number;
}): Promise<string | null>;
export declare function createSemanticModule(options: SemanticModuleOptions): SemanticModule;
