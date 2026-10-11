const definitions = {
    CLAIM_AUTH_REQUIRED: [401, 'Authentication required'],
    CLAIM_FORBIDDEN: [403, 'Claim access denied'],
    CLAIM_NOT_FOUND: [404, 'Claim not found'],
    CLAIM_INPUT_INVALID: [400, 'Invalid claim request'],
    CLAIM_ORIGIN_REJECTED: [403, 'Origin rejected'],
    CLAIM_CONTENT_TYPE_REQUIRED: [415, 'Content-Type application/json is required'],
    CLAIM_GITHUB_LOGIN_REQUIRED: [409, 'GitHub login is required'],
    CLAIM_NO_RELATION: [403, 'Account has no GitHub relation to this repository'],
    CLAIM_GITHUB_ALREADY_LINKED: [409, 'Account has conflicting linked GitHub identities'],
    CLAIM_HANA_NO_REPO: [409, 'Hana has no GitHub repository'],
    CLAIM_ALREADY_ACTIVE: [409, 'Hana already has an active claim'],
    CLAIM_PROOF_UNAVAILABLE: [503, 'GitHub proof is temporarily unavailable'],
    CLAIM_STAGE_NOT_AVAILABLE: [409, 'This claim stage is not available'],
    CLAIM_CONFLICT: [409, 'Claim state changed concurrently'],
    CLAIM_UNAVAILABLE: [503, 'Claim service is temporarily unavailable'],
};
export class ClaimError extends Error {
    code;
    statusCode;
    constructor(code, options) {
        super(definitions[code][1], options);
        this.code = code;
        this.name = 'ClaimError';
        this.statusCode = definitions[code][0];
    }
    toJSON() { return { error: { code: this.code, message: this.message } }; }
}
export function safeClaimError(error) {
    return error instanceof ClaimError ? error : new ClaimError('CLAIM_UNAVAILABLE');
}
