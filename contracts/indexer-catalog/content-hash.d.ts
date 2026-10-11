import type {IndexedHanaWithContentHashDTO, IndexerReadService} from './contracts.js';
import type {IndexerErrorResponse} from './definition.js';
export declare const INDEXER_CONTENT_HASH_FIXTURE_LABEL: string;
/** Structural read failure from provider IndexerError; the package exports no error constructor. */
export interface IndexerContentHashReadFailure {
    readonly code: 'INDEXER_CONTENT_SOURCE_UNKNOWN';
    readonly statusCode: 500;
    readonly message: string;
}
export interface IndexerContentHashPage {
    readonly items: readonly IndexedHanaWithContentHashDTO[];
    readonly next: string | null;
}
export interface IndexerContentHashInvalidExample {
    readonly storedHash?: unknown;
    readonly service: IndexerContentHashReadFailure;
    readonly http: {readonly status: 500; readonly body: IndexerErrorResponse};
}
export interface IndexerContentHashExamples {
    readonly label: string;
    readonly item: IndexedHanaWithContentHashDTO;
    readonly items: IndexerContentHashPage;
    readonly winningContent: IndexedHanaWithContentHashDTO;
    readonly emptyPage: IndexerContentHashPage & {readonly next: string};
    readonly invalidStoredHash: Readonly<Record<'missing'|'null'|'nonString'|'damaged'|'unknownSource',IndexerContentHashInvalidExample>>;
}
export declare function createIndexerContentHashExamples(): IndexerContentHashExamples;
/** Explicit recorded results/errors; no production hash validation, incremental filtering or fetching. */
export declare function createIndexerContentHashReadFixture(options?: {
    readonly pages?: Readonly<Record<string,IndexerContentHashPage>>;
    readonly item?: IndexedHanaWithContentHashDTO;
    readonly failure?: IndexerContentHashReadFailure;
}): {label: string; service: Pick<IndexerReadService,'listItems'|'getItem'>};
