import type { UnitOfWork } from '@hanamesh/api-contracts/uow';
import type { FastifyRequest } from 'fastify';
import type { SqlPool } from '@hanamesh/api-contracts/uow';
import type { RegistryProfilePort, SourceAdapter, SourceId } from './contracts.js';
export interface IndexerModuleOptions {
    readonly pool: SqlPool;
    readonly registry: RegistryProfilePort;
    readonly unitOfWork: UnitOfWork;
    readonly actor: string;
    readonly sources: Readonly<Partial<Record<SourceId, SourceAdapter>>>;
    readonly policy: (request: FastifyRequest, requestedSource: string) => boolean | Promise<boolean>;
    readonly now?: () => Date;
    readonly runStaleAfterMs?: number;
    readonly runHeartbeatIntervalMs?: number;
    readonly diagnostic?: (entry: {
        readonly source: string;
        readonly code: string;
        readonly detail: string;
    }) => void;
}
