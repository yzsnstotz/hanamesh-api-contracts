/** A configured reader binds continuation to the same actor, scope and revision. */
export interface OpsCompanionPageQuery {
  readonly limit?: number;
  readonly after?: string;
  readonly revision?: string;
}

type OpsCompanionCoverage =
  | {readonly complete: true; readonly missing: readonly []}
  | {readonly complete: false; readonly missing: readonly [string, ...string[]]};

type OpsCompanionPage<Schema, Item> = OpsCompanionCoverage & {
  readonly schema: Schema;
  readonly revision: string;
  readonly items: readonly Item[];
  /** Null ends the current snapshot. It does not establish source coverage. */
  readonly nextAfter: string | null;
};

export interface OpsPageText {
  readonly pageId: string;
  readonly texts: readonly {
    readonly key: string;
    readonly zh: string;
    readonly en: string;
    readonly ja: string;
  }[];
}

export type OpsTextPage = OpsCompanionPage<'hanamesh-ops-texts-v1', OpsPageText>;

export type OpsAccessDecision = {
  readonly pageId: string;
  /** Null is the page read decision. A named action requires its own decision. */
  readonly actionId: string | null;
  /** Module-owned resource scope, local to the trusted actor and deployment. */
  readonly scope: string;
} & (
  | {readonly status: 'allowed'; readonly policyRevision: string; readonly reason: null}
  | {readonly status: 'denied'; readonly policyRevision: string; readonly reason: string}
  | {readonly status: 'unavailable'; readonly policyRevision: string | null; readonly reason: string}
);

export type OpsAccessPage = OpsCompanionPage<'hanamesh-ops-access-v1', OpsAccessDecision>;

/** Actor construction and transport belong to the authenticated server and provider. */
export interface OpsAccessReadPort<Actor> {
  readOpsAccess(actor: Actor, query: OpsCompanionPageQuery): Promise<OpsAccessPage>;
}

export type OpsRouteBinding = {readonly pageId: string; readonly href: string} & (
  | {readonly kind: 'web-route'; readonly hostPath?: never}
  | {readonly kind: 'host-html'; readonly hostPath: string}
);

export type OpsRoutePage = OpsCompanionPage<'hanamesh-ops-routes-v1', OpsRouteBinding>;

export declare const OPS_COMPANION_LIMITS: Readonly<{
  pageItems: 200;
  responseBytes: 262144;
  manifestEntries: 512;
}>;
export declare const OPS_TEXT_PAGE_SCHEMA: Readonly<Record<string, unknown>>;
export declare const OPS_ACCESS_PAGE_SCHEMA: Readonly<Record<string, unknown>>;
export declare const OPS_ROUTE_PAGE_SCHEMA: Readonly<Record<string, unknown>>;
