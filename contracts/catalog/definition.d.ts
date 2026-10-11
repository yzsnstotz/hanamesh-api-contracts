/** Browser-safe registry v1 DTOs. No framework, ORM, Node, credentials, or auth imports. */
export declare const REGISTRY_PROTOCOL_VERSION: "1";
export declare const HANA_PROFILE_SOURCES: readonly ["awesome", "1024store", "hanamesh"];
export declare const HANA_PROFILE_KINDS: readonly ["interface", "compute"];
export type HanaProfileSourceId = typeof HANA_PROFILE_SOURCES[number];
export type HanaProfileKind = typeof HANA_PROFILE_KINDS[number];
export interface UpsertHanaProfileInput {
    readonly sourceId: HanaProfileSourceId;
    readonly sourceRef: string;
    readonly displayName: string;
    readonly kind: HanaProfileKind;
    readonly githubRepo: string | null;
    readonly homepage: string | null;
    readonly indexedAt: string;
}
export interface HanaProfileDTO extends UpsertHanaProfileInput {
    readonly hanaId: string;
    readonly ownerPrincipalId: string | null;
}
export interface HanaProfileQuery {
    readonly search?: string;
    readonly sourceId?: HanaProfileSourceId;
    readonly kind?: HanaProfileKind;
    readonly claimed?: boolean;
    readonly after?: string;
    readonly limit?: number;
}
export interface HanaProfilePage {
    readonly items: readonly HanaProfileDTO[];
    readonly next: string | null;
}
export interface UpsertHanaProfileResult {
    readonly disposition: 'created' | 'updated';
    readonly durability: 'committed' | 'pending-host-commit';
    readonly profile: HanaProfileDTO;
}
export interface AssignHanaOwnerResult {
    readonly durability: 'pending-host-commit';
    readonly profile: HanaProfileDTO;
}
export interface RegistryErrorResponse {
    readonly error: {
        readonly code: string;
        readonly message: string;
    };
}
