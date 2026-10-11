import { CONTRACTS } from '@hanamesh/api-contracts';
import { createCatalogProviderFixture } from '@hanamesh/api-contracts/catalog';
import type { RegistryCatalogPort, RegistryProfilePort, UpsertHanaProfileInput, UpsertHanaProfileResult, HanaProfileDTO, HanaProfilePage, AssignHanaOwnerResult, RegistryIndexerSubject } from '@hanamesh/api-contracts/catalog';
import type { WriteContext } from '@hanamesh/api-contracts/identity';

const fixture = createCatalogProviderFixture();
const port: RegistryCatalogPort = fixture.service;
const profilePort: RegistryProfilePort = port;
const subject: RegistryIndexerSubject = fixture.subject;
const context: WriteContext = { executor: { async query() { return { rows: [], rowCount: 0 }; } } };
async function consume(): Promise<[UpsertHanaProfileResult, HanaProfileDTO, HanaProfilePage, AssignHanaOwnerResult]> {
    const upsert = await port.upsertHanaProfile(subject, fixture.input, context);
    const profile = await profilePort.getHanaProfile(upsert.profile.hanaId);
    const page = await profilePort.listHanaProfiles({ claimed: false, limit: 1 });
    const assigned = await port.assignHanaOwner(profile.hanaId, 'principal', context);
    // @ts-expect-error host-owned assignment never reports committed
    const committed: 'committed' = assigned.durability;
    // @ts-expect-error public profile is readonly
    profile.ownerPrincipalId = 'client';
    // @ts-expect-error upsert input cannot assign an owner
    const injected: UpsertHanaProfileInput = { ...fixture.input, ownerPrincipalId: 'client' };
    // @ts-expect-error upsert subject is required
    void port.upsertHanaProfile(fixture.input);
    // @ts-expect-error legacy HTTP query string is not the service boolean
    void port.listHanaProfiles({ claimed: 'true' });
    void committed; void injected;
    return [upsert, profile, page, assigned];
}
void consume; void CONTRACTS['C-CATALOG'].definition.calls.assignHanaOwner.errors;
