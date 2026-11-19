# Shared discovery DTO (SC1 candidate)

List/search/detail share `DiscoveryListFields`, with `reasons` only in `DiscoveryDetailFields`. Compose these fields into the existing catalog item DTO without replacing identity/install fields. `DiscoveryPage` owns the exact filtered `total`, all matching insufficient rows in `hiddenInsufficientCount` (including when expanded), bounded facets, phase and cursor. JSON Schema `$defs.item` validates the discovery subset; validate existing catalog fields independently.

AI18 `hanamesh-initial-v1`: 0–100, weights README10/license10/Scorecard10/npm weekly20/GitHub stars15/pushed_at35; unknown excludes numerator/denominator, >=60 coverage AND all three dimensions before total. Indexer supplies `/10` `displayTotal` and featured ranks; consumers render, never recompute. Score observations expire after30 days; missing reasons and evidence remain visible. The approved design's five-dimension/65%/12-month **demo** policy is not the real rule named in SC1's brief.

`domainIds` and normalized `subdivisions` use Indexer-owned taxonomy `hanamesh-discovery-taxonomy-v1` (46 raw IDs to44 groups; union alias domains and count distinct hana IDs). Multiple domains are permitted. Unknown raw classifications do not invent domains.

Overview: `does` zh<=28/en<=70/ja<=35 Unicode code points; facts mirror the14 AI18 source facts (does is top-level, the other13 in facts). No truncation. Every non-null capability/fact requires source-bound evidence on submission; absent facts are null/omitted. Detail reasons are deterministic facts with evidence, never praise inferred from score.

Trust: `official` remains the existing authoritative item field; its discovery badge carries existing active source proof. `recent-maintenance` is Indexer-owned using AI18 update/fresh-observation rules. Indexer does not issue `author-claimed`; Host composes that badge solely from Registry's public claim state and its checkable source/date. `installation-tested` is reserved but absent until a formal authoritative evidence source exists. Unknown is never trusted.

Similar groups are display-only. Only checkable GitHub fork/parent relations or existing manual candidate records are accepted. No string similarity heuristic, merge, canonical reassignment, or economic identity change.

Phase `early` hides platform-internal data by configuration; it does not hide public plugin facts or scores. Host must pass the configured phase. The service owns all filtering/ranking/counts in bounded SQL. Featured = eligible top11 per domain, score descending, Hana ID ascending for ties. Short domains return fewer; no filler.

SemVer: additive public export proposes a minor upgrade from0.25.0; final version assigned by orchestration at merge. No tag/publish in this task.

Standards: [JSON Schema2020-12](https://json-schema.org/draft/2020-12/json-schema-validation), [PostgreSQL17 ordered LIMIT](https://www.postgresql.org/docs/17/queries-limit.html), [node-postgres transaction client](https://node-postgres.com/features/transactions).
