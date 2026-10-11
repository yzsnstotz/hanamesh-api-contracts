import type { SqlConnection, SqlPool, SqlExecutor, SqlResult, WriteContext, UnitOfWork, UowErrorResponse } from './definition.js';
export declare const UOW_FIXTURE_LABEL: string;
export interface UowFixtureQuery {
    readonly scope: 'pool' | 'connection'; readonly connection: UowFixtureConnection | null;
    readonly text: string; readonly values?: unknown[];
}
export interface UowFixtureConnection extends SqlConnection {
    readonly queries: UowFixtureQuery[]; releaseCount: number;
}
export interface UnitOfWorkProviderFixture {
    readonly label: string; readonly pool: SqlPool; readonly connections: UowFixtureConnection[];
    readonly poolQueries: UowFixtureQuery[]; readonly unitOfWork: UnitOfWork;
    /** Source identity behavior: with context no transaction controls; otherwise module owns them. */
    moduleWrite<T>(work: (executor: SqlExecutor) => Promise<T>, context?: WriteContext): Promise<T>;
    /** Source custody context shape guard; cannot validate actual transaction/database identity. */
    custodyExecutor(context?: WriteContext): SqlExecutor;
}
export declare function createUnitOfWorkProviderFixture(options?: {
    query?: (call: UowFixtureQuery) => Promise<SqlResult>;
}): UnitOfWorkProviderFixture;
export declare function createUnitOfWorkContractExamples(): {
    label: string; success: string[]; failure: string[]; error: UowErrorResponse;
};
