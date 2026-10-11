import type { FastifyPluginAsync } from 'fastify';
import type { IdentityServices, SessionCredentials, VerifiedActor } from '@hanamesh/api-contracts/identity';
import type { SqlExecutor, SqlPool, WriteContext, UnitOfWork } from '@hanamesh/api-contracts/uow';
import type { RegistryCatalogPort } from '@hanamesh/api-contracts/catalog';
import type { ClaimDTO, ClaimRelation, PublicClaimStatusDTO } from './contracts.js';
export type { SessionCredentials, SqlExecutor, SqlPool, VerifiedActor, WriteContext, UnitOfWork };
export interface OnClaimedEvent {
    readonly claimId: string;
    readonly hanaId: string;
    readonly principalId: string;
    readonly relation: ClaimRelation;
    readonly githubOwnerId: string;
}
export type OnClaimed = (event: OnClaimedEvent, context: WriteContext) => Promise<void>;
export interface ClaimPolicy {
    readonly pendingTtlMs?: number;
}
export interface ClaimService {
    startClaim(credentials: SessionCredentials, hanaId: string, context?: WriteContext): Promise<ClaimDTO>;
    verifyClaim(credentials: SessionCredentials, claimId: string, context?: WriteContext): Promise<ClaimDTO>;
    expireClaims(now: Date, context?: WriteContext): Promise<readonly ClaimDTO[]>;
    getOwnClaim(credentials: SessionCredentials, claimId: string): Promise<ClaimDTO>;
    listOwnClaims(credentials: SessionCredentials): Promise<readonly ClaimDTO[]>;
    getPublicStatus(hanaId: string): Promise<PublicClaimStatusDTO>;
}
export interface ClaimModuleOptions {
    readonly pool: SqlPool;
    readonly identity: Pick<IdentityServices, 'authenticate' | 'principalLinks' | 'githubProof'>;
    /** `listHanaProfiles` is optional; only the development page uses it to look up a Hana by name or repository. */
    readonly registry: Pick<RegistryCatalogPort, 'getHanaProfile'> & Partial<Pick<RegistryCatalogPort, 'listHanaProfiles'>>;
    readonly onClaimed: OnClaimed;
    readonly unitOfWork: UnitOfWork;
    readonly allowedOrigins: readonly string[];
    readonly policy?: ClaimPolicy;
    readonly now?: () => Date;
    readonly randomUUID?: () => string;
    /** Local test Host only (default false): serves the `/dev/claim` page. It reads and writes only through the routes above. */
    readonly devPage?: boolean;
}
export interface ClaimModule {
    readonly plugin: FastifyPluginAsync;
    readonly service: ClaimService;
    close(): Promise<void>;
}
