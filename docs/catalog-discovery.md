
## R423 最新契约增量（编排已裁定，待追认；实现/门尚在继续）

普通浏览按总分降序、hanaId升序keyset；未评分排在有评分之后。搜索继续原SEARCH_ORDER_POLICY相关度/权威排序与1000候选窗。关键词页 `total` 最多1000，超过时 `capped=true`，展示 `1000+`；`window.capped`仍指候选窗，`window.countsCapped`指任何计数截断。`hiddenInsufficientCountCapped`标隐藏数的独立下界。每个facet新增`capped`：关键词facet来自同一有界前1000匹配集合，截断时是下界（含可能的0），不应当作精确全量数；无关键词的目录/领域/细分均精确、capped=false。所有cap均发生于SQL LIMIT1001之前，不读取全命中再截断。

列表/搜索/详情的每项，以及页和领域目录都增加`projection`：`{watermark:string|null,assessedAt:string|null,rulesVersion:'hanamesh-initial-v1',projectionAt:string|null}`。每项指该插件已完成的行投影版本；页/目录水位为本SQL快照内最大已发布行版本，不保证全目录同时新鲜，不能单独当全目录ETag。`assessedAt`是评估业务时点，`projectionAt`是写成投影的UTC时间。`score.assessedAt`不再每次读伪装成当前时刻；无投影时间保持null，资料不足总分仍null。读请求不重算。Indexer作业按due/变更队列每批最多200插件追平；Host后续采用单需调度该公开作业端口，前端直接呈现缓存值/水位。

六份共享fixture路径不变，已同步新增字段；search.json展示1000+。API最新分配为0.27.0，OB1观测台先合入0.26.0；本发现契约合入前须在其上变基，未合入时按本次增量定稿，WX30/CL7可按此继续。近期维护、关键词cap和SWR裁定均在交件标「待追认」。

# Shared discovery DTO (SC1 candidate)

List/search/detail share `DiscoveryListFields`, with `reasons` only in `DiscoveryDetailFields`. Compose these fields into the existing catalog item DTO without replacing identity/install fields. `DiscoveryPage` owns the exact filtered `total`, all matching insufficient rows in `hiddenInsufficientCount` (including when expanded), bounded facets, phase and cursor. JSON Schema `$defs.item`/`detailItem` validate the discovery extension plus Hana ID, preserve existing catalog fields, and forbid detail-only reasons on list/search items. Validate the existing catalog metadata with its owning provider contract. `$defs.listFields`/`detailFields` are closed extension-only schemas.

AI18 `hanamesh-initial-v1`: 0–100, weights README10/license10/Scorecard10/npm weekly20/GitHub stars15/pushed_at35; unknown excludes numerator/denominator, >=60 coverage AND all three dimensions before total. Indexer supplies `/10` `displayTotal` and featured ranks; consumers render, never recompute. Score observations expire after30 days; missing reasons and evidence remain visible. The approved design's five-dimension/65%/12-month **demo** policy is not the real rule named in SC1's brief.

`domainIds` and normalized `subdivisions` use Indexer-owned taxonomy `hanamesh-discovery-taxonomy-v1` (46 raw IDs to44 groups; union alias domains and count distinct hana IDs). Multiple domains are permitted. Unknown raw classifications do not invent domains.

Overview: `does` zh<=28/en<=70/ja<=35 Unicode code points; facts mirror the14 AI18 source facts (does is top-level, the other13 in facts). No truncation. Every non-null capability/fact requires source-bound evidence on submission; absent facts are null/omitted. Detail reasons are deterministic facts with evidence, never praise inferred from score.

Trust: `official` remains the existing authoritative item field; its discovery badge carries existing active source proof. `recent-maintenance` is Indexer-owned using AI18 update/fresh-observation rules. Indexer does not issue `author-claimed`; Host composes that badge solely from Registry's public claim state and its checkable source/date. `installation-tested` is reserved but absent until a formal authoritative evidence source exists. Unknown is never trusted.

Similar groups are display-only. Only checkable GitHub fork/parent relations or existing manual candidate records are accepted. No string similarity heuristic, merge, canonical reassignment, or economic identity change.

Phase `early` hides platform-internal data by configuration; it does not hide public plugin facts or scores. Host must pass the configured phase. The service owns all filtering/ranking/counts in bounded SQL. Featured = eligible top11 per domain, score descending, Hana ID ascending for ties. Short domains return fewer; no filler.

SemVer: orchestration reassigned discovery contracts to version 0.27.0. OB1 observation contracts merge first as 0.26.0; discovery contracts must rebase onto that main commit before merging. Existing 0.26.0 discovery candidate receipts are historical evidence and do not validate the 0.27.0 package. No tag/publish in this task.

Standards: [JSON Schema2020-12](https://json-schema.org/draft/2020-12/json-schema-validation), [PostgreSQL17 ordered LIMIT](https://www.postgresql.org/docs/17/queries-limit.html), [node-postgres transaction client](https://node-postgres.com/features/transactions).

Ordinary browse preserves Hana-ID order. Keyword/authority reads reuse Indexer's existing `SEARCH_ORDER_POLICY` (prefix normalization, published tiers/authority columns, candidate window and presentation CTEs); `window` exposes that existing capped result window while discovery facet/hidden counts stay exact. Only `readFeatured` orders by initial assessment. There is no frontend ranking or new recommendation heuristic.

Owner11-19 final display: raw `total`/`dimensions` retain scale100 and two decimals; `displayTotal`/`displayDimensions` are supplied by Indexer at displayScale10 with displayDecimals1. Example86.00→8.6/10; 80.80→8.1/10. `dimensionWeights` is quality30/popularity35/maintenance35. Formatting trailing zero is allowed; clients never convert or score.
`readDomainDirectory` supplies the versioned ten-domain/subdivision directory and exact visible/insufficient counts. `readStageConfig`/`getDiscoveryStageConfig` supplies the configured phase and explicit showPlatformData boolean. `readListFields` decorates a bounded existing candidate order without replacing semantic/native selection.
