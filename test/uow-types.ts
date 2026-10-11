import { CONTRACTS } from '@hanamesh/api-contracts';
import { createUnitOfWorkProviderFixture, createUnitOfWorkContractExamples } from '@hanamesh/api-contracts/uow';
import type { UnitOfWork, UnitOfWorkFactory, SqlResult, SqlExecutor, SqlConnection, SqlPool, WriteContext, UowErrorResponse } from '@hanamesh/api-contracts/uow';
import type { SqlResult as IdentitySqlResult, SqlExecutor as IdentitySqlExecutor, SqlConnection as IdentitySqlConnection, SqlPool as IdentitySqlPool, WriteContext as IdentityWriteContext } from '@hanamesh/api-contracts/identity';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type SameResult = Assert<Equal<SqlResult, IdentitySqlResult>>;
type SameExecutor = Assert<Equal<SqlExecutor, IdentitySqlExecutor>>;
type SameConnection = Assert<Equal<SqlConnection, IdentitySqlConnection>>;
type SamePool = Assert<Equal<SqlPool, IdentitySqlPool>>;
type SameContext = Assert<Equal<WriteContext, IdentityWriteContext>>;

const fixture = createUnitOfWorkProviderFixture();
const unitOfWork: UnitOfWork = fixture.unitOfWork;
const pool: SqlPool = fixture.pool;
const factory: UnitOfWorkFactory = (_pool: Pick<SqlPool, 'connect'>) => unitOfWork;
const error: UowErrorResponse = createUnitOfWorkContractExamples().error;
async function consume(): Promise<{value: number}> {
    const connection: SqlConnection = await pool.connect();
    const result: SqlResult = await connection.query('SELECT $1', [1]);
    const rows: Record<string, unknown>[] = result.rows;
    const rowCount: number | null = result.rowCount;
    connection.release();
    // @ts-expect-error SQL result keeps the existing required rowCount
    const invalidResult: SqlResult = {rows: []};
    // @ts-expect-error pool requires connect, a generic executor is insufficient
    const invalidPool: SqlPool = {query: pool.query};
    void rows; void rowCount; void invalidResult; void invalidPool;
    return unitOfWork(async context => {
        const legacy: IdentityWriteContext = context;
        // @ts-expect-error executor remains readonly as published in v0.2.0
        context.executor = pool;
        // @ts-expect-error WriteContext exposes query only, consumers do not own release
        context.executor.release();
        // @ts-expect-error a callback must return a Promise
        void unitOfWork(() => 1);
        await legacy.executor.query('write', []);
        return {value: 1};
    });
}
void consume; void factory; void error; void CONTRACTS['C-UOW'].definition.calls.unitOfWork;
