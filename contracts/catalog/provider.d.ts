/** Server-only profile subset of the provider RegistryService; signatures copied verbatim. */
import type { SqlExecutor, SessionCredentials, VerifiedActor, WriteContext } from '../identity/index.js';
import type { AssignHanaOwnerResult, HanaProfileDTO, HanaProfilePage, HanaProfileQuery, UpsertHanaProfileInput, UpsertHanaProfileResult } from './definition.js';
export type { SqlExecutor, SessionCredentials, VerifiedActor, WriteContext };
export type RegistryIndexerSubject = SessionCredentials | VerifiedActor | string;
export interface RegistryCatalogPort {
    upsertHanaProfile(subject: RegistryIndexerSubject, input: UpsertHanaProfileInput, context?: WriteContext): Promise<UpsertHanaProfileResult>;
    getHanaProfile(hanaId: string): Promise<HanaProfileDTO>;
    listHanaProfiles(query?: HanaProfileQuery): Promise<HanaProfilePage>;
    assignHanaOwner(hanaId: string, principalId: string, context?: WriteContext): Promise<AssignHanaOwnerResult>;
}
/** Exact three-method subset covered by the source provider profile suite. */
export type RegistryProfilePort = Pick<RegistryCatalogPort, 'upsertHanaProfile' | 'listHanaProfiles' | 'getHanaProfile'>;
