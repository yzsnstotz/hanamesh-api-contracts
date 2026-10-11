import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTRACTS } from '@hanamesh/api-contracts';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { validatorFor } from './schema.mjs';

const catalog = () => import('@hanamesh/api-contracts/catalog');
const uuid = '00000000-0000-4000-8000-000000000007';
const owner = '00000000-0000-4000-8000-000000000008';
const executor = () => ({ async query() { throw new Error('FIXTURE executor must never execute SQL'); } });
const check = name => validatorFor(new URL('../contracts/catalog/schema.json', import.meta.url), name);

test('C-CATALOG is published at its own catalog subpath', () => {
    assert.ok(CONTRACTS['C-CATALOG'], 'provider card J3S4-REG-01 requires C-CATALOG');
    assert.equal(CONTRACTS['C-CATALOG'].provider, 'server-registry');
    assert.equal(CONTRACTS['C-CATALOG'].entry, '@hanamesh/api-contracts/catalog');
    assert.deepEqual(CONTRACTS['C-CATALOG'].consumers, ['core', 'web-market', 'server-indexer', 'server-claim', 'server-host']);
});

test('C-CATALOG describes provider signatures, HTTP route and baseline differences', async () => {
    const { CATALOG_CONTRACT_DEFINITION: d } = await catalog();
    assert.equal(CONTRACTS['C-CATALOG'].definition, d);
    assert.equal(d.protocolVersion, '1');
    assert.deepEqual(d.calls.httpGet.at, ['GET /v1/registry/hanas/:hanaId']);
    assert.equal(d.calls.httpGet.output, 'HanaProfileDTO');
    assert.equal(d.calls.listHanaProfiles.output, 'Promise<HanaProfilePage>');
    assert.equal(d.calls.upsertHanaProfile.output, 'Promise<UpsertHanaProfileResult>');
    assert.ok(d.calls.upsertHanaProfile.input.includes('RegistryIndexerSubject'));
    assert.deepEqual(d.calls.upsertHanaProfile.baselineErrors, ['REGISTRY_INPUT_INVALID', 'REGISTRY_IDENTITY_CONFLICT']);
    assert.equal(d.calls.upsertHanaProfile.errors.includes('REGISTRY_IDENTITY_CONFLICT'), false);
    assert.match(d.calls.upsertHanaProfile.note, /REGISTRY_IDENTITY_CONFLICT/);
    assert.equal(d.calls.assignHanaOwner.output, 'Promise<AssignHanaOwnerResult>');
    assert.deepEqual(d.calls.assignHanaOwner.baselineErrors, ['REGISTRY_HANA_ALREADY_OWNED', 'REGISTRY_HOST_TRANSACTION_REQUIRED']);
    assert.equal(d.calls.assignHanaOwner.errors.includes('REGISTRY_NOT_FOUND'), true);
});

test('C-CATALOG schema and declarations retain the pinned provider provenance', async () => {
    const p = JSON.parse(readFileSync(new URL('../contracts/catalog/provenance.json', import.meta.url)));
    assert.equal(p.commit, '5dcb5eed1f446c155ef9488a72452a3afb3b6195');
    assert.equal(p.card, 'J3S4-REG-01');
    for (const [path, hash] of Object.entries(p.publishedFiles)) {
        const bytes = readFileSync(new URL('../contracts/catalog/' + path, import.meta.url));
        assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, path);
    }
    const schema = JSON.parse(readFileSync(new URL('../contracts/catalog/schema.json', import.meta.url)));
    assert.equal(schema.$id, 'https://hanamesh.dev/contracts/server-registry/v1.schema.json');
    assert.match(schema['x-hanamesh'].writeContext, /not serializable JSON/);
});

test('C-CATALOG examples validate provider DTOs and cover all declared errors', async () => {
    const { createCatalogContractExamples, CATALOG_FIXTURE_LABEL, CATALOG_CONTRACT_DEFINITION: d } = await catalog();
    const e = await createCatalogContractExamples();
    assert.equal(e.label, CATALOG_FIXTURE_LABEL);
    assert.match(e.label, /FIXTURE/);
    for (const [name, value] of [['UpsertHanaProfileInput', e.input], ['HanaProfileDTO', e.profile], ['HanaProfileQuery', e.query], ['HanaProfilePage', e.page], ['UpsertHanaProfileResult', e.created], ['UpsertHanaProfileResult', e.updated], ['UpsertHanaProfileResult', e.pending]]) {
        const r = check(name)(value);
        assert.ok(r.ok, `${name}: ${JSON.stringify(r.errors)}`);
    }
    assert.equal(e.assigned.durability, 'pending-host-commit');
    assert.ok(check('HanaProfileDTO')(e.assigned.profile).ok);
    assert.equal(e.assigned.profile.ownerPrincipalId, owner);
    const codes = [...new Set(Object.values(d.calls).flatMap(c => c.errors))].sort();
    assert.deepEqual(Object.keys(e.errors).sort(), codes);
    for (const [code, response] of Object.entries(e.errors)) {
        assert.ok(check('RegistryErrorResponse')(response.body).ok);
        assert.equal(response.body.error.code, code);
        assert.ok(Number.isInteger(response.status));
    }
    assert.equal(check('UpsertHanaProfileInput')({ ...e.input, ownerPrincipalId: owner }).ok, false);
    assert.equal(check('HanaProfileQuery')({ limit: 101 }).ok, false);
});

test('C-CATALOG fixture creates and updates one stable identity, with readback and paging', async () => {
    const { createCatalogProviderFixture } = await catalog();
    const f = createCatalogProviderFixture();
    const created = await f.service.upsertHanaProfile(f.subject, f.input);
    assert.equal(created.disposition, 'created');
    assert.equal(created.durability, 'committed');
    assert.equal(created.profile.ownerPrincipalId, null);
    const updated = await f.service.upsertHanaProfile(f.subject, { ...f.input, displayName: 'FIXTURE updated', kind: 'compute', githubRepo: null });
    assert.equal(updated.disposition, 'updated');
    assert.equal(updated.profile.hanaId, created.profile.hanaId);
    assert.deepEqual(await f.service.getHanaProfile(created.profile.hanaId), updated.profile);
    await f.service.upsertHanaProfile(f.subject, { ...f.input, sourceRef: 'FIXTURE/two' });
    const page = await f.service.listHanaProfiles({ limit: 1 });
    assert.equal(page.items.length, 1);
    assert.equal(typeof page.next, 'string');
    const next = await f.service.listHanaProfiles({ after: page.next, limit: 1 });
    assert.equal(next.items.length, 1);
    assert.notEqual(next.items[0].hanaId, page.items[0].hanaId);
    assert.equal(next.next, null);
    const filtered = await f.service.listHanaProfiles({ kind: 'compute', claimed: false, search: 'updated' });
    assert.deepEqual(filtered.items, [updated.profile]);
    updated.profile.displayName = 'consumer mutation';
    assert.equal((await f.service.getHanaProfile(created.profile.hanaId)).displayName, 'FIXTURE updated');
});

test('C-CATALOG fixture rejects invalid input and indexer authority without partial writes', async () => {
    const { createCatalogProviderFixture } = await catalog();
    const f = createCatalogProviderFixture();
    const before = (await f.service.upsertHanaProfile(f.subject, f.input)).profile;
    await assert.rejects(f.service.upsertHanaProfile('', f.input), { code: 'REGISTRY_AUTH_REQUIRED', statusCode: 401 });
    await assert.rejects(f.service.upsertHanaProfile(f.deniedSubject, f.input), { code: 'REGISTRY_FORBIDDEN', statusCode: 403 });
    for (const value of [{ ...f.input, ownerPrincipalId: owner }, { ...f.input, indexedAt: 'not-a-date' }, { ...f.input, displayName: ' padded ' }, { ...f.input, githubRepo: 'https://github.com/fixture/repo' }, { ...f.input, sourceId: 'unknown' }])
        await assert.rejects(f.service.upsertHanaProfile(f.subject, value), { code: 'REGISTRY_INPUT_INVALID' });
    for (const query of [{ limit: 101 }, { claimed: 'true' }, { after: 'invalid' }, { extra: true }])
        await assert.rejects(f.service.listHanaProfiles(query), { code: 'REGISTRY_INPUT_INVALID' });
    await assert.rejects(f.service.getHanaProfile('invalid'), { code: 'REGISTRY_INPUT_INVALID' });
    await assert.rejects(f.service.getHanaProfile(uuid), { code: 'REGISTRY_NOT_FOUND', statusCode: 404 });
    assert.deepEqual(await f.service.getHanaProfile(before.hanaId), before);
    const normalized = await f.service.upsertHanaProfile(f.subject, { ...f.input, indexedAt: '2026-10-09' });
    assert.equal(normalized.profile.indexedAt, '2026-10-09T00:00:00.000Z');
});

test('C-CATALOG upsert WriteContext stays pending until fixture host commits or rolls back', async () => {
    const { createCatalogProviderFixture } = await catalog();
    const f = createCatalogProviderFixture();
    const before = (await f.service.upsertHanaProfile(f.subject, f.input)).profile;
    const context = { executor: executor() };
    const pending = await f.service.upsertHanaProfile(f.subject, { ...f.input, displayName: 'FIXTURE pending' }, context);
    assert.equal(pending.durability, 'pending-host-commit');
    assert.deepEqual(await f.service.getHanaProfile(before.hanaId), before);
    f.rollback(context.executor);
    assert.deepEqual(await f.service.getHanaProfile(before.hanaId), before);
    const committed = await f.service.upsertHanaProfile(f.subject, { ...f.input, displayName: 'FIXTURE committed' }, context);
    f.commit(context.executor);
    assert.deepEqual(await f.service.getHanaProfile(before.hanaId), committed.profile);
});

test('C-CATALOG assign owner requires host transaction, preserves owner on update and rejects every reassignment', async () => {
    const { createCatalogProviderFixture } = await catalog();
    const f = createCatalogProviderFixture();
    const profile = (await f.service.upsertHanaProfile(f.subject, f.input)).profile;
    await assert.rejects(f.service.assignHanaOwner(profile.hanaId, owner), { code: 'REGISTRY_HOST_TRANSACTION_REQUIRED', statusCode: 500 });
    const context = { executor: executor() };
    await assert.rejects(f.service.assignHanaOwner('invalid', owner), { code: 'REGISTRY_INPUT_INVALID' });
    await assert.rejects(f.service.assignHanaOwner(uuid, owner, context), { code: 'REGISTRY_NOT_FOUND' });
    const pending = await f.service.assignHanaOwner(profile.hanaId, owner, context);
    assert.equal(pending.durability, 'pending-host-commit');
    assert.equal(pending.profile.ownerPrincipalId, owner);
    assert.equal((await f.service.getHanaProfile(profile.hanaId)).ownerPrincipalId, null);
    await assert.rejects(f.service.assignHanaOwner(profile.hanaId, owner, context), { code: 'REGISTRY_HANA_ALREADY_OWNED', statusCode: 409 });
    f.rollback(context.executor);
    assert.equal((await f.service.getHanaProfile(profile.hanaId)).ownerPrincipalId, null);
    await f.service.assignHanaOwner(profile.hanaId, owner, context);
    f.commit(context.executor);
    assert.equal((await f.service.listHanaProfiles({ claimed: true })).items.length, 1);
    const updated = await f.service.upsertHanaProfile(f.subject, { ...f.input, displayName: 'FIXTURE owned update' });
    assert.equal(updated.profile.ownerPrincipalId, owner);
    await assert.rejects(f.service.assignHanaOwner(profile.hanaId, owner, { executor: executor() }), { code: 'REGISTRY_HANA_ALREADY_OWNED' });
});

test('C-CATALOG upsert and owner assignment share the exact fixture host transaction', async () => {
    const { createCatalogProviderFixture } = await catalog();
    const f = createCatalogProviderFixture();
    const context = { executor: executor() };
    const pending = await f.service.upsertHanaProfile(f.subject, f.input, context);
    const assigned = await f.service.assignHanaOwner(pending.profile.hanaId, owner, context);
    await assert.rejects(f.service.getHanaProfile(pending.profile.hanaId), { code: 'REGISTRY_NOT_FOUND' });
    f.commit(context.executor);
    assert.deepEqual(await f.service.getHanaProfile(pending.profile.hanaId), assigned.profile);
});
