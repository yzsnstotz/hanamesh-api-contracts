export const SEMANTIC_FIXTURE_LABEL = 'FIXTURE · C-SEMANTIC · explicit recorded values/errors; no SQL, source fetching, hash validation or paid model';
export const SEMANTIC_EMBEDDING_FACTS_FIXTURE_LABEL = 'FIXTURE · current Semantic embedding facts · recorded reads only; no Registry denominator, SQL, historical first time or model';
export function createSemanticEmbeddingFactsExamples() {
    const all = [{ hanaId: '00000000-0000-4000-8000-000000000001', hasCurrentEmbedding: true, oldestCurrentEmbeddedAt: '2026-01-01T00:00:00.000001Z' }, { hanaId: '00000000-0000-4000-8000-000000000002', hasCurrentEmbedding: false, oldestCurrentEmbeddedAt: null }];
    return { label: SEMANTIC_EMBEDDING_FACTS_FIXTURE_LABEL, all, exact: [{ provider: 'stub', model: 'stub-document-v1', items: [{ ...all[0], oldestCurrentEmbeddedAt: '2026-01-02T00:00:00.000001Z' }, all[1]] }] };
}
/** Separate new fixture preserves the original formal fixture bytes/shape. Never used by module defaults. */
export function createSemanticEmbeddingFactsFixture(seed) {
    const data = structuredClone(seed), calls = [];
    const failures = {};
    const repository = { async listEmbeddingFacts(query) {
            calls.push(structuredClone(query));
            if (failures.listEmbeddingFacts)
                throw failures.listEmbeddingFacts;
            const scope = query.selection;
            const rows = scope.kind === 'all' ? data.all : data.exact.find(item => item.provider === scope.provider && item.model === scope.model)?.items;
            if (rows === undefined)
                throw new Error('SEMANTIC_FIXTURE_UNRECORDED_SELECTION');
            return structuredClone(rows.filter(row => query.afterHanaId === null || row.hanaId > query.afterHanaId).sort((a, b) => a.hanaId < b.hanaId ? -1 : a.hanaId > b.hanaId ? 1 : 0).slice(0, query.limit + 1));
        } };
    return { label: SEMANTIC_EMBEDDING_FACTS_FIXTURE_LABEL, repository, calls, failures };
}
/** Deterministic independent values for consumer assembly; never an operational provider. */
export function createSemanticContractExamples() {
    const objectId = '5cdca6cf-b0b0-4241-8937-5ec25a3454ca', hanaId = '00000000-0000-4000-8000-000000000002';
    const profile = { name: 'Fixture', purpose: 'Fixture capability', capabilities: ['debug'], suitableTasks: ['debug'], inputs: ['repository'], outputs: ['result'], runtime: ['local'], interfaces: ['dsh'], semanticDescription: 'Fixture capability', readme: '# Fixture' };
    return { label: SEMANTIC_FIXTURE_LABEL,
        sourceRows: [{ hanaId, sourceId: 'awesome', sourceRef: 'fixture/repo', name: 'Fixture', kind: 'interface', githubRepo: null, homepage: null, npmPackageName: null, summaryEn: 'Fixture capability', summaryZh: null, license: 'MIT', categories: ['coding'], keywords: ['debug'], repoUrl: null, repoSubdirectory: null, contentHash: `awesome:${'a'.repeat(64)}`, updatedAt: '2026-01-01T00:00:00.000Z', cachedReadme: '# Fixture' }],
        pending: [{ objectId, profile, semanticHash: 'fixture-recorded-semantic-hash' }],
        candidates: [{ objectId, hanaId, type: 'dsh_plugin', name: 'Fixture', score: .9, summary: profile.purpose, capabilities: ['debug'], metadata: { categories: ['coding'], license: 'MIT', runtime: ['local'], os: ['macos'], installed: false, available: true } }],
        changed: [objectId], request: { query: 'fixture', telemetry: false }, feedback: { requestId: objectId, objectId, action: 'select' } };
}
/** Scripted repository: records writes, returns caller supplied reads, and throws caller supplied failures. */
export function createSemanticRepositoryFixture(seed) {
    const data = structuredClone(seed);
    const failures = {};
    const profiles = [], embeddings = [], queryLogs = [], feedbackLogs = [], decisions = [];
    const check = (method) => { const failure = failures[method]; if (failure)
        throw failure; };
    const repository = {
        async listSourceRows() { check('listSourceRows'); return structuredClone(data.sourceRows); },
        async upsertProfiles(_executor, values) { check('upsertProfiles'); profiles.push(...structuredClone(values)); return [...data.changed]; },
        async listPendingEmbeddings() { check('listPendingEmbeddings'); return structuredClone(data.pending); },
        async upsertEmbeddings(_executor, values) { check('upsertEmbeddings'); embeddings.push(...structuredClone(values)); },
        async search() { check('search'); return structuredClone(data.candidates); },
        async logQuery(_executor, value) { check('logQuery'); queryLogs.push(structuredClone(value)); },
        async updateQueryDecision(_executor, value) { check('updateQueryDecision'); decisions.push(structuredClone(value)); },
        async logFeedback(_executor, value) { check('logFeedback'); feedbackLogs.push(structuredClone(value)); },
    };
    return { label: SEMANTIC_FIXTURE_LABEL, repository, failures, profiles, embeddings, queryLogs, feedbackLogs, decisions };
}
