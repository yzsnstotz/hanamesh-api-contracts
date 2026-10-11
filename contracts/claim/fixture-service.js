import { ClaimError } from './errors.js';
const FUTURE = new Set(['on_chain', 'withdrawable']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
function codeOf(error) {
    return typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : undefined;
}
function parseRepository(value) {
    if (!value)
        throw new ClaimError('CLAIM_HANA_NO_REPO');
    const stripped = value.trim().replace(/^https:\/\/github\.com\//iu, '').replace(/\.git$/iu, '').replace(/^\/+|\/+$/gu, '');
    const parts = stripped.split('/');
    if (parts.length !== 2 || parts.some(part => !/^[A-Za-z0-9_.-]{1,100}$/u.test(part))) {
        throw new ClaimError('CLAIM_HANA_NO_REPO');
    }
    return { owner: parts[0], repo: parts[1], full: `${parts[0]}/${parts[1]}` };
}
function requireUuid(value) {
    if (!UUID.test(value))
        throw new ClaimError('CLAIM_INPUT_INVALID');
}
export function createClaimService(deps) {
    const authenticate = async (credentials) => {
        let actor;
        try {
            actor = await deps.identity.authenticate(credentials);
        }
        catch (error) {
            const code = codeOf(error);
            throw new ClaimError(code === 'AUTH_REQUIRED' || code === 'IDENTITY_AUTH_FAILED' ? 'CLAIM_AUTH_REQUIRED' : 'CLAIM_UNAVAILABLE', { cause: error });
        }
        const resolved = await deps.identity.principalLinks.resolveCanonical(actor.principal.principalId);
        return { actor, principalId: resolved.canonicalPrincipalId };
    };
    const proof = async (actor, repository) => {
        try {
            return await deps.identity.githubProof.verifyRepositoryOwnership(actor, repository);
        }
        catch (error) {
            const code = codeOf(error);
            if (code === 'GITHUB_TOKEN_INVALID')
                throw new ClaimError('CLAIM_GITHUB_LOGIN_REQUIRED', { cause: error });
            if (code === 'GITHUB_API_UNAVAILABLE')
                throw new ClaimError('CLAIM_PROOF_UNAVAILABLE', { cause: error });
            if (code === 'IDENTITY_GITHUB_ALREADY_LINKED')
                throw new ClaimError('CLAIM_GITHUB_ALREADY_LINKED', { cause: error });
            throw new ClaimError('CLAIM_UNAVAILABLE', { cause: error });
        }
    };
    const write = async (context, operation) => {
        if (context)
            return operation(context);
        return deps.unitOfWork(operation);
    };
    const rejectPreopenedContext = (operation, context) => {
        if (context)
            throw new TypeError(`${operation} cannot accept a pre-opened WriteContext because GitHub proof must precede the local transaction`);
    };
    const requireOwnedClaiming = (current, principalId) => {
        if (!current)
            throw new ClaimError('CLAIM_NOT_FOUND');
        if (current.principalId !== principalId)
            throw new ClaimError('CLAIM_FORBIDDEN');
        if (FUTURE.has(current.state))
            throw new ClaimError('CLAIM_STAGE_NOT_AVAILABLE');
        if (current.state !== 'claiming')
            throw new ClaimError('CLAIM_CONFLICT');
        return current;
    };
    return {
        async startClaim(credentials, hanaId, context) {
            requireUuid(hanaId);
            rejectPreopenedContext('startClaim', context);
            const { actor, principalId } = await authenticate(credentials);
            const existing = await deps.store.findActiveByHana(hanaId);
            if (existing) {
                const owner = await deps.identity.principalLinks.resolveCanonical(existing.principalId);
                if (owner.canonicalPrincipalId !== principalId || FUTURE.has(existing.state))
                    throw new ClaimError('CLAIM_ALREADY_ACTIVE');
                if (existing.state === 'claimed')
                    return existing;
            }
            let profile;
            try {
                profile = await deps.registry.getHanaProfile(hanaId);
            }
            catch (error) {
                throw new ClaimError(codeOf(error) === 'REGISTRY_NOT_FOUND' ? 'CLAIM_HANA_NO_REPO' : 'CLAIM_UNAVAILABLE', { cause: error });
            }
            const repository = parseRepository(profile.githubRepo);
            const result = await proof(actor, repository);
            if (result.relation === 'none')
                throw new ClaimError('CLAIM_NO_RELATION');
            const relation = result.relation;
            return deps.unitOfWork(async (ctx) => {
                await deps.store.lockHana(hanaId, ctx);
                const active = await deps.store.findActiveByHana(hanaId, ctx);
                if (active) {
                    const owner = await deps.identity.principalLinks.resolveCanonical(active.principalId);
                    if (owner.canonicalPrincipalId !== principalId || FUTURE.has(active.state))
                        throw new ClaimError('CLAIM_ALREADY_ACTIVE');
                    if (active.state === 'claimed')
                        return active;
                }
                const current = active ?? await deps.store.createClaim({ claimId: deps.randomUUID(), hanaId, principalId,
                    githubRepo: repository.full, githubOwnerLogin: repository.owner, now: deps.now() }, ctx);
                // An existing pending record must refer to the repository that was actually proved.
                if (current.githubRepo !== repository.full)
                    throw new ClaimError('CLAIM_CONFLICT');
                const claimed = await deps.store.markClaimed({ claimId: current.claimId, actorPrincipalId: current.principalId,
                    relation, githubOwnerId: result.githubUserId, now: deps.now() }, ctx);
                await deps.onClaimed({ claimId: current.claimId, hanaId, principalId, relation,
                    githubOwnerId: result.githubUserId }, ctx);
                return claimed;
            });
        },
        async verifyClaim(credentials, claimId, context) {
            requireUuid(claimId);
            rejectPreopenedContext('verifyClaim', context);
            const { actor, principalId } = await authenticate(credentials);
            const current = requireOwnedClaiming(await deps.store.findById(claimId), principalId);
            const repository = parseRepository(current.githubRepo);
            const result = await proof(actor, repository);
            if (result.relation === 'none') {
                return deps.unitOfWork(async (ctx) => {
                    await deps.store.lockHana(current.hanaId, ctx);
                    requireOwnedClaiming(await deps.store.findById(claimId, ctx), principalId);
                    return deps.store.markUnclaimed({ claimId, actorPrincipalId: principalId,
                        reason: 'GITHUB_NO_RELATION', now: deps.now() }, ctx);
                });
            }
            const relation = result.relation;
            return deps.unitOfWork(async (ctx) => {
                await deps.store.lockHana(current.hanaId, ctx);
                requireOwnedClaiming(await deps.store.findById(claimId, ctx), principalId);
                const claimed = await deps.store.markClaimed({ claimId, actorPrincipalId: principalId,
                    relation, githubOwnerId: result.githubUserId, now: deps.now() }, ctx);
                // MUTATION_TARGET: hook_must_propagate_and_share_context
                await deps.onClaimed({ claimId, hanaId: claimed.hanaId, principalId, relation,
                    githubOwnerId: result.githubUserId }, ctx);
                return claimed;
            });
        },
        async expireClaims(now, context) {
            if (!(now instanceof Date) || !Number.isFinite(now.getTime()))
                throw new ClaimError('CLAIM_INPUT_INVALID');
            return write(context, ctx => deps.store.expireBefore(new Date(now.getTime() - deps.pendingTtlMs), now, ctx));
        },
        async getOwnClaim(credentials, claimId) {
            requireUuid(claimId);
            const { principalId } = await authenticate(credentials);
            const claim = await deps.store.findById(claimId);
            if (!claim || claim.principalId !== principalId)
                throw new ClaimError('CLAIM_NOT_FOUND');
            return claim;
        },
        async listOwnClaims(credentials) {
            const { principalId } = await authenticate(credentials);
            return deps.store.listByPrincipal(principalId);
        },
        async getPublicStatus(hanaId) {
            requireUuid(hanaId);
            const claim = await deps.store.findActiveByHana(hanaId);
            if (!claim)
                return { state: 'unclaimed', claimedByPrincipalId: null };
            return { state: claim.state, claimedByPrincipalId: claim.state === 'claimed' ? claim.principalId : null };
        },
    };
}
