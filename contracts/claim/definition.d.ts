import type { ClaimDTO, ClaimErrorCode } from './contracts.js';
export declare const CLAIM_CONTRACT_DEFINITION: Readonly<{
    id: "C-CLAIM";
    provider: "server-claim";
    protocolVersion: "1";
    start: "authenticate; prove account-linked GitHub ownership before unitOfWork; return claimed";
    retry: "same canonical account reuses claiming or returns claimed without repeating onClaimed";
    conflicts: "other account active, on_chain and withdrawable: CLAIM_ALREADY_ACTIVE";
    verify: "compatibility API: claiming -> claimed; none -> unclaimed/GITHUB_NO_RELATION";
    transaction: "host owns BEGIN/COMMIT/ROLLBACK/release; state, events and onClaimed share its executor";
    errors: Readonly<{
        [k: string]: {
            status: number;
            body: import("./contracts.js").ClaimErrorResponse;
        };
    }>;
}>;
export declare const CLAIM_FIXTURE_LABEL = "FIXTURE \u00B7 C-CLAIM \u00B7 synthetic in-memory service; no GitHub, SQL or host integration";
export declare const CLAIM_EXAMPLE: ClaimDTO;
/** Minimal consumer stub. configure the rejection explicitly; never implies actual proof or persistence. */
