// Q-33 C-USAGE host maintenance port definition. Follows server-usage J2S3-SUSAGE-02 main 5ff545a; runtime rules unchanged since 70c480e.
import {UsageError} from './errors.js';
const status = code => new UsageError(code).statusCode;
export const USAGE_MAINTENANCE_DEFINITION = Object.freeze({
    port:'rollupAndPurge',
    signature:'rollupAndPurge(now: Date, context?: WriteContext /* C-UOW */): Promise<RollupAndPurgeResult>',
    http:null,
    provider:Object.freeze({card:'J2S3-SUSAGE-02',commit:'5ff545afd9d4da7cbb589d37492e7446f65c73eb'}),
    now:'Must be a Date whose valueOf() is finite; string, number, undefined or Invalid Date = USAGE_INPUT_INVALID before any connection. The job ignores options.now; the effective time is only the argument.',
    cutoff:'cutoff = new Date(now.valueOf() - retentionDays * 86400000).toISOString(); selects this deployment\'s raw events with received_at < cutoff (not occurredAt).',
    effect:'Selected events are added to daily_rollups by (principal, device, hanaRef, action, UTC day of occurredAt) with count += n, then deleted, in one statement. rolled = selected rows, purged = deleted rows.',
    rerun:'With nothing expired a rerun returns {rolled:0,purged:0}.',
    retention:Object.freeze({option:'retentionDays',integer:true,min:0,max:90,default:90,unitMs:86400000,field:'received_at',invalid:'USAGE_CONFIG_INVALID',
        sameValue:'EligibilityReaderOptions.retentionDays is a separate option with the same rule; the host must pass the same value or availability boundaries disagree with purging. Shorter values are for isolated tests.'}),
    durability:Object.freeze({withoutContext:'committed',withContext:'pending-host-commit',
        note:'pending-host-commit is durable only after the host COMMIT returns; the host must not report success before that.'}),
    transaction:Object.freeze({
        withoutContext:Object.freeze(['pool.connect()','BEGIN',"set_config hanamesh_usage.principal_id=00000000-0000-4000-8000-000000000000, deployment_id (local)","set_config principal_ids='', device_id='', maintenance='on' (local)",'LOCK TABLE usage.events IN SHARE UPDATE EXCLUSIVE MODE','WITH expired ... rollup upsert + delete','COMMIT','release()']),
        withContext:Object.freeze(['context.executor only: same set_config, LOCK and statement','no BEGIN/COMMIT/ROLLBACK/release']),
        lock:'LOCK TABLE usage.events IN SHARE UPDATE EXCLUSIVE MODE, held until the transaction ends (host COMMIT/ROLLBACK when context is given). On failure without context: ROLLBACK, then release.',
        concurrency:'SHARE UPDATE EXCLUSIVE conflicts with itself, so maintenance runs serialize; it does not conflict with ingest/withdraw ROW EXCLUSIVE and does not block reporting.',
        hostContext:'context.executor must already be inside BEGIN on the same database. GUCs are is_local=true and PostgreSQL rejects LOCK TABLE outside a transaction block, surfacing USAGE_STORAGE_UNAVAILABLE (provider inference from PG semantics, not reproduced on a real database). Keep the host transaction short.'}),
    permissions:Object.freeze({
        authorization:'No identity authentication or policy check: calling is authorization. The only caller is the host process scheduler; there is no HTTP maintenance route.',
        role:'No separate maintenance role: the same runtime role as HTTP. Preflight requires events SELECT/INSERT/DELETE and daily_rollups SELECT/INSERT/UPDATE, and no UPDATE/TRUNCATE etc. (USAGE_ROLE_UNSAFE / USAGE_SCHEMA_MISSING at createUsageModule).',
        rls:"Cross-principal visibility comes only from the local GUC hanamesh_usage.maintenance='on'; RLS still restricts deployment_id.",
        migrations:'Migrations and grants are applied by the deployment (getUsageMigrations gives metadata only); the module runs no DDL.'}),
    errors:Object.freeze({
        USAGE_INPUT_INVALID:Object.freeze({status:status('USAGE_INPUT_INVALID'),when:Object.freeze(['now is not a Date or is Invalid Date (no connection taken)'])}),
        USAGE_CONFIG_INVALID:Object.freeze({status:status('USAGE_CONFIG_INVALID'),when:Object.freeze(['context is given but null, lacks executor or executor.query (no connection taken)','retentionDays not an integer 0..90 or other invalid options, at construction (createUsageModule/createUsageService/createEligibilityReader)'])}),
        USAGE_STORAGE_UNAVAILABLE:Object.freeze({status:status('USAGE_STORAGE_UNAVAILABLE'),when:Object.freeze(['connect, privilege, lock or SQL failure; the original driver error is not exposed'])})
    }),
    shutdown:Object.freeze(['stop the scheduler','await the running job','usage.close() (no-op: host owns pool and identity)','host pool.end()']),
    injection:Object.freeze({
        factory:'createUsageModule(options: UsageModuleOptions): Promise<UsageModule> (implementation package; runs preflight)',
        module:'UsageModule {plugin: FastifyPluginAsync; services: UsageService; close(): Promise<void>}; services satisfies UsageHostServices',
        fromImplementation:Object.freeze(['createUsageModule','UsageModule (plugin type depends on fastify)','UsageService (full, incl. legacy summary ports)','createEligibilityReader','getUsageMigrations'])})
});
