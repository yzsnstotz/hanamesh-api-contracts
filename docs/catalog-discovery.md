
## R423 最新契约增量（编排已裁定，待追认；实现/门尚在继续）

普通浏览按总分降序、hanaId升序keyset；未评分排在有评分之后。最新F01澄清：关键词先GIN有界召回1001个匹配，再只在前1000候选中按score降序、hanaId升序排序和分页。关键词页 `total` 最多1000，超过时 `capped=true`，展示 `1000+`；`window.capped`仍指候选窗，`window.countsCapped`指任何计数截断。每个facet新增`capped`：关键词facet来自同一有界前1000匹配集合，截断时是下界（含可能的0），不应当作精确全量数；无关键词的目录/领域/细分均精确、capped=false。SQL先LIMIT1001，再计数/标cap并截取前1000候选，不读取全命中payload后再截断。

列表/搜索/详情的每项，以及页和领域目录都增加`projection`：`{watermark:string|null,assessedAt:string|null,rulesVersion:'hanamesh-initial-v1',projectionAt:string|null}`。每项指该插件已完成的行投影版本；页/目录水位为本SQL快照内最大已发布行版本，不保证全目录同时新鲜，不能单独当全目录ETag。`assessedAt`是评估业务时点，`projectionAt`是写成投影的UTC时间。`score.assessedAt`不再每次读伪装成当前时刻；无投影时间保持null，资料不足总分仍null。读请求不重算。Indexer作业按due/变更队列每批最多200插件追平；Host后续采用单需调度该公开作业端口，前端直接呈现缓存值/水位。

六份共享fixture路径不变，已同步新增字段；search.json展示1000+。API最新分配为0.27.0，OB1观测台先合入0.26.0；本发现契约已变基到正式v0.26.0（404cc9da410e8241a78ecf09caf93d4f18a629b5）之上，未合入时按本次增量定稿，WX30/CL7可按此继续。近期维护、关键词cap和SWR裁定均在交件标「待追认」。

# Shared discovery DTO (SC1 candidate)

List/search/detail share `DiscoveryListFields`, with `reasons` only in `DiscoveryDetailFields`. Compose these fields into the existing catalog item DTO without replacing identity/install fields. `DiscoveryPage` owns the filtered `total`, its cap flag, bounded facets, phase and cursor. Listed plugins with insufficient assessments contribute to the same totals and facets. Non-keyword counts are exact; keyword counts stop at1000 with explicit1000+ flags. JSON Schema `$defs.item`/`detailItem` validate the discovery extension plus Hana ID, preserve existing catalog fields, and forbid detail-only reasons on list/search items. Validate the existing catalog metadata with its owning provider contract. `$defs.listFields`/`detailFields` are closed extension-only schemas.

AI18 `hanamesh-initial-v1`: 0–100, weights README10/license10/Scorecard10/npm weekly20/GitHub stars15/pushed_at35; unknown excludes numerator/denominator, >=60 coverage AND all three dimensions before total. Indexer supplies `/10` `displayTotal` and featured ranks; consumers render, never recompute. Score observations expire after30 days; missing reasons and evidence remain visible. The approved design's five-dimension/65%/12-month **demo** policy is not the real rule named in SC1's brief.

`domainIds` and normalized `subdivisions` use Indexer-owned taxonomy `hanamesh-discovery-taxonomy-v1` (46 raw IDs to44 groups; union alias domains and count distinct hana IDs). Multiple domains are permitted. Unknown raw classifications do not invent domains.

Overview: `does` uses shared `LocalizedText.byLocale` and `does-limits-v2` (zh28/en70/ja35/pt-BR80/es80/ko45/vi90/id80/ru80 NFC Unicode code points); facts mirror the14 AI18 source facts (does is top-level, the other13 in facts). No truncation. Every non-null capability/fact requires source-bound evidence on submission; absent facts are null/omitted. Detail reasons are deterministic facts with evidence, never praise inferred from score.

Trust: `official` remains the existing authoritative item field; its discovery badge carries existing active source proof. `recent-maintenance` is Indexer-owned using AI18 update/fresh-observation rules. Indexer does not issue `author-claimed`; Host composes that badge solely from Registry's public claim state and its checkable source/date. `installation-tested` is reserved but absent until a formal authoritative evidence source exists. Unknown is never trusted.

Similar groups are display-only. Only checkable GitHub fork/parent relations or existing manual candidate records are accepted. No string similarity heuristic, merge, canonical reassignment, or economic identity change.

Phase `early` hides platform-internal data by configuration; it does not hide public plugin facts or scores. Host must pass the configured phase. The service owns all filtering/ranking/counts in bounded SQL. Featured = eligible top11 per domain, score descending, Hana ID ascending for ties. Short domains return fewer; no filler.

SemVer: orchestration reassigned discovery contracts to version 0.27.0. OB1 observation contracts merge first as 0.26.0; discovery contracts are rebased onto the actual v0.26.0 tag (404cc9da410e8241a78ecf09caf93d4f18a629b5), preserving the observation exports, schemas and type checks. Existing 0.26.0 discovery candidate receipts are historical evidence and do not validate the 0.27.0 package. No tag/publish in this task.

Standards: [JSON Schema2020-12](https://json-schema.org/draft/2020-12/json-schema-validation), [PostgreSQL17 ordered LIMIT](https://www.postgresql.org/docs/17/queries-limit.html), [node-postgres transaction client](https://node-postgres.com/features/transactions).

Ordinary browse uses stored assessment score descending, then Hana ID ascending, with indexed keyset pagination. Under the latest R423 clarification, keyword reads normalize with the existing search normalizer, recall at most1001 matching rows using existing PG GIN indexes, retain1000 candidates, and only then sort/page that cohort by score/Hana ID. Candidate1001 is the1000+ sentinel, not a result item. The cohort is not a promise of the global highest-scoring1000 matches. Keyword counts/facets are capped lower bounds when marked; non-keyword directory/domain/subdivision counts remain job-maintained exact values. Keyword `sort=authority` also follows the clarified score/Hana order. Without a keyword, explicit authority browse keeps authority/Hana order and its1000-result window, using direct indexed keyset seeks. The native Catalog relevance policy outside this discovery module is unchanged. Frontends do not rank, count or score.

Owner11-19 final display: raw `total`/`dimensions` retain scale100 and two decimals; `displayTotal`/`displayDimensions` are supplied by Indexer at displayScale10 with displayDecimals1. Example86.00→8.6/10; 80.80→8.1/10. `dimensionWeights` is quality30/popularity35/maintenance35. Formatting trailing zero is allowed; clients never convert or score.
`readDomainDirectory` supplies the versioned ten-domain/subdivision directory and exact visible/insufficient counts. `readStageConfig`/`getDiscoveryStageConfig` supplies the configured phase and explicit showPlatformData boolean. `readListFields` decorates a bounded existing candidate order without replacing semantic/native selection.

R423 physical bounds: selected IDs are materialized before primary-key LATERAL catalog/discovery payload reads. `index_ready` seeks the partial pending-document index. Raw EXPLAIN retains GIN bitmap posting entries/buffers separately from bounded candidate heap visits; repeated bitmap construction is forbidden and the complete work is included in the exclusive34k F02 endpoint timings. No new PG extensions or planner-path disabling.


## API 0.28.0: localized-v2 replacement

All localized discovery text now uses the shared [localized-v2 contract](catalog-localized.md):
`overview.does`, `facts.audience.value`, `facts.difficultyReason.value`, detail `reasons[].text`,
and every page/directory domain/subdivision `name`. Null facts retain their existing evidence rules.
Register `LOCALIZED_SCHEMA` alongside `DISCOVERY_SCHEMA` with a JSON Schema2020-12 validator;
the discovery JSON references the public localized schema by its canonical `$id`.
The old `DiscoveryLocalizedText` declaration and top-level `{zh,en,ja}` schemas are removed.
There is no union, adapter, dual write or legacy payload reader. Taxonomy IDs and scoring rules
remain owned by Indexer. Summary and other provider-owned text fields adopt `LocalizedText`
at their public ports in the corresponding consumer tasks, not through an invented discovery summary field.

## Published rating card v1

A detail response may include `rating` alongside the existing discovery fields. The
rating includes the reviewed source repository, plugin directory and exact Git
revision, the Chinese overview and one-line summary, five dimensions with reasons,
verified evidence, a recommendation, up to three cautions, and a verdict. Evidence
links target lines at the same source revision. The rating is absent on list items
and on detail items without a published card.

The four quality weights are onboarding 25, documentation 20, maintenance 20,
and safety 15. The total is normalized by the sum of available quality weights
and displayed out of ten. A missing optional safety dimension remains null.
Popularity has a separate dimension, stars, recent downloads and last push
observation. It has no weight in the total. A card with insufficient material
has a null total and a reason. The prior assessment continues to power ranking.

The trusted batch input `ratingBatch` carries one key and 1–50 distinct Hana IDs.
The writer verifies the exact repository and directory of each listed canonical Hana.
It records a payload SHA-256 and a per-Hana status in a durable receipt. A replay
with the same key and payload returns that receipt. A different payload for the
same key fails, and a failure rolls back the complete batch. The public discovery
HTTP interface only exposes the projected rating on the existing detail read.
