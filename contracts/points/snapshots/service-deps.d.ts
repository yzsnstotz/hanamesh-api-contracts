import type { CustodyIdentityPort, SqlPool, UnitOfWork } from '../provider.js';
import type { SnapshotPorts, SnapshotService } from './contracts.js';
/** Existing snapshot factory dependencies, named for host composition. */
export interface SnapshotServiceDeps {
    pool: SqlPool;
    identity: CustodyIdentityPort;
    unitOfWork: UnitOfWork;
    ports: SnapshotPorts;
    now: () => Date;
    randomUUID: () => string;
}
