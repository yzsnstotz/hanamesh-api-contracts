# Server-only current embedding facts · candidate 0.3.1

PM Q81 source receipt: host `origin/main` `f543ad934ea555f9235c80964eb846177b52074a`, `src/ops-metrics.ts` SHA256 `a03d47f20724c16f9924972d37e14ae05aa362dba118c7a394469db6407fb9b1`. The supplied original metric groups current Semantic embeddings by Hana and takes `MIN(embedded_at)` across all provider/model rows, then intersects current Registry Hanas and uses Registry's total as denominator. Embedding upserts replace that timestamp. This port exposes the Semantic-owned facts needed for that composition; it cannot prove permanent first embedding history.

## Public port and scope

`createSemanticModule(options).embeddingFacts: SemanticEmbeddingFactsReader` exposes `list(query?: SemanticEmbeddingFactsQuery): Promise<SemanticEmbeddingFactsPage>` and readonly `configuration`. The five original `services` and all HTTP routes remain unchanged. `createSemanticEmbeddingFactsReader({repository,pageSize?,maxPageSize?})` can also be assembled independently. The default module uses its own PostgresSemanticRepository; an injected legacy repository still works for the original services. Supply its optional `listEmbeddingFacts` method or the explicit `embeddingFactsRepository` to enable reads. An absent read method raises `SemanticError` with code `SEMANTIC_EMBEDDING_FACTS_PORT_REQUIRED`, statusCode500; it never falls back to a fixture, another store or zero.

The port is for a trusted in-process host already authorized to read that Semantic store. It does not authenticate a caller or grant a new scope. The host must retain its existing identity/admin allowlist before using these facts in a response. There is no new HTTP endpoint or anonymous/admin permission. The existing runtime role reads only the existing Semantic tables; no schema/table grants, migrations or checksums change. The host owns pool lifetime and release, including after a read error. Reads neither start a write UOW nor invoke a source service, README fetcher, embedding or decision provider.

| Field | Meaning |
|---|---|
| items[].hanaId | Unique non-null Hana UUID present in Semantic's own capability_objects; all capability types and objects for a Hana participate. No Registry membership assertion |
| items[].hasCurrentEmbedding | At least one current stored embedding row for that Hana in the selected provider/model scope; independent of profile hash freshness, active search model or eligibility |
| items[].oldestCurrentEmbeddedAt | Minimum embedded_at among those current rows, UTC RFC3339 with six fractional digits from actual PG. Null iff there is no selected embedding. Updates/deletes can move this time; never firstEmbeddedAt or first-ever history |
| selection | Effective `{kind:'all'}` by default, or `{kind:'exact',provider,model}` for the explicitly requested pair |
| limit | Effective validated page limit |
| next | Opaque continuation cursor or null after the final page |

`list({selection:{provider,model}})` matches both strings exactly, without case folding, trim, prefixes, provider-only or model-only selection. Both must be nonempty strings without surrounding whitespace. This is a different metric scope from the default old all-model coverage, so the host must label any selected statistic accordingly. Unknown but valid pairs return the own-Hana rows as false/null, not a storage error. An empty own store returns `{items:[],next:null}`; a SQL connection/permission/query failure rejects with the original error. No catch substitutes an empty page or a zero.

## Complete traversal and visible configuration

The ascending native PostgreSQL UUID order is also canonical lowercase UUID text order. Each page groups by Hana before applying a strict `hanaId > lastHanaId` keyset and fetches limit+1 to decide continuation. A cursor is versioned and bound to the all/exact scope; malformed cursors or a changed provider/model are rejected with `SemanticError('SEMANTIC_INPUT_INVALID',400)` before SQL. Cursors are not authorization tokens. Retain the same scope across pages; page limit may change. Continue until next is null. There is no OFFSET or hidden first-page cutoff.

`SEMANTIC_DEFAULTS.embeddingFactsPageSize=200` and `embeddingFactsMaxPageSize=1000` are new pagination resource defaults, not security/model/schema constants. Override via module `embeddingFactsPageSize`/`embeddingFactsMaxPageSize` or reader `pageSize`/`maxPageSize`. Both are positive safe integers, pageSize <= maxPageSize < Number.MAX_SAFE_INTEGER so limit+1 stays representable. Invalid configuration raises SEMANTIC_CONFIG_INVALID. Each requested limit must be an integer1..configured maxPageSize; invalid input raises SEMANTIC_INPUT_INVALID400. Effective settings are exposed in `reader.configuration` and each result's limit/selection. No environment variables are read implicitly.

Each page reads current committed state in one SELECT. This is not a multi-page snapshot: concurrent object insertion/deletion or embedding updates can change later facts; inserts before the last key require another scan. A host needing a coherent snapshot can inject a repository built on its own read transaction's executor, and owns transaction/release. Static data traversal is complete and duplicate-free. No permanent history, eligible/current/pending/stale product counters or Registry denominator is invented.

## Host composition

After its existing authorization, the host exhausts both this port and the official C-CATALOG list port. Keep the Registry current Hana ID set as the denominator; count only Semantic items whose hasCurrentEmbedding is true and whose hanaId is in that set. Group those facts by the UTC day of oldestCurrentEmbeddedAt when reproducing the old daily metric. Semantic objects absent from Registry do not count. Registry Hanas absent from Semantic remain uncovered in that denominator. If Registry's set is empty, the count is0 and ratio remains undefined/null according to the host's existing ratio rule. Failure of either provider is unavailable with a reason, never an invented denominator0. This module does not execute that cross-module composition or query Registry/Indexer tables.

```ts
const reader = semantic.embeddingFacts; // created by the existing trusted host assembly
const facts = [];
let after: string | undefined;
do {
  const page = await reader.list(after === undefined ? {} : {after});
  facts.push(...page.items);
  after = page.next ?? undefined;
} while (after !== undefined);
// Host obtains current Registry IDs through C-CATALOG, retains authorization,
// intersects IDs and computes its old numerator / Registry denominator.
```

## Authoritative source and FIXTURE boundary

New provider-owned types live in src/contracts.ts, src/embedding-facts.ts and src/index.ts; dist is generated by build:source. All previous v0.18.0 C-SEMANTIC conformance and negative assertions remain. APIC21 follows this actual provider source after main delivery; SEM02 does not wait for its own follower. Existing C-CATALOG/Indexer/UOW type sources remain precisely v0.18.0, development-only, and published declarations stay closed.

`createSemanticEmbeddingFactsExamples()` and `createSemanticEmbeddingFactsFixture(seed)` are new separate labelled FIXTURE exports at the root and /fixtures. They contain recorded all/exact values, scripted keyset pagination, calls and injectable failures. Unrecorded exact selections raise SEMANTIC_FIXTURE_UNRECORDED_SELECTION. They do no SQL, provider work, hashing, history or Registry composition, and are never module defaults. The original formal examples/fixture shape and bytes remain compatible. Unit/contract tests, mutants, strict production/development consumers and isolated own PG validate the new port alongside all original gates; none is REAL_HOST/UI, REAL_MODEL or owner ACCEPTED.
