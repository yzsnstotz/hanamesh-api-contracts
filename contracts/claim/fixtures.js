import { CLAIM_EXAMPLE, CLAIM_FIXTURE_LABEL, CLAIM_CONTRACT_DEFINITION } from './definition.js';
import { createClaimService } from './fixture-service.js';
const copy = value => structuredClone(value);
/** Final provider service logic with synthetic ports; not a production module factory. */
export function createClaimProviderFixture(options = {}) {
    let claims = copy(options.claims ?? []), events = [], hookWrites = [];
    const usedExecutors = [], transactions = [], proofActors = [];
    let principalId = CLAIM_EXAMPLE.principalId, relation = 'owner', proofError, hookError, sequence = 0;
    const now = () => new Date(CLAIM_EXAMPLE.updatedAt);
    const canonical = id => options.canonicalIds?.[id] ?? id;
    const record = context => { usedExecutors.push(context.executor); };
    const event = (claim, from, reason, actor) => events.push({eventId: `eeeeeeee-eeee-4eee-8eee-${String(++sequence).padStart(12, '0')}`, claimId: claim.claimId, fromState: from, toState: claim.state, reason, actorPrincipalId: actor, at: now().toISOString()});
    const store = {
        async lockHana(_id, context) { record(context); },
        async findActiveByHana(id, context) { if (context) record(context); return copy(claims.find(c => c.hanaId === id && c.state !== 'unclaimed') ?? null); },
        async findById(id, context) { if (context) record(context); return copy(claims.find(c => c.claimId === id) ?? null); },
        async listByPrincipal(id) { return copy(claims.filter(c => c.principalId === id)); },
        async createClaim(input, context) {
            record(context);
            const claim = {...CLAIM_EXAMPLE, claimId: input.claimId, hanaId: input.hanaId, principalId: input.principalId, githubRepo: input.githubRepo, state: 'claiming', relation: null, failureReason: null};
            claims.push(claim); event(claim, 'unclaimed', null, input.principalId); return copy(claim);
        },
        async markClaimed(input, context) {
            record(context); const claim = claims.find(c => c.claimId === input.claimId);
            const from = claim.state; Object.assign(claim, {state: 'claimed', relation: input.relation, failureReason: null, updatedAt: input.now.toISOString()});
            event(claim, from, null, input.actorPrincipalId); return copy(claim);
        },
        async markUnclaimed(input, context) {
            record(context); const claim = claims.find(c => c.claimId === input.claimId);
            const from = claim.state; Object.assign(claim, {state: 'unclaimed', failureReason: input.reason, updatedAt: input.now.toISOString()});
            event(claim, from, input.reason, input.actorPrincipalId); return copy(claim);
        },
        // Minimal fixture has no expiry scheduler or clock progression.
        async expireBefore() { return []; },
    };
    const unitOfWork = async work => {
        const snapshot = copy({claims, events, hookWrites});
        const executor = {async query() { throw new Error('FIXTURE: SQL unavailable'); }};
        const transaction = {executor, outcome: 'pending'}; transactions.push(transaction);
        try { const result = await work({executor}); transaction.outcome = 'committed'; return result; }
        catch (error) { ({claims, events, hookWrites} = snapshot); transaction.outcome = 'rolled-back'; throw error; }
    };
    const identity = {
        async authenticate() { return {principal: {principalId}}; },
        principalLinks: {async resolveCanonical(id) { return {canonicalPrincipalId: canonical(id), linkedDevicePrincipalIds: []}; }},
        githubProof: {async verifyRepositoryOwnership(actor) {
            proofActors.push(actor); if (proofError) throw proofError;
            return {relation, githubUserId: 'FIXTURE-github-user'};
        }},
    };
    const service = createClaimService({identity, registry: {async getHanaProfile() { return {githubRepo: options.githubRepo === undefined ? CLAIM_EXAMPLE.githubRepo : options.githubRepo}; }}, store, unitOfWork,
        async onClaimed(value, context) { record(context); hookWrites.push(copy(value)); if (hookError) throw hookError; },
        pendingTtlMs: 60000, now, randomUUID: () => `cccccccc-cccc-4ccc-8ccc-${String(++sequence).padStart(12, '0')}`});
    return {label: CLAIM_FIXTURE_LABEL, service, transactions, usedExecutors, proofActors,
        get claims() { return copy(claims); }, get events() { return copy(events); }, get hookWrites() { return copy(hookWrites); },
        setPrincipal(id) { principalId = id; }, setProof(value, error) { relation = value; proofError = error; }, setHookError(error) { hookError = error; }};
}
export function createClaimContractExamples() {
    return {label: CLAIM_FIXTURE_LABEL, claimed: copy(CLAIM_EXAMPLE),
        pending: {...copy(CLAIM_EXAMPLE), state: 'claiming', relation: null},
        verifyNoRelation: {...copy(CLAIM_EXAMPLE), state: 'unclaimed', relation: null, failureReason: 'GITHUB_NO_RELATION'},
        errors: copy(CLAIM_CONTRACT_DEFINITION.errors),
        start: {status: 201, body: copy(CLAIM_EXAMPLE)},
        transaction: {success: ['proof', 'BEGIN', 'claiming event', 'claimed event', 'onClaimed(same executor)', 'COMMIT'], failure: ['proof', 'BEGIN', 'claiming event', 'claimed event', 'onClaimed throws', 'ROLLBACK']}};
}
export {createClaimServiceFixture} from './definition.js';
