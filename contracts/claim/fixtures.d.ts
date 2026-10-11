import type {ClaimDTO, ClaimEventDTO, ClaimRelation, ClaimErrorResponse} from './contracts.js';
import type {ClaimService, OnClaimedEvent, SqlExecutor} from './provider.js';
export interface ClaimProviderFixture {
    readonly label: string; readonly service: ClaimService;
    readonly claims: ClaimDTO[]; readonly events: ClaimEventDTO[]; readonly hookWrites: OnClaimedEvent[];
    readonly transactions: {executor: SqlExecutor; outcome: 'pending'|'committed'|'rolled-back'}[];
    readonly usedExecutors: SqlExecutor[]; readonly proofActors: unknown[];
    setPrincipal(id: string): void;
    setProof(relation: ClaimRelation|'none', error?: unknown): void;
    setHookError(error?: unknown): void;
}
export declare function createClaimProviderFixture(options?: {claims?: readonly ClaimDTO[]; githubRepo?: string|null; canonicalIds?: Readonly<Record<string,string>>}): ClaimProviderFixture;
export declare function createClaimContractExamples(): {
    label: string; claimed: ClaimDTO; pending: ClaimDTO; verifyNoRelation: ClaimDTO;
    errors: Record<string,{status:number;body:ClaimErrorResponse}>;
    start: {status:201;body:ClaimDTO}; transaction: {success:string[];failure:string[]};
};

/** Provider's original fixed-result/rejection stub; does not implement transitions. */
export declare function createClaimServiceFixture(rejection?: import('./contracts.js').ClaimErrorCode): {label:string;service:ClaimService};
