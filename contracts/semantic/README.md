# C-SEMANTIC · v0.19.0

Entry: `@hanamesh/api-contracts/semantic`. Install the formal Git release:
`git+https://github.com/yzsnstotz/hanamesh-api-contracts.git#v0.19.0`.

Follows **J3S1-SEM-02**, provider `@hanamesh/server-semantic@0.3.1`, tested formal main
`7930d7729d2fbaae4f096cea481d29a4c8068132` (no provider tag). Source blobs, SHA256 and
exact adaptations are in [current-provenance.json](current-provenance.json). The original
v0.18.0 receipt remains in [provenance.json](provenance.json); this manifest supersedes changed targets.

Install only in `devDependencies`, never consumer runtime dependencies or peers:

```json
{"devDependencies":{"@hanamesh/api-contracts":"git+https://github.com/yzsnstotz/hanamesh-api-contracts.git#v0.19.0"}}
```

The module build embeds its reachable runtime structures. Production plugins must not ship
or load the whole contract package. FIXTURE exports are development tools. Host composition
loads formal provider implementations from its deployment manifest.

## Host assembly

This package exposes complete module/service/HTTP/provider port declarations and named
configuration: `SemanticModuleOptions`, `SemanticModule`, `ServiceOptions`, `PluginOptions`,
`RequestActor`, `VoyageOptions`, `JevDecisionProviderOptions`, `SemanticSourcePort`,
`SemanticUnitOfWork`, `SemanticRepository`, `EmbeddingProvider`, `DecisionProvider`, and DTOs.
`SemanticService` derives all five service methods from the unchanged provider signature.
Factory/bridge/README-fetch signatures and provider classes are **type-only**; `CreateSemanticModule`,
`CreateSemanticService`, `CreateSemanticPlugin`, `BridgeSemanticUnitOfWork`,
`FetchCapabilityReadme` and `SemanticProviderExports` allow typed deployment loading. Constructor ports preserve original argument tuples and every public
instance member; private implementation fields do not become contract identity.
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

License provenance: HanaMesh server-semantic · 0.3.1 · UNLICENSED/private (unchanged metadata) ·
existing formal Git origin · approved provider declarations/docs/error metadata/minimum FIXTURE.
API package remains MIT; open-source base null; no new dependency or public npm publishing.

## Server-only current embedding facts and complete configuration

The additive `SemanticModuleWithEmbeddingFacts.embeddingFacts` exposes `SemanticEmbeddingFactsReader.list(query?)` and
readonly configuration. `SemanticRepository.listEmbeddingFacts` is optional so legacy service
repositories remain valid. `SemanticEmbeddingFactsOptions`, all fact/query/page/selection/repository
configuration types and `CreateSemanticEmbeddingFactsReader` are public. The new factory is
type-only; `SemanticEmbeddingFactsProviderExports` extends the original deployment type and
its createSemanticModule returns the current enhanced module via
`CreateSemanticModuleWithEmbeddingFacts`. Existing `SemanticModule`, `CreateSemanticModule`
and `SemanticProviderExports` retain the original three-member return shape, so old deployed
factories remain assignable. The enhanced type is derived from the complete current fixed
provider declaration, without a second maintained implementation. Fixed provider documents
describe its own current module; these compatibility aliases govern contract consumption.
There is no reader algorithm, HTTP route, SQL, model call or authorization in this package.

[EMBEDDING-FACTS.md](EMBEDDING-FACTS.md) specifies the default all-provider/all-model scope,
explicit exact paired selection, UUID keyset/scope-bound cursor, effective limit/configuration,
empty/false/null, unchanged storage errors and host lifetime. Each page is current state,
without a cross-page snapshot. `oldestCurrentEmbeddedAt` is current stored rows' MIN in UTC
with six fractional digits; updates/deletes can move it. It is never permanent first history.
After existing admin authorization, the host exhausts this port and C-CATALOG, intersects
Hana IDs for the numerator, and uses current Registry IDs as denominator. An empty set uses
the host's null/undefined ratio rule; provider failure is unavailable, never zero.

[CONFIGURATION.md](CONFIGURATION.md) covers every actual module/provider/HTTP/README option,
validation and error channel. `ProviderTransportOptions` adds retryBaseDelayMs,
retryBackoffFactor and safe diagnostic alongside existing timeoutMs/maxRetries.
Module and plugin expose rateLimitWindowMs; module README timeout/bytes and
`ReadmeFetchOptions` expose fetcher/timeoutMs/maxBytes/diagnostic. `SEMANTIC_DEFAULTS` and
`SEMANTIC_LIMITS` are exact provider constants, with all original defaults and safety limits
retained. New embeddingFactsPageSize/MaxPageSize are resource defaults; they do not relax
model/schema/security constraints. Plain SEMANTIC_CONFIG_INVALID/SEMANTIC_RETRY_DELAY_INVALID
remain plain Error channels. The additive SemanticError code
SEMANTIC_EMBEDDING_FACTS_PORT_REQUIRED has status500; invalid read input uses existing
SEMANTIC_INPUT_INVALID400.

`createSemanticEmbeddingFactsExamples()` / `createSemanticEmbeddingFactsFixture(seed)`
are separate recorded FIXTURE exports (also `/semantic/fixtures`): all/exact values,
limit+1 keyset records, calls and explicit failures. Unrecorded selection rejects
SEMANTIC_FIXTURE_UNRECORDED_SELECTION. They do not implement the product reader or its
input validation and are never module defaults. Original examples/repository fixture remain.
Provider documents are fixed release artifacts; local archive paths are not runnable
fixture dependencies. Evidence remains PACKAGE/FIXTURE.
