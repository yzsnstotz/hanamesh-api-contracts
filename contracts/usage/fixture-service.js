// FIXTURE ONLY: provider's three service methods; SQL and transaction executor are injected synthetic ports.
import { UsageError, identityError } from './errors.js';
import { deviceId as validDeviceId } from './validation.js';
import { clockRejection, eventDigest, validateContributionWindow, validateUsageEvent, verifyEventSignature } from './events.js';
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const ZERO = '00000000-0000-4000-8000-000000000000';
/** B7: identity's GitHub account name rides along unchanged; anything but the exact {provider:'github',displayName:non-empty string} shape is dropped, never guessed. */
const linkedAccount = (value) => { const v = value; return v && v.provider === 'github' && typeof v.displayName === 'string' && v.displayName.length > 0 ? { provider: 'github', displayName: v.displayName } : undefined; };
function header(request, name) { const entry = Object.entries(request.headers).find(([k]) => k.toLowerCase() === name); return typeof entry?.[1] === 'string' ? entry[1] : undefined; }
function acceptedEvent(owner, event) {
    return { usageEventId: event.eventId, hanaId: event.hanaRef, deviceId: event.deviceId, principalId: owner.principalId, action: event.action, occurredAt: event.occurredAt,
        ...(event.sourceHanaRef === undefined ? {} : { sourceHanaRef: event.sourceHanaRef }), ...(event.targetRef === undefined ? {} : { targetRef: event.targetRef }),
        ...(event.receipt === undefined ? {} : { receipt: { providerId: event.receipt.providerId, model: event.receipt.model, count: event.receipt.count } }) };
}
export function createFixtureService(options, events, withExecutor) {
    const now = options.now, retentionDays = 90;
    const stored = async (work) => { try {
        return await work();
    }
    catch (error) {
        if (error instanceof UsageError)
            throw error;
        throw new UsageError('USAGE_STORAGE_UNAVAILABLE');
    } };
    const deviceActor = async (request) => {
        try {
            const auth = options.identity.deviceAuth;
            if (!auth || typeof auth.authenticateDevice !== 'function')
                throw new UsageError('USAGE_IDENTITY_REQUIRED');
            const actor = await auth.authenticateDevice(request);
            if (actor.principal.deploymentId !== options.deploymentId || !UUID.test(actor.principal.principalId))
                throw new UsageError('USAGE_FORBIDDEN');
            return actor;
        }
        catch (error) {
            if (error instanceof UsageError)
                throw error;
            throw identityError(error);
        }
    };
    const subject = async (credentials) => {
        if (credentials.deviceRequest) {
            const actor = await deviceActor(credentials.deviceRequest);
            const resolved = await options.identity.principalLinks.resolveCanonical(actor.principal.principalId);
            return { owner: { deploymentId: options.deploymentId, principalId: actor.principal.principalId }, principalIds: [actor.principal.principalId], canonicalPrincipalId: resolved.canonicalPrincipalId, bound: resolved.canonicalPrincipalId !== actor.principal.principalId, deviceCount: 1, device: true, account: linkedAccount(resolved.account) };
        }
        try {
            const actor = await options.identity.authenticate(credentials.cookie === undefined ? {} : { cookie: credentials.cookie });
            if (actor.principal.deploymentId !== options.deploymentId)
                throw new UsageError('USAGE_FORBIDDEN');
            const resolved = await options.identity.principalLinks.resolveCanonical(actor.principal.principalId), ids = [resolved.canonicalPrincipalId, ...resolved.linkedDevicePrincipalIds];
            return { owner: { deploymentId: options.deploymentId, principalId: actor.principal.principalId }, principalIds: [...new Set(ids)], canonicalPrincipalId: resolved.canonicalPrincipalId, bound: resolved.linkedDevicePrincipalIds.length > 0, deviceCount: resolved.linkedDevicePrincipalIds.length, device: false, account: linkedAccount(resolved.account) };
        }
        catch (error) {
            if (error instanceof UsageError)
                throw error;
            throw identityError(error);
        }
    };
    const configure = async (executor, principalIds, deviceId, maintenance = false) => { await executor.query("SELECT set_config('hanamesh_usage.principal_ids',$1,true),set_config('hanamesh_usage.device_id',$2,true),set_config('hanamesh_usage.maintenance',$3,true)", [principalIds.join(','), deviceId ?? '', maintenance ? 'on' : 'off']); };
    return {
        async ingestEvents(request, input, context) {
            if (!Array.isArray(input) || input.length < 1 || input.length > 200)
                throw new UsageError('USAGE_INPUT_INVALID');
            const actor = await deviceActor(request), authDevice = header(request, 'x-hm-device-id');
            const valid = [], rejected = [], keys = new Map();
            for (const raw of input) {
                let event;
                try {
                    event = validateUsageEvent(raw);
                }
                catch {
                    const id = raw && typeof raw === 'object' && 'eventId' in raw && typeof raw.eventId === 'string' && raw.eventId.length <= 64 ? raw.eventId : 'invalid';
                    rejected.push({ eventId: id, code: 'USAGE_INPUT_INVALID' });
                    continue;
                }
                if (authDevice && authDevice !== event.deviceId)
                    throw new UsageError('USAGE_DEVICE_MISMATCH');
                let key = keys.get(event.deviceId);
                try {
                    if (!key) {
                        key = await options.identity.deviceAuth.getDevicePublicKey(event.deviceId);
                        keys.set(event.deviceId, key);
                    }
                }
                catch (error) {
                    throw identityError(error);
                }
                if (key.status !== 'active')
                    throw new UsageError('USAGE_DEVICE_REVOKED');
                if (key.principalId !== actor.principal.principalId)
                    throw new UsageError('USAGE_DEVICE_MISMATCH');
                if (!verifyEventSignature(event, key.publicKey))
                    throw new UsageError('USAGE_SIGNATURE_INVALID');
                valid.push(event);
            }
            const owner = { deploymentId: options.deploymentId, principalId: actor.principal.principalId };
            return stored(async () => {
                const counts = await withExecutor(options.pool, owner, context, async (executor) => {
                    await configure(executor, [owner.principalId], authDevice ?? valid[0]?.deviceId);
                    let duplicates = 0;
                    const accepted = [];
                    for (const event of valid) {
                        const skew = clockRejection(event, now(), 90);
                        if (skew) {
                            rejected.push({ eventId: event.eventId, code: skew });
                            continue;
                        }
                        const result = await events.insert(executor, owner, event, eventDigest(event));
                        if (result === 'accepted')
                            accepted.push(acceptedEvent(owner, event));
                        else if (result === 'duplicate')
                            duplicates++;
                        else
                            rejected.push({ eventId: event.eventId, code: result === 'event-conflict' ? 'USAGE_EVENT_CONFLICT' : 'USAGE_NONCE_REUSED' });
                    }
                    // rc.4: the host hook sees only the rows this batch really inserted, inside the same transaction; a throw rolls the whole batch back.
                    if (accepted.length > 0 && options.onEventsAccepted) {
                        try {
                            await options.onEventsAccepted(Object.freeze(accepted.map(e => Object.freeze(e))), { executor });
                        }
                        catch {
                            throw new UsageError('USAGE_EVENT_HOOK_FAILED');
                        }
                    }
                    return { accepted: accepted.length, duplicates };
                });
                return { ...counts, rejected, durability: context === undefined ? 'committed' : 'pending-host-commit' };
            });
        },
        async getContributions(credentials, windowInput, context) { const s = await subject(credentials), window = validateContributionWindow(windowInput); return stored(() => withExecutor(options.pool, s.owner, context, async (executor) => { await configure(executor, s.principalIds); const result = await events.contribution(executor, options.deploymentId, s.principalIds, window); return { ...result, availability: availability(result, window, now(), retentionDays), window, canonicalPrincipalId: s.canonicalPrincipalId, bound: s.bound, deviceCount: s.deviceCount, ...(s.account ? { account: s.account } : {}) }; })); },
        async withdrawEvents(credentials, deviceId, context) { const s = await subject(credentials), id = validDeviceId(deviceId); let owner = s.owner; if (s.device) {
            const authDevice = header(credentials.deviceRequest, 'x-hm-device-id');
            if (authDevice && authDevice !== id)
                throw new UsageError('USAGE_DEVICE_MISMATCH');
        }
        else {
            const key = await options.identity.deviceAuth.getDevicePublicKey(id);
            if (!s.principalIds.includes(key.principalId))
                throw new UsageError('USAGE_FORBIDDEN');
            owner = { deploymentId: options.deploymentId, principalId: key.principalId };
        } return stored(async () => { const result = await withExecutor(options.pool, owner, context, async (executor) => { await configure(executor, [owner.principalId], id); return events.withdraw(executor, owner, id); }); return { ...result, durability: context === undefined ? 'committed' : 'pending-host-commit' }; }); }
    };
}
function availability(result, window, now, retentionDays) { return result.byHana.length === 0 && Date.parse(window.to) <= now - retentionDays * 86400000 && result.sources.rollups === 0 ? 'unavailable' : result.availability; }
