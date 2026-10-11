import type { IndexedHanaDTO, IndexRunDTO, RunResult } from './contracts.js';
/** Existing wire is preserved. Baseline differences require APIC-06 publication/reconciliation. */
export declare const INDEXER_CONTRACT_DEFINITION: Readonly<{
    id: "C-INDEXER-CATALOG";
    provider: "server-indexer";
    protocolVersion: "1";
    calls: {
        items: {
            at: string;
            input: string;
            output: string;
            errors: string[];
            baseline: string;
            difference: string;
        };
        hana: {
            at: string;
            input: string;
            output: string;
            errors: string[];
        };
        runs: {
            at: string;
            input: string;
            output: string;
            errors: string[];
        };
        run: {
            at: string;
            input: string;
            output: string;
            errors: string[];
            baseline: string;
            difference: string;
        };
    };
    contentHash: {
        field: string;
        requiredOnProviderSuccess: boolean;
        origin: string;
        format: string;
        identity: string;
        invalid: string;
        compatibility: string;
        pagination: string;
    };
    composition: {
        configuration: string;
        export: string;
        startup: string;
        ports: string[];
        shutdown: string;
        migration: string;
        ownership: string;
        invariant: string;
    };
}>;
export declare const INDEXER_ERRORS: Readonly<{
    readonly INDEXER_INVALID_LIMIT: readonly [400, "limit must be integer 1..200"];
    readonly INDEXER_INVALID_UPDATED_SINCE: readonly [400, "updatedSince must be a valid RFC3339 timestamp"];
    readonly INDEXER_NOT_FOUND: readonly [404, "indexed Hana does not exist"];
    readonly INDEXER_FORBIDDEN: readonly [403, "host policy rejected run"];
    readonly INDEXER_INVALID_SOURCE: readonly [400, "source must be awesome, 1024store or hanamesh"];
    readonly INDEXER_SOURCE_DISABLED: readonly [404, "source adapter was not supplied"];
    readonly INDEXER_INVALID_REQUEST: readonly [400, "registry input error mapped for HTTP"];
    readonly INDEXER_INTERNAL: readonly [500, "unexpected HTTP error"];
    readonly INDEXER_CONTENT_SOURCE_UNKNOWN: readonly [500, "stored content hash is missing/null/non-string/unknown/damaged; list/get HTTP 500, batch rolls back, run wire 502"];
    readonly INDEXER_DEDUPE_COLLISION: readonly [409, "source and dedupe identify different Hanas"];
    readonly INDEXER_ACTOR_REQUIRED: readonly [500, "explicit actor required"];
    readonly INDEXER_BATCH_TOO_LARGE: readonly [400, "batch exceeds 100 items"];
    readonly INDEXER_BATCH_FAILED: readonly [502, "unexpected batch failure"];
    readonly INDEXER_SOURCE_FAILED: readonly [502, "source failed"];
    readonly INDEXER_SOURCE_TIMEOUT: readonly [502, "source timeout"];
    readonly INDEXER_SOURCE_LIMIT: readonly [502, "source exceeded response/page/item bounds"];
    readonly INDEXER_SOURCE_SCHEMA: readonly [502, "source schema changed"];
    readonly INDEXER_SOURCE_HTTP: readonly [502, "source HTTP error"];
    readonly INDEXER_SOURCE_CONFIG: readonly [502, "source URL invalid"];
    readonly INDEXER_RUN_LEASE_LOST: readonly [502, "run lease lost; persistence may itself reject finish"];
    readonly INDEXER_INTERRUPTED: readonly [502, "stale persisted run recovered as failed"];
}>;
export type IndexerErrorCode = keyof typeof INDEXER_ERRORS;
export interface IndexerErrorResponse {
    readonly error: {
        readonly code: string;
        readonly message: string;
    };
}
export declare const INDEXER_EXAMPLES: Readonly<{
    item: IndexedHanaDTO;
    items: {
        items: IndexedHanaDTO[];
        next: null;
    };
    request: {
        source: string;
    };
    result: RunResult;
    runs: {
        items: IndexRunDTO[];
    };
}>;
