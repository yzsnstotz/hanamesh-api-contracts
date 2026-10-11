/** Existing server-only host transaction port; not an HTTP API. */
export const UOW_ERROR_CODES = Object.freeze(['CUSTODY_HOST_TRANSACTION_REQUIRED']);
export const UOW_CONTRACT_DEFINITION = Object.freeze({
    id: 'C-UOW',
    service: 'UnitOfWork',
    calls: Object.freeze({
        unitOfWork: Object.freeze({
            input: '(context: WriteContext) => Promise<T>', output: 'Promise<T>', errors: Object.freeze([]),
            errorChannel: 'rejected Promise; callback and SQL errors propagate',
            note: 'Acquire once; BEGIN; work({executor: connection}); COMMIT on success; callback/COMMIT rejection attempts ROLLBACK; finally release. No pool.query is used. BEGIN failure releases without ROLLBACK. ROLLBACK or release failure may replace the original error. connect failure acquires no connection.',
        }),
        custodyTransaction: Object.freeze({
            input: 'WriteContext', output: 'SqlExecutor', errors: UOW_ERROR_CODES,
            errorChannel: 'custody service/store throws an error with code and statusCode 500',
            note: 'Custody requires context.executor with a query function. This error belongs to custody, not the host UnitOfWork. Shape checks do not prove a transaction or same-database connection.',
        }),
    }),
    invariants: Object.freeze([
        'WriteContext is trusted server-only and must contain an already-BEGINed, pinned connection from the SAME database used by the participating modules.',
        'All participating writes must use the identical context.executor; host alone owns COMMIT/ROLLBACK/release for a host-supplied context.',
        'A module that opens its own transaction owns its COMMIT/ROLLBACK/release.',
        'SqlPool.query is not a pinned connection. Structural types do not prove transaction state, database identity or exclusive ownership.',
    ]),
});
