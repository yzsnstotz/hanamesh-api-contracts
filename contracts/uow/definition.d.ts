import type { SqlPool, WriteContext } from '../identity/index.js';
export type { SqlResult, SqlExecutor, SqlConnection, SqlPool, WriteContext } from '../identity/index.js';
/** Exact host callback signature. Result resolves after COMMIT, never before it. */
export type UnitOfWork = <T>(work: (context: WriteContext) => Promise<T>) => Promise<T>;
/** Structural version of host createUnitOfWork(Pick<pg.Pool, 'connect'>). Type only; no production factory here. */
export type UnitOfWorkFactory = (pool: Pick<SqlPool, 'connect'>) => UnitOfWork;
export declare const UOW_ERROR_CODES: readonly ['CUSTODY_HOST_TRANSACTION_REQUIRED'];
export type UowErrorCode = typeof UOW_ERROR_CODES[number];
/** Existing custody error JSON subset. C-UOW is server-only; it has no new wire DTO/schema. */
export interface UowErrorResponse { readonly error: { readonly code: UowErrorCode; readonly message: string } }
export declare const UOW_CONTRACT_DEFINITION: {
    readonly id: 'C-UOW'; readonly service: 'UnitOfWork';
    readonly calls: Readonly<Record<'unitOfWork' | 'custodyTransaction', {
        readonly input: string; readonly output: string; readonly errors: readonly UowErrorCode[];
        readonly errorChannel: string; readonly note: string;
    }>>;
    readonly invariants: readonly string[];
};
