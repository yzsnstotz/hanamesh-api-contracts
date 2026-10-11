// FIXTURE ONLY: provider rollupAndPurge (src/service.ts) and withExecutor (src/transaction.ts) at 5ff545a, over an in-memory SQL emulation.
// Not PostgreSQL, not a real host job. Independent of createUsageProviderFixture, whose no-rollups/no-host-commit scope is unchanged.
import {randomUUID} from 'node:crypto';
import {UsageError} from './errors.js';
export const USAGE_MAINTENANCE_FIXTURE_LABEL = 'FIXTURE · C-USAGE maintenance · provider rollupAndPurge over in-memory SQL emulation; not PostgreSQL, RLS, real locks or a host scheduler';
const ZERO = '00000000-0000-4000-8000-000000000000';
const NOW = '2026-10-11T00:00:00.000Z', DAY = 86400000;
// Provider src/transaction.ts: no pool acquisition, BEGIN, COMMIT, ROLLBACK or release when the host supplied a context.
async function withExecutor(pool, owner, context, work) {
    const scoped = async (executor) => {
        await executor.query("SELECT set_config('hanamesh_usage.principal_id',$1,true), set_config('hanamesh_usage.deployment_id',$2,true)", [owner.principalId, owner.deploymentId]);
        return work(executor);
    };
    if (context !== undefined) {
        if (!context || !context.executor || typeof context.executor.query !== 'function') throw new UsageError('USAGE_CONFIG_INVALID');
        return scoped(context.executor);
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await scoped(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        try { await client.query('ROLLBACK'); } catch { /* preserve the original, sanitized by service */ }
        throw error;
    } finally { client.release(); }
}
// Provider src/service.ts rollupAndPurge with its stored()/configure() helpers; repository statement from src/database/events-repository.ts.
function createMaintenancePort(options) {
    const retentionDays = options.retentionDays ?? 90;
    const stored = async (work) => { try { return await work(); } catch (error) { if (error instanceof UsageError) throw error; throw new UsageError('USAGE_STORAGE_UNAVAILABLE'); } };
    const configure = async (executor, principalIds, deviceId, maintenance = false) => { await executor.query("SELECT set_config('hanamesh_usage.principal_ids',$1,true),set_config('hanamesh_usage.device_id',$2,true),set_config('hanamesh_usage.maintenance',$3,true)", [principalIds.join(','), deviceId ?? '', maintenance ? 'on' : 'off']); };
    const repository = {async rollupAndPurge(e, deploymentId, cutoff) {
        await e.query('LOCK TABLE usage.events IN SHARE UPDATE EXCLUSIVE MODE');
        const result = await e.query('WITH expired AS MATERIALIZED (\n -- rollup upsert + delete, see provider events-repository.ts', [deploymentId, cutoff]);
        return {rolled:Number(result.rows[0]?.rolled ?? 0), purged:Number(result.rows[0]?.purged ?? 0)};
    }};
    return {async rollupAndPurge(at, context) {
        if (!(at instanceof Date) || !Number.isFinite(at.valueOf())) throw new UsageError('USAGE_INPUT_INVALID');
        const owner = {deploymentId:options.deploymentId, principalId:ZERO}, cutoff = new Date(at.valueOf() - retentionDays * 86400000).toISOString();
        return stored(async () => { const result = await withExecutor(options.pool, owner, context, async (executor) => { await configure(executor, [], undefined, true); return repository.rollupAndPurge(executor, options.deploymentId, cutoff); }); return {...result, durability:context === undefined ? 'committed' : 'pending-host-commit'}; });
    }};
}
export function createUsageMaintenanceFixture(options = {}) {
    const retentionDays = options.retentionDays ?? 90, deploymentId = options.deploymentId ?? 'fixture-usage';
    // Same construction-time rule as provider validateServiceOptions / createEligibilityReader.
    if (!Number.isInteger(retentionDays) || retentionDays < 0 || retentionDays > 90) throw new UsageError('USAGE_CONFIG_INVALID');
    let state = {events:[], rollups:[]}, failure = null, connects = 0, releases = 0;
    const statements = [];
    const connection = (counted) => {
        let snapshot = null; const guc = {};
        const executor = {async query(sql, args = []) {
            statements.push(Object.freeze({sql:sql.trim().split('\n')[0], args:Object.freeze([...args])}));
            if (failure !== null && sql.includes(failure)) { failure = null; throw new Error('driver failure'); }
            if (sql === 'BEGIN') { snapshot = structuredClone(state); return {rows:[], rowCount:0}; }
            if (sql === 'COMMIT') { snapshot = null; return {rows:[], rowCount:0}; }
            if (sql === 'ROLLBACK') { if (snapshot) state = snapshot; snapshot = null; return {rows:[], rowCount:0}; }
            if (sql.includes('set_config')) {
                if (snapshot) for (const [i, name] of [...sql.matchAll(/'hanamesh_usage\.(\w+)'/g)].map(m => m[1]).entries()) guc[name] = args[i];
                return {rows:[], rowCount:0};
            }
            if (sql.startsWith('LOCK TABLE')) { if (!snapshot) throw new Error('LOCK TABLE can only be used in transaction blocks'); return {rows:[], rowCount:0}; }
            if (sql.startsWith('WITH expired')) {
                // RLS emulation: deployment from the local GUC; cross-principal rows only with maintenance='on'.
                const [deployment, cutoff] = args;
                const visible = row => row.deploymentId === guc.deployment_id && (guc.maintenance === 'on' || String(guc.principal_ids ?? '').split(',').includes(row.principalId));
                const expired = state.events.filter(row => visible(row) && row.deploymentId === deployment && row.receivedAt < cutoff);
                for (const row of expired) {
                    const day = row.occurredAt.slice(0, 10);
                    const found = state.rollups.find(r => r.deploymentId === row.deploymentId && r.deviceId === row.deviceId && r.hanaRef === row.hanaRef && r.action === row.action && r.day === day);
                    if (found) found.count++;
                    else state.rollups.push({deploymentId:row.deploymentId, principalId:row.principalId, deviceId:row.deviceId, hanaRef:row.hanaRef, action:row.action, day, count:1});
                }
                state.events = state.events.filter(row => !expired.includes(row));
                return {rows:[{rolled:String(expired.length), purged:String(expired.length)}], rowCount:1};
            }
            return {rows:[], rowCount:0};
        }};
        return {query:executor.query, release() { if (counted) releases++; }};
    };
    const pool = {
        async query() { throw new Error('the maintenance job never uses pool.query'); },
        async connect() { if (failure === 'connect') { failure = null; throw new Error('driver failure'); } connects++; return connection(true); }
    };
    const port = createMaintenancePort({deploymentId, pool, retentionDays});
    const strip = ({deploymentId:_d, ...row}) => ({...row});
    return {
        label:USAGE_MAINTENANCE_FIXTURE_LABEL, deploymentId, retentionDays, port, pool, statements,
        get connects() { return connects; }, get releases() { return releases; },
        seed(events) { for (const event of events) state.events.push({deploymentId, eventId:event.eventId ?? randomUUID(), deviceId:event.deviceId, principalId:event.principalId, hanaRef:event.hanaRef, action:event.action, occurredAt:event.occurredAt, receivedAt:event.receivedAt}); },
        events() { return state.events.map(strip); },
        rollups() { return state.rollups.map(strip); },
        async beginHostTransaction() {
            const client = connection(false); await client.query('BEGIN');
            return {context:{executor:{query:client.query}},
                async commit() { await client.query('COMMIT'); client.release(); },
                async rollback() { await client.query('ROLLBACK'); client.release(); }};
        },
        failNext(match) { failure = match; }
    };
}
/** Executable call examples; every value is FIXTURE. */
export async function createUsageMaintenanceExamples() {
    const now = new Date(NOW), retentionDays = 30, device = 'A'.repeat(43), principal = '11111111-1111-4111-8111-111111111111';
    const old = new Date(now.valueOf() - 31 * DAY).toISOString(), fresh = new Date(now.valueOf() - DAY).toISOString();
    const events = [
        {deviceId:device, principalId:principal, hanaRef:'fixture.hana', action:'use', occurredAt:old, receivedAt:old},
        {deviceId:device, principalId:principal, hanaRef:'fixture.hana', action:'use', occurredAt:old, receivedAt:old},
        // occurredAt is old but receivedAt is inside retention: kept, the cutoff uses received_at.
        {deviceId:device, principalId:principal, hanaRef:'fixture.hana', action:'open', occurredAt:old, receivedAt:fresh}
    ];
    const owned = createUsageMaintenanceFixture({retentionDays}); owned.seed(events);
    const committed = await owned.port.rollupAndPurge(now), rerun = await owned.port.rollupAndPurge(now);
    const hosted = createUsageMaintenanceFixture({retentionDays}); hosted.seed(events);
    const tx = await hosted.beginHostTransaction(), hostResult = await hosted.port.rollupAndPurge(now, tx.context); await tx.commit();
    const rolledBack = createUsageMaintenanceFixture({retentionDays}); rolledBack.seed(events);
    const tx2 = await rolledBack.beginHostTransaction(), rollbackResult = await rolledBack.port.rollupAndPurge(now, tx2.context); await tx2.rollback();
    const errors = [];
    const capture = async (name, run) => { try { await run(); } catch (error) { errors.push({case:name, code:error.code, status:error.statusCode}); } };
    await capture('now is an ISO string', () => owned.port.rollupAndPurge(NOW));
    await capture('context without executor', () => owned.port.rollupAndPurge(now, {}));
    await capture('retentionDays 91', () => createUsageMaintenanceFixture({retentionDays:91}));
    owned.failNext('LOCK TABLE'); await capture('lock failure', () => owned.port.rollupAndPurge(now));
    return {label:USAGE_MAINTENANCE_FIXTURE_LABEL, now:NOW, retentionDays, committed, rerun,
        hostCommit:{result:hostResult, rollups:hosted.rollups()},
        hostRollback:{result:rollbackResult, eventsAfterRollback:rolledBack.events().length}, errors};
}
