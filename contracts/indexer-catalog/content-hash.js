import { INDEXER_EXAMPLES } from './definition.js';
const copy = value => structuredClone(value);
export const INDEXER_CONTENT_HASH_FIXTURE_LABEL = 'FIXTURE · C-INDEXER-CATALOG · explicit read outcomes; no hash validation/calculation, SQL, filtering or production factory';
/** Provider's deterministic example hash, verified by its actual metadata write algorithm. */
export function createIndexerContentHashExamples() {
    const item = {...copy(INDEXER_EXAMPLES.item), contentHash: 'awesome:f76b8be341d4de20e710054d30ee5e036527d77f26fbe52520270e5d9aa9a16f'};
    const service = {code: 'INDEXER_CONTENT_SOURCE_UNKNOWN', statusCode: 500, message: `INDEXER_CONTENT_SOURCE_UNKNOWN hanaId=${item.hanaId}`};
    const http = {status: 500, body: {error: {code: service.code, message: service.code}}};
    return {
        label: INDEXER_CONTENT_HASH_FIXTURE_LABEL,
        item, items: {items: [copy(item)], next: null},
        winningContent: {...copy(item), sourceId: '1024store', contentHash: 'hanamesh:f76b8be341d4de20e710054d30ee5e036527d77f26fbe52520270e5d9aa9a16f',
            sourceLinks: ['1024store','awesome','hanamesh'].map(sourceId => ({...copy(item.sourceLinks[0]), sourceId}))},
        emptyPage: {items: [], next: item.hanaId},
        invalidStoredHash: {
            missing: {service: copy(service), http: copy(http)},
            null: {storedHash: null, service: copy(service), http: copy(http)},
            nonString: {storedHash: 42, service: copy(service), http: copy(http)},
            damaged: {storedHash: 'awesome:damaged', service: copy(service), http: copy(http)},
            unknownSource: {storedHash: `unknown:${'a'.repeat(64)}`, service: copy(service), http: copy(http)},
        },
    };
}
/** Scripted outcomes only. A missing scripted cursor/id is a fixture setup error. */
export function createIndexerContentHashReadFixture(options = {}) {
    const examples = createIndexerContentHashExamples();
    const pages = copy(options.pages ?? {'': examples.items});
    const item = copy(options.item ?? examples.item);
    const failure = copy(options.failure);
    const reject = () => { if (failure) throw Object.assign(new Error(failure.message), {code: failure.code, statusCode: failure.statusCode}); };
    return {label: INDEXER_CONTENT_HASH_FIXTURE_LABEL, service: {
        async listItems(query = {}) {
            reject();
            const key = query.after ?? '';
            if (!Object.hasOwn(pages, key)) throw new Error('FIXTURE: unscripted cursor');
            const page = pages[key];
            return copy(page);
        },
        async getItem(hanaId) {
            reject();
            if (hanaId !== item.hanaId) throw new Error('FIXTURE: unscripted Hana id');
            return copy(item);
        },
    }};
}
