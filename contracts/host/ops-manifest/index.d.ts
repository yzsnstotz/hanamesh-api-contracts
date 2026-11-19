/** A module supplies the group metadata; Host must not infer it from a module/path list. */
export interface OpsPageGroup {
  readonly id: string;
  readonly labelKey: string;
  readonly order: number;
}
/** Public reference to the module's policy, never a grant or an actor-specific access result. */
export interface OpsPagePermission { readonly policyId: string }
/** DS2 §8: the owning module declares its exact page, text keys, group, order and policy. */
export interface OpsPageContribution {
  readonly id: string;
  readonly moduleId: string;
  readonly href: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly group: OpsPageGroup;
  readonly order: number;
  readonly permission: OpsPagePermission;
  readonly kind: 'page';
}
/** Public read-only declaration. paths authorizes exact GET proxy routes; pages describes navigation. */
export interface OpsManifest {
  readonly schemaVersion: 2;
  readonly paths: readonly string[];
  readonly pages: readonly OpsPageContribution[];
}
export declare const OPS_MANIFEST_SCHEMA: Readonly<Record<string, unknown>>;
export declare const OPS_PAGE_CONTRIBUTION_SCHEMA: Readonly<Record<string, unknown>>;
