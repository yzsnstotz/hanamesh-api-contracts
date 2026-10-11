# C-SEMANTIC provider · 0.2.0

Provider-owned source of truth for J3S1-APIC-19 and HOST-01. This package supplies the product factory; api-contracts supplies contracts, never that factory. The release consumes exactly `git+https://github.com/yzsnstotz/hanamesh-api-contracts.git#v0.17.0` (commit `5d4b17a1c9f439750f57a60863d2efec96cdc3aa`). Formal ports/types come from `/catalog`, `/indexer-catalog`, `/uow`. Local provider declarations in `dist` preserve the existing compatibility surface until the C-SEMANTIC follow-up release.

## Public assembly

`createSemanticModule(options: SemanticModuleOptions): SemanticModule` returns `{plugin: FastifyPluginAsync, services, mode: 'real'|'stub'}`. Mode is real only when both embedding and decision declare real. It does not infer credentials, load environment variables, start a listener, open a pool, schedule a job, migrate, or close host resources. `createSemanticService`, `PostgresSemanticRepository`, `SemanticError`, providers, normalizers, decision validation and hash helpers are public. Named configuration types are `SemanticModuleOptions`, `ServiceOptions`, `VoyageOptions`, `JevDecisionProviderOptions`, `PluginOptions` (the latter is emitted by the HTTP source; module users configure through SemanticModuleOptions).

| Module option | Required / existing behavior |
|---|---|
| pool | SqlExecutor; used for Semantic reads. Existing readonly parameters / optional rowCount preserved, derived from formal C-UOW executor/result |
| unitOfWork | Existing executor-callback SemanticUnitOfWork; required. Use bridgeSemanticUnitOfWork(hostUnitOfWork) for formal C-UOW |
| embedding | Explicit EmbeddingProvider; required. No automatic key fallback |
| allowedOrigins | Required nonempty origins; https, or localhost HTTP. Plugin validates at factory time |
| sourceCatalog | Pick<IndexerReadService,'listItems'|'getItem'>; required when no repository is injected. Host supplies readonly formal service |
| repository | Optional SemanticRepository override; owns all existing methods. An explicit override remains supported without sourceCatalog |
| decision / fallback | Optional DecisionProvider. Existing default decision is StubDecisionProvider; fallback is used only if supplied and validated decision is noMatch |
| decisionTopK / minimumConfidence / decisionPolicy | Existing defaults 20 / .35 / documented policy text. TopK accepts 1..200; options are forwarded without changing existing validation |
| rateLimitPerMinute | Existing default 30, integer >=1; HTTP identity buckets retained |
| actorResolver | Optional sync/async {kind:'anon'|'device'|'account',ref:string}; default account user.id, device header, request.ip |
| readmeFetcher | Optional async (SourceRow)=>string|null; default fetchCapabilityReadme |
| enricher | Optional ProfileEnricher; default identityProfileEnricher |
| diagnostic | Optional events with IDs/counts/provider metadata; no keys or query body |

`ServiceOptions` additionally exposes existing `now` and `queryCacheTtlMs` (default 86,400,000). They are not new module options. Source pagination uses the provider's published default page size and exhausts `next === null`, including empty pages. No cap, retry or fallback is added.

## Source mapping and consistency

All source values come from successful `sourceCatalog.listItems` results. Indexer DTO inherits the published C-CATALOG HanaProfileDTO, so no extra Registry read or snapshot promise is introduced. `getItem` is retained in the injected public read subset; sync currently uses list only. No source SQL/import/provider factory is copied.

| SourceRow | Published DTO |
|---|---|
| hanaId, sourceId, sourceRef, kind, githubRepo, homepage | Same HanaProfileDTO fields; first Registry source identity retained |
| name | displayName |
| npmPackageName, license, categories, keywords, repoUrl, repoSubdirectory | Same IndexedHanaWithContentHashDTO fields |
| summaryEn, summaryZh | summary.en, summary.zh |
| contentHash | Required stored winning catalog hash, copied unchanged; not rawHash, timestamp or a recomputed DTO digest |
| updatedAt | Source updatedAt, normalized to ISO as before |
| cachedReadme | Own semantic.source_documents.body, joined through dsh_plugin source_ref |

Semantic queries only its own objects/profiles/documents. It scans all Indexer pages and retains rows where source `updatedAt > since` OR the local profile is absent; omitted since scans all. Timestamp comparison retains strict > for source fractional precision beyond milliseconds. Local state is keyed by source_ref, as the previous join was. Output retains Hana ID ordering. Same-time existing profiles are skipped; old never-synchronized profiles and old objects without profiles are included, retaining cachedReadme. No cross-service snapshot, write provenance, private SQL, or hash validation algorithm is invented. A legacy implementation returning missing/non-string/empty contentHash fails the entire scan with `SemanticError(code='SEMANTIC_SOURCE_CONTENT_HASH_REQUIRED',statusCode=500)`; published Indexer validation remains responsible for hash format/source and may reject the whole page with `INDEXER_CONTENT_SOURCE_UNKNOWN` 500. All source list exceptions propagate unchanged. There is no catch that replaces them with stub data. Missing default source port fails module construction (`Error('SEMANTIC_SOURCE_PORT_REQUIRED')`); a directly constructed repository without a source port rejects source scan with that code and statusCode 500. Invalid source dates remain visible errors.

## UOW and resource ownership

`bridgeSemanticUnitOfWork(unitOfWork: UnitOfWork): SemanticUnitOfWork` calls the published host callback and forwards exactly `context.executor` to existing Semantic writes. It does not BEGIN/COMMIT/ROLLBACK/release or create a second connection. Formal host UnitOfWork resolves after commit; rejects on callback/transaction failure, with host-owned release. Original executor-callback injection remains supported. All profile, document, embedding, query-log, decision-log and feedback writes stay inside the supplied callback. Fetching, embedding, enriching and decisions remain outside it. Semantic reads use the injected pool outside write transactions, as before. Host owns pool, ports, Fastify app/listener, scheduler, credentials and shutdown; close the app and pool in host finally/shutdown. No long-running process is started by this package.

## Service behavior and errors

| Service | Return / failure behavior retained |
|---|---|
| syncProfiles({since?:Date}={}) | {scanned,changed,failed}; source scan/UOW persistence errors reject. README null/errors retain own cached distillate; read failure emits semantic_readme_fetch_failed. Enrichment/normalization failures count failed and emit semantic_normalize_failed. changed is semantic hash change count; metadata-only updates need no reembedding |
| runEmbeddingJob() | {embedded,skipped:0,failed}; reads pending from own tables; per-batch provider/write failures count failed with semantic_embedding_batch_failed, including rollback by host. Initial pending-read errors reject |
| search(request, actor?) | SearchResponse; only embedding/retrieval/filtering, no DecisionProvider. Existing query embedding cache and current document provider/model filter retained. Query-log write errors reject |
| recommend(request, actor?) | RecommendResponse; retrieval TopK -> bounded decision candidates -> schema/candidate/policy validation; optional fallback only after noMatch. Decision/provider/write errors reject; noMatch is a normal result |
| feedback(input) | {ok:true}; original ID/action log; UOW error rejects |

`RequestActor` is `{kind:'anon'|'device'|'account',ref:string|null}` for service calls. Existing HTTP origin/body checks, identity resolution, ownership of request IDs, telemetry and failure envelope remain in API-O5.md and schemas. HTTP maps unknown upstream failures to `SEMANTIC_PROVIDER_UNAVAILABLE` 503; known SemanticError keeps its status/code. HTTP preserves `SEMANTIC_INPUT_INVALID`400, `SEMANTIC_RATE_LIMITED`429, `SEMANTIC_DECISION_REJECTED`502. Module/plugin invalid configuration raises `SEMANTIC_CONFIG_INVALID`. Existing provider codes: `SEMANTIC_VOYAGE_KEY_REQUIRED`, `SEMANTIC_JEV_API_KEY_REQUIRED`, `SEMANTIC_EMBED_DIMENSION_INVALID`, `SEMANTIC_EMBED_BATCH_TOO_LARGE`, `SEMANTIC_DECISION_TOPK_EXCEEDED`, `SEMANTIC_DECISION_CANDIDATES_INVALID`, `SEMANTIC_PROVIDER_RESPONSE_INVALID`, `SEMANTIC_PROVIDER_UNAVAILABLE` (Voyage/HTTP can include status or TIMEOUT suffix), and disabled explicit FallbackDecisionProvider `NOT_ENABLED`. They remain Error messages where the implementation uses plain Error; do not invent structured status for them. Host/source/database/enricher failures are not rewritten as invented provider codes.

## Providers and named existing configuration

EmbeddingProvider exposes name/mode/documentModel/queryModel/dimension plus embedDocument/embedQuery -> {vectors,model,usage:{tokens}}. DecisionProvider exposes name/mode/choose and optional rank/score -> DecisionResult. Inputs and responses are fully emitted in dist/contracts.d.ts. No economics fields enter ranking or decision input.

- StubEmbeddingProvider({dimension?}={}): default1024, integer >=3; deterministic vectors, explicit fixture/local choice. StubDecisionProvider keeps retrieval score ordering.
- VoyageEmbeddingProvider(VoyageOptions): server-only apiKey required; dimension default1024, allowed256/512/1024/2048/3; documentModel voyage-4-large, queryModel voyage-4-lite; endpoint https://api.voyageai.com/v1/embeddings; injectable fetcher/sleep; timeoutMs15000/maxRetries3 retained. Single batch1..128. No provider request body/header/key is logged.
- JevDecisionProvider(JevDecisionProviderOptions): server-only apiKey required; endpoint https://api.typesafe.ai/v1/systemone, model jev-latest, maxCandidates20, timeoutMs15000/maxRetries3; injectable fetcher/sleep. Existing retry/status/choice parsing behavior unchanged.
- FallbackDecisionProvider({enabled,delegate}): enabled is explicit, otherwise rejects NOT_ENABLED. No default enabled fallback.
- fetchCapabilityReadme(row,{fetcher?,timeoutMs?}={}): existing10000ms, response max1MiB; GitHub README or npm latest metadata, null when unavailable/no repository. Distillate stays <=4096 UTF-8 bytes. Existing network behavior/limits retained, not changed by this source repair.

See PROVIDERS.md and POLICY.md for existing models, retry handling and validation. Historical REAL_* evidence there is not a new claim from this card. No paid model or database is exercised by test:contract.

## Examples, minimum fixture and migrations

Public `createSemanticContractExamples()` returns fresh fixed sourceRows/pending/candidates/changed/request/feedback. `createSemanticRepositoryFixture(seed)` clones explicit seed reads and records writes, with per-method `failures` injection. It implements no SQL, source traversal, digest algorithm, model, filtering, transaction or production persistence. It is labelled FIXTURE and is available at the root and `/fixtures` export. No credentials or operational configuration are synthesized. Formal `/indexer-catalog` and `/uow` fixtures can assemble the real Semantic module for source/UOW tests.

Example (host owns all runtime resources):

```ts
import {createSemanticModule, bridgeSemanticUnitOfWork, StubEmbeddingProvider} from '@hanamesh/server-semantic';
import type {UnitOfWork, SqlExecutor} from '@hanamesh/api-contracts/uow';
import type {IndexerReadService} from '@hanamesh/api-contracts/indexer-catalog';
declare const pool: SqlExecutor, unitOfWork: UnitOfWork, indexer: IndexerReadService;
const semantic = createSemanticModule({pool, unitOfWork:bridgeSemanticUnitOfWork(unitOfWork),
  sourceCatalog:indexer, embedding:new StubEmbeddingProvider({dimension:1024}),
  allowedOrigins:['https://market.example']});
// Host registers semantic.plugin and schedules services; this example does neither.
```

`@hanamesh/server-semantic/migrations` exposes migrationFiles/loadMigrations; the host executes the returned SQL. SQL files create only semantic plus pgvector; runtime-grants.sql grants only semantic to pre-existing hm_runtime. This card neither connects a database nor changes installed grants. Host supplies privileged migration executor and already manages the role. Existing source-service roles/grants are owned by their providers. Retained opt-in real DB/model scripts now use explicit source FIXTURE ports; they do not supply Registry/Indexer tables or prove source hash provenance.

Gates: Node24.13.1, pnpm10.33.0; check, build:source, test, self-building test:contract (runtime + strict consumer types), test:mutations, pack:local, verify:pack. This is SOURCE/FIXTURE/PACKAGE delivery, not REAL_DB/HOST/UI or owner ACCEPTED. C-SEMANTIC follows via J3S1-APIC-19 before HOST-01 assembly.
