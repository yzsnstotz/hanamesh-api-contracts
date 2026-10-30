/** Existing wire is preserved. Baseline differences require APIC-06 publication/reconciliation. */
export const INDEXER_CONTRACT_DEFINITION = Object.freeze({
    id: 'C-INDEXER-CATALOG', provider: 'server-indexer', protocolVersion: '1',
    calls: {
        items: { at: 'GET /v1/indexer/items', input: '{updatedSince?: RFC3339, limit?: 1..200, after?: string}',
            output: '{items: IndexedHanaDTO[], next: string|null}', errors: ['INDEXER_INVALID_LIMIT', 'INDEXER_INVALID_UPDATED_SINCE', 'INDEXER_CONTENT_SOURCE_UNKNOWN'],
            baseline: 'IndexedHanaDTO[]', difference: 'Existing response is a paginated envelope, not an array.' },
        hana: { at: 'GET /v1/indexer/hanas/:hanaId', input: 'hanaId', output: 'IndexedHanaDTO', errors: ['INDEXER_NOT_FOUND', 'INDEXER_CONTENT_SOURCE_UNKNOWN'] },
        runs: { at: 'GET /v1/indexer/runs', input: '{limit?: 1..200}', output: '{items: IndexRunDTO[]}', errors: ['INDEXER_INVALID_LIMIT'] },
        run: { at: 'POST /v1/indexer/runs', input: '{source: SourceId}', output: 'RunResult',
            errors: ['INDEXER_FORBIDDEN', 'INDEXER_INVALID_SOURCE', 'INDEXER_SOURCE_DISABLED', 'INDEXER_SOURCE_FAILED', 'INDEXER_RUN_LEASE_LOST', 'INDEXER_CONTENT_SOURCE_UNKNOWN', 'INDEXER_DEDUPE_COLLISION', 'INDEXER_BATCH_FAILED', 'INDEXER_SOURCE_TIMEOUT', 'INDEXER_SOURCE_LIMIT', 'INDEXER_SOURCE_SCHEMA', 'INDEXER_SOURCE_HTTP', 'INDEXER_SOURCE_CONFIG'],
            baseline: '{sourceId} -> IndexRunDTO',
            difference: 'Request uses source. RunResult omits runId/startedAt/finishedAt and running; GET runs supplies persisted IndexRunDTO. Failure is a RunResult.error string (HTTP 502 or collision 409), not an error envelope.' },
    },
    contentHash: {
        field: 'IndexedHanaDTO.contentHash?: string / IndexedHanaWithContentHashDTO.contentHash: string',
        requiredOnProviderSuccess: true,
        origin: 'Winning catalog_items.content_hash from the same returned catalog row; no read-time calculation.',
        format: '1024store|awesome|hanamesh followed by colon and 64 lowercase SHA256 hex digits of public metadata',
        identity: 'Hash source is winning content provenance; profile.sourceId/sourceRef remain first Registry identity.',
        invalid: 'Missing/null/non-string/malformed/unknown source rejects the whole read with INDEXER_CONTENT_SOURCE_UNKNOWN (HTTP 500); diagnostic logs code and Hana id, never raw hash.',
        compatibility: 'Legacy DTO constructors and IndexerService fixtures may omit contentHash; concrete IndexerReadService list/get guarantee it. SourceLinkDTO is unchanged.',
        pagination: 'updatedSince is strictly greater; an empty filtered items page can retain next. Consumers follow next and own unsynchronized local state.',
    },
    composition: {
        configuration: '--composition-module / INDEXER_COMPOSITION_MODULE; deployment manifest owns path',
        export: 'createIndexerComposition', startup: '(request: {databaseUrl:string, purpose:"index-once"|"serve"|"migrate"}) => IndexerComposition | Promise<IndexerComposition>',
        ports: ['RegistryProfilePort', 'SqlPool', 'UnitOfWork', 'actor', 'sources', 'policy', 'close', 'migrate'],
        shutdown: 'close(): Promise<void>', migration: 'migrate(): Promise<void>',
        ownership: 'Host creates Registry and same-database pool/UOW, controls policy, Registry+Indexer migration order and runtime grants. Factory releases partially created resources on rejection; runner closes a returned composition once.',
        invariant: 'Registry, catalog and source links share context.executor. Fetch completes outside business UOW. No HTTP write substitute.',
    },
});
export const INDEXER_ERRORS = Object.freeze({
    INDEXER_INVALID_LIMIT: [400, 'limit must be integer 1..200'],
    INDEXER_INVALID_UPDATED_SINCE: [400, 'updatedSince must be a valid RFC3339 timestamp'],
    INDEXER_NOT_FOUND: [404, 'indexed Hana does not exist'],
    INDEXER_FORBIDDEN: [403, 'host policy rejected run'],
    INDEXER_INVALID_SOURCE: [400, 'source must be a supported Indexer source'],
    INDEXER_SOURCE_DISABLED: [404, 'source adapter was not supplied'],
    INDEXER_INVALID_REQUEST: [400, 'registry input error mapped for HTTP'],
    INDEXER_INTERNAL: [500, 'unexpected HTTP error'],
    INDEXER_CONTENT_SOURCE_UNKNOWN: [500, 'stored content hash is missing/null/non-string/unknown/damaged; list/get HTTP 500, batch rolls back, run wire 502'],
    INDEXER_DEDUPE_COLLISION: [409, 'source and dedupe identify different Hanas'],
    INDEXER_ACTOR_REQUIRED: [500, 'explicit actor required'],
    INDEXER_BATCH_TOO_LARGE: [400, 'batch exceeds 100 items'],
    INDEXER_BATCH_FAILED: [502, 'unexpected batch failure'],
    INDEXER_SOURCE_FAILED: [502, 'source failed'],
    INDEXER_SOURCE_TIMEOUT: [502, 'source timeout'],
    INDEXER_SOURCE_LIMIT: [502, 'source exceeded response/page/item bounds'],
    INDEXER_SOURCE_SCHEMA: [502, 'source schema changed'],
    INDEXER_SOURCE_HTTP: [502, 'source HTTP error'],
    INDEXER_SOURCE_CONFIG: [502, 'source URL invalid'],
    INDEXER_RUN_LEASE_LOST: [502, 'run lease lost; persistence may itself reject finish'],
    INDEXER_INTERRUPTED: [502, 'stale persisted run recovered as failed'],
});
const at = '2026-10-11T00:00:00.000Z';
const sample = {
    hanaId: '00000000-0000-4000-8000-000000000001', sourceId: 'awesome', sourceRef: 'example/plugin',
    displayName: 'Example plugin', kind: 'interface', githubRepo: 'example/plugin', homepage: null,
    indexedAt: at, ownerPrincipalId: null, npmPackageName: '@example/plugin', summary: { en: 'Example', zh: null },
    latestVersion: '1.0.0', license: 'MIT', categories: [], keywords: [], publisher: null,
    repoUrl: 'https://github.com/example/plugin', repoSubdirectory: null, updatedAt: at,
    sourceLinks: [{ sourceId: 'awesome', sourceRef: 'example/plugin', sourceUrl: 'https://awesome.example/plugin', firstSeenAt: at, lastSeenAt: at }],
};
const result = { source: 'awesome', status: 'ok', fetched: 1, created: 1, updated: 0, unchanged: 0, failed: 0 };
const run = { ...result, runId: '00000000-0000-4000-8000-000000000002', startedAt: at, finishedAt: at, error: null };
export const INDEXER_EXAMPLES = Object.freeze({ item: sample, items: { items: [sample], next: null }, request: { source: 'awesome' }, result, runs: { items: [run] } });
