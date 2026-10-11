export const UOW_FIXTURE_LABEL = 'FIXTURE · C-UOW command recorder; no SQL, real database or concurrency';
function fixtureError(name, code, statusCode) {
    const error = new Error(code);
    Object.assign(error, {name, code, statusCode});
    return error;
}
/** Host source control flow, with TypeScript syntax erased. Fixture only. */
function createUnitOfWork(pool) {
    return async function unitOfWork(work) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            try {
                const result = await work({executor: client});
                await client.query('COMMIT');
                return result;
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            }
        } finally {
            client.release();
        }
    };
}
/** Identity runWrite control flow, including its distinct rollback-error handling. Fixture only. */
async function runWrite(pool, external, work) {
    if (external !== undefined) {
        if (!external || typeof external.query !== 'function') throw fixtureError('IdentityError', 'IDENTITY_INPUT_INVALID', 400);
        return work(external);
    }
    const connection = await pool.connect();
    let began = false;
    try {
        await connection.query('BEGIN');
        began = true;
        const value = await work(connection);
        await connection.query('COMMIT');
        return value;
    } catch (error) {
        if (began) {
            try { await connection.query('ROLLBACK'); } catch { /* Identity retains the original failure. */ }
        }
        throw error;
    } finally { connection.release(); }
}
/** Minimal pool/connection stand-in. Each connect acquires a fresh recorded connection. */
export function createUnitOfWorkProviderFixture({query = async () => ({rows: [], rowCount: null})} = {}) {
    const connections = [];
    const poolQueries = [];
    const pool = {
        async query(text, values) {
            const call = {scope: 'pool', connection: null, text, values};
            poolQueries.push(call);
            return query(call);
        },
        async connect() {
            const connection = {
                queries: [], releaseCount: 0,
                async query(text, values) {
                    const call = {scope: 'connection', connection, text, values};
                    connection.queries.push(call);
                    return query(call);
                },
                release() { connection.releaseCount++; },
            };
            connections.push(connection);
            return connection;
        },
    };
    return {
        label: UOW_FIXTURE_LABEL, pool, connections, poolQueries,
        unitOfWork: createUnitOfWork(pool),
        moduleWrite(work, context) { return runWrite(pool, context?.executor, work); },
        custodyExecutor(context) {
            if (!context?.executor || typeof context.executor.query !== 'function') {
                throw fixtureError('CustodyError', 'CUSTODY_HOST_TRANSACTION_REQUIRED', 500);
            }
            return context.executor;
        },
    };
}
export function createUnitOfWorkContractExamples() {
    return {
        label: UOW_FIXTURE_LABEL,
        success: ['BEGIN', 'identity write', 'custody write', 'COMMIT', 'release'],
        failure: ['BEGIN', 'write', 'ROLLBACK', 'release'],
        error: {error: {code: 'CUSTODY_HOST_TRANSACTION_REQUIRED', message: 'CUSTODY_HOST_TRANSACTION_REQUIRED'}},
    };
}
