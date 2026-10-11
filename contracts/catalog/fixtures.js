import { randomUUID } from 'node:crypto';
import { CATALOG_CONTRACT_DEFINITION, CATALOG_ERRORS, RegistryError } from './definition.js';
import { hanaProfileInput, hanaProfileQuery, id } from './validation.js';

export const CATALOG_FIXTURE_LABEL = 'FIXTURE · C-CATALOG profile v1 (synthetic; not product authentication or durable storage)';
export const REGISTRY_FIXTURE_SUBJECT = 'registry:FIXTURE:allowed';
export function registryProfileInput(sourceRef = 'FIXTURE/profile-one') {
    return { sourceId: 'hanamesh', sourceRef, displayName: 'FIXTURE Hana One', kind: 'interface', githubRepo: 'fixture/profile-one', homepage: 'https://example.test/FIXTURE/profile-one', indexedAt: '2026-10-09T00:00:00.000Z' };
}

/** Source consumer stand-in adapted to the four profile calls. commit/rollback are fixture host controls.
 * Does not execute SQL, validate an actual transaction, authenticate subjects, or model concurrent transactions.
 * assignHanaOwner follows the source service guards; the source three-method fixture has no owner-write method.
 */
export function createCatalogProviderFixture() {
    const committed = new Map(), staged = new WeakMap();
    const storeFor = executor => {
        if (!executor) return committed;
        let store = staged.get(executor);
        if (!store) { store = new Map(committed); staged.set(executor, store); }
        return store;
    };
    const profileEntry = (store, hanaId) => [...store.entries()].find(([, p]) => p.hanaId === hanaId);
    const service = {
        async upsertHanaProfile(subject, value, context) {
            const input = hanaProfileInput(value);
            if (!subject) throw new RegistryError('REGISTRY_AUTH_REQUIRED', 401);
            if (subject !== REGISTRY_FIXTURE_SUBJECT) throw new RegistryError('REGISTRY_FORBIDDEN', 403);
            const store = storeFor(context?.executor), key = input.sourceId + '\0' + input.sourceRef;
            const existing = store.get(key);
            const profile = { ...input, hanaId: existing?.hanaId ?? randomUUID(), ownerPrincipalId: existing?.ownerPrincipalId ?? null };
            store.set(key, profile);
            return { disposition: existing ? 'updated' : 'created', durability: context?.executor ? 'pending-host-commit' : 'committed', profile: { ...profile } };
        },
        async getHanaProfile(hanaId) {
            id(hanaId);
            const entry = profileEntry(committed, hanaId);
            if (!entry) throw new RegistryError('REGISTRY_NOT_FOUND', 404);
            return { ...entry[1] };
        },
        async listHanaProfiles(value = {}) {
            const q = hanaProfileQuery(value);
            let rows = [...committed.values()].filter(p => (!q.sourceId || p.sourceId === q.sourceId)
                && (!q.kind || p.kind === q.kind) && (q.claimed === undefined || (p.ownerPrincipalId !== null) === q.claimed)
                && (!q.search || [p.displayName, p.sourceRef, p.githubRepo ?? ''].some(v => v.toLowerCase().includes(q.search.toLowerCase()))))
                .sort((a, b) => a.hanaId.localeCompare(b.hanaId));
            if (q.after) rows = rows.filter(p => p.hanaId > q.after);
            const limit = q.limit ?? 20, selected = rows.slice(0, limit);
            return { items: selected.map(p => ({ ...p })), next: rows.length > limit ? selected.at(-1).hanaId : null };
        },
        async assignHanaOwner(hanaId, principalId, context) {
            const profileId = id(hanaId), ownerId = id(principalId);
            if (!context?.executor) throw new RegistryError('REGISTRY_HOST_TRANSACTION_REQUIRED', 500);
            const store = storeFor(context.executor), entry = profileEntry(store, profileId);
            if (!entry) throw new RegistryError('REGISTRY_NOT_FOUND', 404);
            if (entry[1].ownerPrincipalId !== null) throw new RegistryError('REGISTRY_HANA_ALREADY_OWNED', 409);
            const profile = { ...entry[1], ownerPrincipalId: ownerId };
            store.set(entry[0], profile);
            return { durability: 'pending-host-commit', profile: { ...profile } };
        },
    };
    return {
        label: CATALOG_FIXTURE_LABEL, subject: REGISTRY_FIXTURE_SUBJECT, deniedSubject: 'registry:FIXTURE:denied', input: registryProfileInput(), service,
        commit(executor) {
            const rows = staged.get(executor);
            if (rows) { committed.clear(); for (const [key, profile] of rows) committed.set(key, profile); staged.delete(executor); }
        },
        rollback(executor) { staged.delete(executor); },
    };
}

export async function createCatalogContractExamples() {
    const input = registryProfileInput();
    const profile = { ...input, hanaId: '00000000-0000-4000-8000-000000000007', ownerPrincipalId: null };
    const assigned = { durability: 'pending-host-commit', profile: { ...profile, ownerPrincipalId: '00000000-0000-4000-8000-000000000008' } };
    const codes = new Set(Object.values(CATALOG_CONTRACT_DEFINITION.calls).flatMap(c => c.errors));
    const errors = Object.fromEntries([...codes].map(code => {
        const [status, message] = CATALOG_ERRORS[code];
        return [code, { status, body: { error: { code, message } } }];
    }));
    return {
        label: CATALOG_FIXTURE_LABEL, input, profile, query: { sourceId: 'hanamesh', claimed: false, limit: 20 },
        page: { items: [profile], next: null },
        created: { disposition: 'created', durability: 'committed', profile },
        updated: { disposition: 'updated', durability: 'committed', profile },
        pending: { disposition: 'updated', durability: 'pending-host-commit', profile }, assigned,
        http: { get: { status: 200, body: profile }, list: { status: 200, body: { items: [profile], next: null } },
            created: { status: 201, body: { created: true, profile } }, updated: { status: 200, body: { created: false, profile } } },
        errors,
    };
}
