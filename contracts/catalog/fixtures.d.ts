import type { AssignHanaOwnerResult, HanaProfileDTO, HanaProfilePage, HanaProfileQuery, UpsertHanaProfileInput, UpsertHanaProfileResult } from './definition.js';
import type { RegistryCatalogPort, SqlExecutor } from './provider.js';
import type { CatalogErrorCode, CatalogErrorExample } from './index.js';
export declare const CATALOG_FIXTURE_LABEL: 'FIXTURE · C-CATALOG profile v1 (synthetic; not product authentication or durable storage)';
export declare const REGISTRY_FIXTURE_SUBJECT: 'registry:FIXTURE:allowed';
export declare function registryProfileInput(sourceRef?: string): UpsertHanaProfileInput;
export interface CatalogProviderFixture {
    readonly label: typeof CATALOG_FIXTURE_LABEL;
    readonly subject: typeof REGISTRY_FIXTURE_SUBJECT;
    readonly deniedSubject: string;
    readonly input: UpsertHanaProfileInput;
    readonly service: RegistryCatalogPort;
    /** Fixture-only host controls. No real SQL/transaction/concurrency simulation. */
    commit(executor: SqlExecutor): void;
    rollback(executor: SqlExecutor): void;
}
export declare function createCatalogProviderFixture(): CatalogProviderFixture;
export interface CatalogContractExamples {
    readonly label: typeof CATALOG_FIXTURE_LABEL;
    readonly input: UpsertHanaProfileInput;
    readonly profile: HanaProfileDTO;
    readonly query: HanaProfileQuery;
    readonly page: HanaProfilePage;
    readonly created: UpsertHanaProfileResult;
    readonly updated: UpsertHanaProfileResult;
    readonly pending: UpsertHanaProfileResult;
    readonly assigned: AssignHanaOwnerResult;
    readonly http: {
        readonly get: { readonly status: 200; readonly body: HanaProfileDTO };
        readonly list: { readonly status: 200; readonly body: HanaProfilePage };
        readonly created: { readonly status: 201; readonly body: { readonly created: true; readonly profile: HanaProfileDTO } };
        readonly updated: { readonly status: 200; readonly body: { readonly created: false; readonly profile: HanaProfileDTO } };
    };
    readonly errors: Readonly<Record<CatalogErrorCode, CatalogErrorExample>>;
}
export declare function createCatalogContractExamples(): Promise<CatalogContractExamples>;
