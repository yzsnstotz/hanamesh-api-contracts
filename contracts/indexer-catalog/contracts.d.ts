import type { HanaProfileDTO, RegistryProfilePort } from '@hanamesh/api-contracts/catalog';
import type { WriteContext } from '@hanamesh/api-contracts/uow';
export type SourceId = 'awesome' | '1024store' | 'hanamesh';
export interface NormalizedHanaInput {
    readonly dedupeKey: string;
    readonly displayName: string;
    readonly kind: 'interface';
    readonly githubRepo: string | null;
    readonly repoUrl: string | null;
    readonly repoSubdirectory: string | null;
    readonly homepage: string | null;
    readonly npmPackageName: string | null;
    readonly summary: {
        readonly en: string | null;
        readonly zh: string | null;
    };
    readonly latestVersion: string | null;
    readonly license: string | null;
    readonly categories: readonly string[];
    readonly keywords: readonly string[];
    readonly publisher: {
        readonly name: string;
        readonly url: string | null;
    } | null;
    readonly source: {
        readonly sourceId: SourceId;
        readonly sourceRef: string;
        readonly sourceUrl: string;
        readonly rawHash: string;
    };
}
export interface SourceAdapter {
    readonly sourceId: SourceId;
    fetchAll(context?: {
        readonly signal?: AbortSignal;
    }): AsyncIterable<unknown>;
    normalize(raw: unknown): NormalizedHanaInput | null;
}
export interface SourceLinkDTO {
    readonly sourceId: SourceId;
    readonly sourceRef: string;
    readonly sourceUrl: string;
    readonly firstSeenAt: string;
    readonly lastSeenAt: string;
}
export interface IndexedHanaDTO extends HanaProfileDTO {
    readonly npmPackageName: string | null;
    readonly summary: {
        readonly en: string | null;
        readonly zh: string | null;
    };
    readonly latestVersion: string | null;
    readonly license: string | null;
    readonly categories: readonly string[];
    readonly keywords: readonly string[];
    readonly publisher: {
        readonly name: string;
        readonly url: string | null;
    } | null;
    readonly repoUrl: string | null;
    readonly repoSubdirectory: string | null;
    readonly updatedAt: string;
    readonly sourceLinks: readonly SourceLinkDTO[];
}
export interface IndexRunDTO {
    readonly runId: string;
    readonly source: SourceId;
    readonly status: 'running' | 'ok' | 'failed';
    readonly startedAt: string;
    readonly finishedAt: string | null;
    readonly fetched: number;
    readonly created: number;
    readonly updated: number;
    readonly unchanged: number;
    readonly failed: number;
    readonly error: string | null;
}
export interface RunResult {
    readonly source: SourceId;
    readonly status: 'ok' | 'failed';
    readonly fetched: number;
    readonly created: number;
    readonly updated: number;
    readonly unchanged: number;
    readonly failed: number;
    readonly error?: string;
}
export interface IndexerService {
    applyBatch(actor: string, items: readonly NormalizedHanaInput[], context?: WriteContext): Promise<Omit<RunResult, 'source' | 'status'>>;
    runSource(actor: string, adapter: SourceAdapter, context?: {
        readonly signal?: AbortSignal;
    }): Promise<RunResult>;
    recoverInterruptedRuns(): Promise<number>;
    listItems(query?: {
        readonly after?: string;
        readonly limit?: number;
        readonly updatedSince?: string;
    }): Promise<{
        readonly items: readonly IndexedHanaDTO[];
        readonly next: string | null;
    }>;
    getItem(hanaId: string): Promise<IndexedHanaDTO>;
    listRuns(limit?: number): Promise<{
        readonly items: readonly IndexRunDTO[];
    }>;
}
export type { RegistryProfilePort, WriteContext };
