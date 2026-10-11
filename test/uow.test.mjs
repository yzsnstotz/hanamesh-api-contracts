import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTRACTS } from '@hanamesh/api-contracts';

test('C-UOW is published from a dedicated server-only entry', () => {
    assert.ok(CONTRACTS['C-UOW'], 'missing C-UOW contract');
    assert.equal(CONTRACTS['C-UOW'].entry, '@hanamesh/api-contracts/uow');
});

async function uow() {
    const module = await import('@hanamesh/api-contracts/uow');
    assert.equal(typeof module.createUnitOfWorkProviderFixture, 'function');
    return module;
}
const texts = connection => connection.queries.map(q => q.text);

test('C-UOW uses one acquired connection for BEGIN, callback writes, COMMIT and release', async () => {
    const {createUnitOfWorkProviderFixture} = await uow();
    const f = createUnitOfWorkProviderFixture();
    assert.match(f.label, /^FIXTURE/);
    const result = await f.unitOfWork(async context => {
        assert.equal(context.executor, f.connections[0]);
        assert.deepEqual(texts(f.connections[0]), ['BEGIN']);
        assert.equal(f.connections[0].releaseCount, 0);
        await f.moduleWrite(async executor => {
            assert.equal(executor, context.executor);
            await executor.query('identity write', ['example']);
        }, context);
        await f.custodyExecutor(context).query('custody write');
        assert.deepEqual(texts(f.connections[0]), ['BEGIN', 'identity write', 'custody write']);
        assert.equal(f.connections[0].releaseCount, 0);
        return {ok: true};
    });
    assert.deepEqual(result, {ok: true});
    assert.deepEqual(texts(f.connections[0]), ['BEGIN', 'identity write', 'custody write', 'COMMIT']);
    assert.equal(f.connections.length, 1);
    assert.equal(f.connections[0].releaseCount, 1);
    assert.deepEqual(f.poolQueries, []);
});

test('C-UOW callback failure rolls back on the same connection and releases, preserving the error', async () => {
    const f = (await uow()).createUnitOfWorkProviderFixture();
    const failure = new Error('callback failed');
    await assert.rejects(f.unitOfWork(async context => {
        await context.executor.query('write');
        throw failure;
    }), error => error === failure);
    assert.deepEqual(texts(f.connections[0]), ['BEGIN', 'write', 'ROLLBACK']);
    assert.equal(f.connections[0].releaseCount, 1);
});

for (const phase of ['BEGIN', 'COMMIT', 'ROLLBACK']) {
    test(`C-UOW ${phase} failure follows host catch/finally boundaries`, async () => {
        const failure = new Error(`${phase} failed`);
        let called = false;
        const f = (await uow()).createUnitOfWorkProviderFixture({query: async ({text}) => {
            if (text === phase) throw failure;
            return {rows: [], rowCount: null};
        }});
        await assert.rejects(f.unitOfWork(async () => {
            called = true;
            if (phase === 'ROLLBACK') throw new Error('work failed');
            return 'ok';
        }), error => error === failure);
        assert.equal(called, phase !== 'BEGIN');
        assert.deepEqual(texts(f.connections[0]), phase === 'BEGIN' ? ['BEGIN'] :
            phase === 'COMMIT' ? ['BEGIN', 'COMMIT', 'ROLLBACK'] : ['BEGIN', 'ROLLBACK']);
        assert.equal(f.connections[0].releaseCount, 1);
    });
}

test('C-UOW module-owned transactions commit/rollback and release their own connections', async () => {
    const f = (await uow()).createUnitOfWorkProviderFixture();
    assert.equal(await f.moduleWrite(async executor => {
        await executor.query('module write');
        return 7;
    }), 7);
    const failure = new Error('module failed');
    await assert.rejects(f.moduleWrite(async executor => {
        await executor.query('module write');
        throw failure;
    }), error => error === failure);
    assert.deepEqual(f.connections.map(texts), [['BEGIN', 'module write', 'COMMIT'], ['BEGIN', 'module write', 'ROLLBACK']]);
    assert.deepEqual(f.connections.map(c => c.releaseCount), [1, 1]);
    assert.notEqual(f.connections[0], f.connections[1]);
});

test('C-UOW module failure inside host context leaves rollback/release exclusively to host', async () => {
    const f = (await uow()).createUnitOfWorkProviderFixture();
    const failure = new Error('module failed');
    await assert.rejects(f.unitOfWork(async context => {
        await assert.rejects(f.moduleWrite(async executor => {
            await executor.query('module write');
            throw failure;
        }, context), error => error === failure);
        assert.deepEqual(texts(f.connections[0]), ['BEGIN', 'module write']);
        assert.equal(f.connections[0].releaseCount, 0);
        throw failure;
    }), error => error === failure);
    assert.deepEqual(texts(f.connections[0]), ['BEGIN', 'module write', 'ROLLBACK']);
    assert.equal(f.connections[0].releaseCount, 1);
});

test('C-UOW custody missing context/executor/query is CUSTODY_HOST_TRANSACTION_REQUIRED (500)', async () => {
    const {createUnitOfWorkProviderFixture, UOW_ERROR_CODES, createUnitOfWorkContractExamples} = await uow();
    const f = createUnitOfWorkProviderFixture();
    for (const context of [undefined, null, {}, {executor: null}, {executor: {}}, {executor: {query: 1}}]) {
        assert.throws(() => f.custodyExecutor(context), error => error.code === 'CUSTODY_HOST_TRANSACTION_REQUIRED' && error.statusCode === 500);
    }
    assert.deepEqual(UOW_ERROR_CODES, ['CUSTODY_HOST_TRANSACTION_REQUIRED']);
    const examples = createUnitOfWorkContractExamples();
    assert.match(examples.label, /^FIXTURE/);
    assert.deepEqual(examples.error.error, {code: UOW_ERROR_CODES[0], message: UOW_ERROR_CODES[0]});
    assert.deepEqual(f.connections, []);
});

test('C-UOW pool.query is recorded independently and is never represented as a pinned executor', async () => {
    const f = (await uow()).createUnitOfWorkProviderFixture({query: async () => ({rows: [{value: 1}], rowCount: 1})});
    assert.deepEqual(await f.pool.query('read', [1]), {rows: [{value: 1}], rowCount: 1});
    assert.equal(f.poolQueries[0].scope, 'pool');
    assert.equal(f.poolQueries[0].connection, null);
    assert.deepEqual(f.connections, []);
    await f.unitOfWork(async context => {
        const result = await context.executor.query('read');
        assert.deepEqual(result, {rows: [{value: 1}], rowCount: 1});
        assert.notEqual(context.executor, f.pool);
    });
});

test('C-UOW connect failure has no acquired connection to release', async () => {
    const f = (await uow()).createUnitOfWorkProviderFixture();
    const failure = new Error('connect failed');
    f.pool.connect = async () => {throw failure;};
    let called = false;
    await assert.rejects(f.unitOfWork(async () => {called = true;}), error => error === failure);
    assert.equal(called, false);
    assert.deepEqual(f.connections, []);
});

test('C-UOW release failure can replace callback failure, as in existing host', async () => {
    const f = (await uow()).createUnitOfWorkProviderFixture();
    const failure = new Error('release failed');
    await assert.rejects(f.unitOfWork(async () => {
        f.connections[0].release = () => {throw failure;};
        throw new Error('callback failed');
    }), error => error === failure);
    assert.deepEqual(texts(f.connections[0]), ['BEGIN', 'ROLLBACK']);
});

test('C-UOW identity module-owned rollback failure retains the original error', async () => {
    const original = new Error('module write failed');
    const f = (await uow()).createUnitOfWorkProviderFixture({query: async ({text}) => {
        if (text === 'ROLLBACK') throw new Error('rollback failed');
        return {rows: [], rowCount: null};
    }});
    await assert.rejects(f.moduleWrite(async () => {throw original;}), error => error === original);
    assert.deepEqual(texts(f.connections[0]), ['BEGIN', 'ROLLBACK']);
    assert.equal(f.connections[0].releaseCount, 1);
    await assert.rejects(f.moduleWrite(async () => {}, {executor: null}), error => error.code === 'IDENTITY_INPUT_INVALID');
    assert.equal(f.connections.length, 1);
});

test('C-UOW examples match success/failure fixture traces and provenance covers shipped files', async () => {
    const {readFileSync} = await import('node:fs');
    const {createHash} = await import('node:crypto');
    const {createUnitOfWorkContractExamples, createUnitOfWorkProviderFixture} = await uow();
    const examples = createUnitOfWorkContractExamples();
    const f = createUnitOfWorkProviderFixture();
    await f.unitOfWork(async context => {
        await context.executor.query('identity write');
        await context.executor.query('custody write');
    });
    await assert.rejects(f.unitOfWork(async context => {
        await context.executor.query('write');
        throw new Error('example failed');
    }));
    assert.deepEqual(examples.success, [...texts(f.connections[0]), 'release']);
    assert.deepEqual(examples.failure, [...texts(f.connections[1]), 'release']);
    const provenance = JSON.parse(readFileSync(new URL('../contracts/uow/provenance.json', import.meta.url)));
    for (const [file, hash] of Object.entries(provenance.publishedFiles)) {
        const bytes = readFileSync(new URL(`../contracts/uow/${file}`, import.meta.url));
        assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, file);
    }
    assert.equal(provenance.identityPublishedBaseline, 'v0.2.0');
});
