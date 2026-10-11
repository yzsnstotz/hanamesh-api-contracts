import { CLAIM_ERROR_CODES } from './contracts.js';
import { ClaimError } from './errors.js';
export const CLAIM_CONTRACT_DEFINITION = Object.freeze({
    id: 'C-CLAIM', provider: 'server-claim', protocolVersion: '1',
    start: 'authenticate; prove account-linked GitHub ownership before unitOfWork; return claimed',
    retry: 'same canonical account reuses claiming or returns claimed without repeating onClaimed',
    conflicts: 'other account active, on_chain and withdrawable: CLAIM_ALREADY_ACTIVE',
    verify: 'compatibility API: claiming -> claimed; none -> unclaimed/GITHUB_NO_RELATION',
    transaction: 'host owns BEGIN/COMMIT/ROLLBACK/release; state, events and onClaimed share its executor',
    errors: Object.freeze(Object.fromEntries(CLAIM_ERROR_CODES.map(code => {
        const error = new ClaimError(code);
        return [code, { status: error.statusCode, body: error.toJSON() }];
    }))),
});
export const CLAIM_FIXTURE_LABEL = 'FIXTURE · C-CLAIM · synthetic in-memory service; no GitHub, SQL or host integration';
export const CLAIM_EXAMPLE = Object.freeze({
    claimId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', hanaId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    principalId: '11111111-1111-4111-8111-111111111111', githubRepo: 'fixture/tool', state: 'claimed',
    relation: 'owner', failureReason: null, createdAt: '2026-10-11T00:00:00.000Z', updatedAt: '2026-10-11T00:00:00.000Z',
});
/** Minimal consumer stub. configure the rejection explicitly; never implies actual proof or persistence. */
export function createClaimServiceFixture(rejection) {
    const check = () => { if (rejection)
        throw new ClaimError(rejection); };
    const result = async () => { check(); return CLAIM_EXAMPLE; };
    return { label: CLAIM_FIXTURE_LABEL, service: {
            startClaim: result, verifyClaim: result, getOwnClaim: result,
            async listOwnClaims() { check(); return [CLAIM_EXAMPLE]; },
            async expireClaims() { check(); return []; },
            async getPublicStatus() {
                check();
                return { state: 'claimed', claimedByPrincipalId: CLAIM_EXAMPLE.principalId };
            },
        } };
}
