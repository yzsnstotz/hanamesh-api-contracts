import type { IndexerModuleOptions } from './provider.js';
import type { SourceId, RunResult, IndexerService } from './contracts.js';
import type { SqlPool, UnitOfWork } from '@hanamesh/api-contracts/uow';
import type {RegistryProfilePort} from '@hanamesh/server-registry/contract/fixtures';
import type { FastifyInstance, FastifyPluginAsync, FastifyListenOptions } from 'fastify';
/** Host owns the database, registry, authorization, migration order and resource teardown. */
export interface IndexerComposition extends IndexerModuleOptions {
    readonly close: () => Promise<void>;
    readonly migrate: () => Promise<void>;
}
export interface IndexerCompositionRequest {
    readonly databaseUrl: string;
    readonly purpose: 'index-once' | 'serve' | 'migrate';
}
export type IndexerCompositionFactory = (request: IndexerCompositionRequest) => Promise<IndexerComposition> | IndexerComposition;
export interface IndexerRunner {
    readonly services: IndexerService;
    readonly plugin: FastifyPluginAsync;
    readonly sources: IndexerComposition['sources'];
    readonly actor: string;
    readonly pool: SqlPool;
    readonly registry: RegistryProfilePort;
    readonly unitOfWork: UnitOfWork;
    start(): Promise<void>;
    run(source: SourceId | 'all'): Promise<RunResult[]>;
    serve(server: FastifyInstance, listen: FastifyListenOptions): Promise<void>;
    migrate(): Promise<void>;
    close(): Promise<void>;
}
