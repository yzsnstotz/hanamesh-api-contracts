/** Browser-safe claim protocol. */
export declare const CLAIM_PROTOCOL_VERSION: "1";
export declare const CLAIM_STATES: readonly ["unclaimed", "claiming", "claimed", "on_chain", "withdrawable"];
export type ClaimState = (typeof CLAIM_STATES)[number];
export type ClaimRelation = 'owner' | 'repo-admin' | 'repo-maintain' | 'org-member';
export interface ClaimDTO {
    readonly claimId: string;
    readonly hanaId: string;
    readonly principalId: string;
    readonly githubRepo: string;
    readonly state: ClaimState;
    readonly relation: ClaimRelation | null;
    readonly failureReason: string | null;
    readonly createdAt: string;
    readonly updatedAt: string;
}
export interface ClaimEventDTO {
    readonly eventId: string;
    readonly claimId: string;
    readonly fromState: ClaimState | null;
    readonly toState: ClaimState;
    readonly reason: string | null;
    readonly actorPrincipalId: string | null;
    readonly at: string;
}
export interface PublicClaimStatusDTO {
    readonly state: ClaimState;
    readonly claimedByPrincipalId: string | null;
}
export interface ClaimErrorResponse {
    readonly error: {
        readonly code: ClaimErrorCode;
        readonly message: string;
    };
}
export declare const CLAIM_ERROR_CODES: readonly ["CLAIM_AUTH_REQUIRED", "CLAIM_FORBIDDEN", "CLAIM_NOT_FOUND", "CLAIM_INPUT_INVALID", "CLAIM_ORIGIN_REJECTED", "CLAIM_CONTENT_TYPE_REQUIRED", "CLAIM_GITHUB_LOGIN_REQUIRED", "CLAIM_HANA_NO_REPO", "CLAIM_ALREADY_ACTIVE", "CLAIM_PROOF_UNAVAILABLE", "CLAIM_NO_RELATION", "CLAIM_GITHUB_ALREADY_LINKED", "CLAIM_STAGE_NOT_AVAILABLE", "CLAIM_CONFLICT", "CLAIM_UNAVAILABLE"];
export type ClaimErrorCode = (typeof CLAIM_ERROR_CODES)[number];
