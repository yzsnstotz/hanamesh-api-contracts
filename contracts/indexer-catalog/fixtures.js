import { INDEXER_EXAMPLES, INDEXER_ERRORS } from './definition.js';
export const INDEXER_FIXTURE_LABEL = 'FIXTURE · C-INDEXER-CATALOG · seeded consumer ports; no SQL, fetching, dedupe engine or production composition';
const copy = value => structuredClone(value);
const fail = (code, statusCode) => { throw Object.assign(new Error(code), {code, statusCode}); };
export function createIndexerContractExamples() {
    const item = copy(INDEXER_EXAMPLES.item);
    const inputs = ['1024store', 'awesome', 'hanamesh'].map((sourceId, index) => ({
        dedupeKey: 'gh:example/plugin', displayName: `FIXTURE ${sourceId}`, kind: 'interface', githubRepo: 'Example/Plugin',
        repoUrl: item.repoUrl, repoSubdirectory: null, homepage: null, npmPackageName: item.npmPackageName,
        summary: item.summary, latestVersion: item.latestVersion, license: item.license, categories: [], keywords: [], publisher: null,
        source: {sourceId, sourceRef: sourceId === 'hanamesh' ? 'fixture-id' : 'Example/Plugin', sourceUrl: `https://source.example/${sourceId}/plugin`, rawHash: String(index+1).repeat(64)},
    }));
    const deduped = {...item, sourceId: '1024store', sourceRef: inputs[0].source.sourceRef, displayName: 'FIXTURE hanamesh', githubRepo: 'Example/Plugin', sourceLinks: inputs.map(input => ({sourceId: input.source.sourceId, sourceRef: input.source.sourceRef, sourceUrl: input.source.sourceUrl, firstSeenAt: item.indexedAt, lastSeenAt: item.updatedAt}))};
    const errors = Object.fromEntries(Object.entries(INDEXER_ERRORS).map(([code,[status]]) => [code,{status,body:{error:{code,message:code}}}]));
    const runFailure = code => ({status: code === 'INDEXER_DEDUPE_COLLISION' ? 409 : 502, body: {...copy(INDEXER_EXAMPLES.result), status:'failed', created:0, failed:1, error:code}});
    return {label: INDEXER_FIXTURE_LABEL, ...copy(INDEXER_EXAMPLES), errors,
        page1: {items:[item], next:item.hanaId}, page2: {items:[{...item,hanaId:'00000000-0000-4000-8000-000000000003'}],next:null},
        dedupe: {inputs, output:deduped, replay:{source:'1024store',status:'ok',fetched:1,created:0,updated:0,unchanged:1,failed:0}},
        failures:{source:runFailure('INDEXER_SOURCE_HTTP'),collision:runFailure('INDEXER_DEDUPE_COLLISION'),unknownContent:runFailure('INDEXER_CONTENT_SOURCE_UNKNOWN')},
        differences:{items:'array -> {items,next}',request:'sourceId -> source',result:'IndexRunDTO -> RunResult; no runId/startedAt/finishedAt/running'},
    };
}
/** Seeded read/run-result stub; applyBatch deliberately has no synthetic dedupe implementation. */
export function createIndexerProviderFixture(options = {}) {
    const examples = createIndexerContractExamples();
    const items = copy(options.items ?? [examples.dedupe.output]).sort((a,b) => a.hanaId.localeCompare(b.hanaId));
    const runs = copy(options.runs ?? examples.runs.items);
    const limitOf = limit => { if (!Number.isSafeInteger(limit) || limit<1 || limit>200) fail('INDEXER_INVALID_LIMIT',400); return limit; };
    return {label: INDEXER_FIXTURE_LABEL, service:{
        async listItems(query = {}) {
            const limit = limitOf(query.limit ?? 20);
            const candidates = items.filter(i => !query.after || i.hanaId>query.after);
            const page = candidates.slice(0,limit);
            // Cursor comes from the Registry profile page, before updatedSince/catalog filtering.
            return {items:copy(page.filter(i => !query.updatedSince || i.updatedAt>query.updatedSince)),next:candidates.length>limit ? page.at(-1).hanaId : null};
        },
        async getItem(id) { const item=items.find(i=>i.hanaId===id); if (!item) fail('INDEXER_NOT_FOUND',404); return copy(item); },
        async listRuns(limit=20) { return {items:copy(runs.slice(0,limitOf(limit)))}; },
        async runSource(_actor,adapter) { return copy(options.results?.[adapter.sourceId] ?? {...examples.result,source:adapter.sourceId}); },
        async recoverInterruptedRuns() { return 0; },
        async applyBatch() { throw new Error('FIXTURE: applyBatch not simulated; use explicit dedupe examples'); },
    }};
}
