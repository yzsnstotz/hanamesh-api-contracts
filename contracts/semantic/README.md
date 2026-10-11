# C-SEMANTIC · v0.18.0

Entry: `@hanamesh/api-contracts/semantic`. Install the formal Git release:
`git+https://github.com/yzsnstotz/hanamesh-api-contracts.git#v0.18.0`.

Follows **J3S1-SEM-01**, provider `@hanamesh/server-semantic@0.2.0`, formal main/tag
`6756523ee56939873fa6f8450089bd99d911a3d5` / `v0.2.0` under D-20. All source blobs,
SHA256 and exact adaptations are in [provenance.json](provenance.json).

## Host assembly

This package exposes complete module/service/HTTP/provider port declarations and named
configuration: `SemanticModuleOptions`, `SemanticModule`, `ServiceOptions`, `PluginOptions`,
`RequestActor`, `VoyageOptions`, `JevDecisionProviderOptions`, `SemanticSourcePort`,
`SemanticUnitOfWork`, `SemanticRepository`, `EmbeddingProvider`, `DecisionProvider`, and DTOs.
`SemanticService` derives all five service methods from the unchanged provider signature.
Factory/bridge/README-fetch signatures and provider classes are **type-only**; `CreateSemanticModule`,
`CreateSemanticService`, `CreateSemanticPlugin`, `BridgeSemanticUnitOfWork`,
`FetchCapabilityReadme` and `SemanticProviderExports` allow typed deployment loading.
The actual module and constructors come from the host deployment manifest's formal
`@hanamesh/server-semantic` package, not api-contracts. There are no product runtime exports here.
Fastify types require the existing optional peer `fastify`; no new dependency is added.

```ts
import type {SemanticProviderExports, SemanticModuleOptions} from '@hanamesh/api-contracts/semantic';
declare const deploymentLoadedProvider: SemanticProviderExports;
declare const options: SemanticModuleOptions;
const semantic = deploymentLoadedProvider.createSemanticModule(options);
void semantic.services.syncProfiles({since: new Date('2026-01-01T00:00:00Z')});
```

`SemanticUnitOfWork` retains the original executor callback. The provider's type-only
`BridgeSemanticUnitOfWork` signature adapts formal `/uow` `UnitOfWork` to it; the host owns
transactions, commit/rollback, pinned connection and release. Existing `/uow` exports and
semantics are unchanged. Source reads inject the formal `/indexer-catalog` list/get subset.

## Exact provider documentation and data

[MODULE.md](MODULE.md) preserves every configuration, default, source mapping, service failure
and resource ownership rule. [API-O5.md](API-O5.md) preserves HTTP requests/responses, origins,
actor/telemetry, rate limits and error envelope. [PROVIDERS.md](PROVIDERS.md) and
[POLICY.md](POLICY.md) are fixed provider documentation; historical prices/REAL_* statements
are archival provider context, not new package verification. Four `schemas/*.json` are unchanged
provider schemas. JSON/schema/provenance package subpaths are published explicitly.

`SemanticError` is the unchanged provider class and its declared code union. Plain Error
messages and upstream errors remain separate channels documented by MODULE.md; no invented
codes, statuses, defaults or fallback behavior. Search does not invoke DecisionProvider.

## Minimum FIXTURE

`createSemanticContractExamples()` and `createSemanticRepositoryFixture(seed)` are unchanged
provider bytes (also at `/semantic/fixtures`). Examples return fresh independent fixed values.
The repository returns explicit cloned seed reads, records writes, and throws explicit
per-method `failures`. It performs no SQL, pagination, filtering, hash, model, ranking,
transaction or persistence implementation. There is no automatic switch to FIXTURE.

Evidence boundary: **PACKAGE/FIXTURE**, not REAL_DB, REAL_MODEL, REAL_HOST, REAL_UI or owner
ACCEPTED. Product factories are loaded and tested by the host follow-up card.

License provenance: HanaMesh server-semantic · 0.2.0 · UNLICENSED/private (unchanged metadata) ·
existing formal Git origin · approved provider declarations/docs/error metadata/minimum FIXTURE.
API package remains MIT; open-source base null; no new dependency or public npm publishing.
