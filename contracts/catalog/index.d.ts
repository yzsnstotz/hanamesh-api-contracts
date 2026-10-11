export * from './definition.js';
export * from './provider.js';
export * from './fixtures.js';
import type { RegistryErrorResponse } from './definition.js';

export declare const CATALOG_ERRORS: Readonly<{
    REGISTRY_INPUT_INVALID: readonly [400, string];
    REGISTRY_AUTH_REQUIRED: readonly [401, string];
    REGISTRY_FORBIDDEN: readonly [403, string];
    REGISTRY_NOT_FOUND: readonly [404, string];
    REGISTRY_HOST_TRANSACTION_REQUIRED: readonly [500, string];
    REGISTRY_HANA_ALREADY_OWNED: readonly [409, string];
    REGISTRY_UNAVAILABLE: readonly [503, string];
    REGISTRY_ORIGIN_REJECTED: readonly [403, string];
}>;
/** Locally described profile error codes; injected ports/storage can propagate other codes. */
export type CatalogErrorCode = keyof typeof CATALOG_ERRORS;
export declare class RegistryError extends Error {
    readonly code: CatalogErrorCode;
    readonly statusCode: number;
    constructor(code: CatalogErrorCode, statusCode?: number);
}
export interface CatalogCall {
    readonly from: readonly string[];
    readonly kind: 'http' | 'service';
    readonly at: readonly string[];
    readonly input: string;
    readonly output: string;
    readonly errors: readonly CatalogErrorCode[];
    readonly baselineErrors: readonly string[];
    readonly errorChannel: string;
    readonly implemented: true;
    readonly note: string;
}
export declare const CATALOG_CONTRACT_DEFINITION: Readonly<{
    id: 'C-CATALOG'; provider: 'server-registry'; protocolVersion: '1'; source: string;
    types: Readonly<Record<string, unknown>>;
    calls: Readonly<Record<'httpGet' | 'httpList' | 'httpUpsert' | 'upsertHanaProfile' | 'listHanaProfiles' | 'getHanaProfile' | 'assignHanaOwner', CatalogCall>>;
}>;
export interface CatalogErrorExample { readonly status: number; readonly body: RegistryErrorResponse }
