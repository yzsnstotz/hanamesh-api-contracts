# Unified catalog query (U1)

The Indexer owns one selection port for lists, keyword/names search and hybrid search. Domain/subdivision are ordinary AND filters. Host composes page-bounded hydration/discovery fields and existing SL1 logs; U1 does not change Host or Web.

`CatalogQuery` and `CatalogQueryPage` are exported at `@hanamesh/api-contracts/catalog/query`. The schema definitions describe the query, identity-free selection page, names suggestions and Host log envelope. The provider returns stable 1-based `rank` on both full results and names suggestions; Host adds `searchId` per new logged search and reuses it on subsequent pages/clicks. Never cache a logged envelope across users.

The seven sorts are relevance, popular, latest, stars, downloads, id and trending. All sort orders are deterministic, with Hana ID ascending on ties. `relevance` uses the published Indexer SEARCH_ORDER_POLICY revision; `popular` without q uses Custody's published users30d, as the actual Web keyset/offset callers do; with q it uses the selected search authority. `ranking:'plugins'` retains its existing Custody order and excludes platform-official suite entries (publisher-official remains eligible); `id` uses ascending Hana ID; `trending` uses Custody published uses7d; `latest` uses catalog updated time; `stars` uses plugin stars; `downloads` uses npm30d only for a card with a valid npm package. Unknown signals sort last and remain null; known zero remains zero. A query with text admits the existing 1000-result authority window plus one count sentinel before applying the requested sort. Names mode excludes body/alias-only matches. Hybrid accepts only Semantic's existing bounded candidates and uses the existing RRF policy; it does not call a model from Indexer.

Category values have OR semantics; different dimensions have AND semantics. Source uses active source-link membership, repo is a case-insensitive exact identity; a literal owner/repo in q retains the existing repository prefix guard. Claim is an Indexer-owned projection of Registry public facts, never a cross-schema join. Unknown claim is not unclaimed. Subdivision must belong to the selected domain. IncludeInsufficient defaults to true (owner/编排 2026-11-21); only explicit false enables the insufficient-data gate. Its default never depends on domain.

Cursor is opaque and binds the normalized query including page size, resolved semantic candidate order, policy, authority and projection epochs. Changes invalidate it explicitly; Host maps this to the existing paginationReset behavior. No offset paging or full-catalog application filtering/sorting is allowed.

D1 category/source facets use the official/channel directory scope and ignore q/category/source/claim/repo. Channels exclude their own channel selection. Domain/subdivision and insufficient-data counts use the common query relation with independent cap flags. New domain filtering must be composed without discarding those existing facet distinctions. Remaining edge cases are being aligned to the frozen D1 oracle during U1 implementation; this draft must not be adopted before the measured provider delivery and review. No U2 route switch, fallback path or new product ranking policy is authorized by this document.

Engineering basis: PostgreSQL 17 parameterized SELECT, deterministic ORDER BY, indexed keyset ranges, window functions and aggregation; node-postgres's parameter binding. Existing bounds (200 page/facet, 512 query bytes, 32 terms, 1000/1001 recall, 50 semantic candidates) are reused rather than new product limits.


`repoOwner` is a nonempty array of at most20 GitHub owner logins (raw list bound before case folding/dedup). Selectors are1..39 ASCII letters/digits/hyphen/underscore, including managed-user suffixes; this is a read selector, not account-name creation or availability validation. Values compare case-insensitively, normalize to lowercase, de-duplicate and sort for cursor binding. Owners are ORed; exact `repo` and every other filter still AND. Match the exact owner segment of the canonical card's current normalized GitHub repository, never a prefix, display name or source URL. Repository subdirectories remain separate cards; merged aliases do not duplicate them. Empty/oversized/non-login selectors fail explicitly; a valid absent owner returns zero.

Basis: [GitHub repository owner parameters are not case sensitive](https://docs.github.com/en/rest/repos/repos#get-a-repository) and [managed usernames include an underscore suffix within39 characters](https://docs.github.com/en/enterprise-cloud%40latest/admin/managing-iam/iam-configuration-reference/username-considerations-for-external-authentication). DSC-claim §3 G-B is adopted at Indexer's owned directory layer for U1. The filter grants no claim authority; Claim re-verifies individual repository rights. Legacy global category/source/channel facet scope remains unchanged, while current-cohort domain/subdivision/hidden counts apply repoOwner like exact repo.

## Indexer validation

Indexer 0.5.52 at `594b6d061a811bad04c965f460c948cdb755137c` requires `searchMode`, `sort`
and `limit`. A nonblank `q` is required for `hybrid` and `names`. A subdivision requires its
owning domain. Indexer checks the current taxonomy and accepts duplicate categories, which it sorts
and deduplicates. The raw `q` may occupy at most 512 UTF-8 bytes before normalization. Indexer
then applies NFKC, trimming, lowercasing and Unicode letter/number/mark tokenization and allows at
most 32 distinct terms. Use `isCatalogQueryTextWithinBounds(q)` together with the portable Schema.
The cursor is a nonempty, unpadded Base64URL token, at most 4096 characters. Indexer validates the
decoded cursor against the query and serving snapshot. Invalid query parameters return HTTP 400
`INDEXER_INVALID_INPUT`; malformed or stale cursors return HTTP 409
`INDEXER_SEARCH_CURSOR_INVALID` from the unified query service.

## Host HTTP transport (U2)

Web and Market use `GET /v1/host/catalog/query`. The Web same-origin proxy exposes it at
`GET /hm/v1/host/catalog/query`. Pass `sort`, `searchMode` and `limit` as query parameters.
Other `CatalogQuery` fields are optional. Encode `categories` and `repoOwner` as repeated
parameters, and booleans as `true` or `false` where allowed by the query schema. Unknown
parameters, duplicate scalar parameters and malformed wire values return HTTP 400.

Use `after` for a continuation. When navigating directly from a numbered URL, send its one-based
`page` instead. Omit both for the first page. Hosts resolve numbered navigation on the provider
within a single catalog snapshot. A page past the end resolves to the last page, or to page 1
for an empty catalog. An unavailable provider or exhausted read budget returns HTTP 503.
The Host makes one provider read for numbered navigation.

Successful responses use `$defs/httpResponse`. `kind: page` carries the provider page plus
`pageNumber`, `limit`, `popularityAsOf` (the publication used by applicable sorts) and `cards`.
Card and ranked item IDs match one-to-one and in order. Optional `discovery` on result cards
uses the existing list-fields schema and is read in the same snapshot as the selected cards.
The required `page.facets.all` is a nonnegative safe integer from the same snapshot and
selected query mode. It excludes the channel and category selectors. `page.total` remains
the filtered total for pagination. An empty filtered page can have a nonzero `facets.all`.
`kind: names` uses the same endpoint and
carries the names result. Both envelopes have nullable `searchId` and `semanticNotice`, and a
`paginationReset` flag. A stale well-formed continuation, or a Hybrid fallback that changes
the continuation mode, returns the first page and sets `paginationReset: true`. Malformed
cursor syntax returns HTTP 409 `INDEXER_SEARCH_CURSOR_INVALID`.

Existing `x-hm-search-surface`, `x-hm-ui-lang` and `x-hm-search-session` carry the SL1 context.
Host allocates a fresh `searchId` on a logged first search, and clients echo it as
`x-hm-search-id` with the same session on an `after` request. Only an accepted continuation
echoes that ID. A reset starts a new first search when valid log context is present.
Hybrid resolves the actor and enforces the existing Semantic rate limit before invoking the
service. Existing non-fallback refusals (including rate limits) keep their status and `Retry-After`.

Only successful, anonymous, unlogged GETs without search terms are eligible for public caching
for 60 seconds. Authenticated requests and every search or logged envelope use `no-store`.
The cache key includes all query selectors and pagination state. Delisting becomes visible
once a previously cached response expires.

## Board facts and cutover watermarks (C0)

`GET /v1/indexer/community/board-changes` returns `boardChangePage`. The first request
omits `after`. Each later request passes the prior page's opaque `cursor` as `after`.
`limit` is at most 200. `more: false` marks the read horizon for the completed batch. Use
the returned cursor even when no board changed. Responses use `no-store`.

Each item is the latest fact at the feed snapshot for its Hana ID. It carries the display
name, listed/delisted state, canonical Hana ID for a merged alias and nullable current
owner principal ID. Listed boards have no canonical target. A merged alias has a different
canonical ID. An event version may advance on an ownership transfer even when both old and
new states are claimed. The feed does not include posts, votes or their data model.

`GET /v1/host/catalog/readiness` returns `cutoverReadiness` with `no-store`. `ready` is
true when claims initialization has completed, there are no pending Registry claims at
the observed snapshot and Indexer sees a published popularity snapshot. `snapshot` is
the catalog search epoch. `watermark` is the committed board-feed horizon read in the
same PostgreSQL snapshot. Consumers compare feed positions and confirm their own merge
acknowledgements before switching writers or readers.

### Public sitemap projection

`GET /v1/host/catalog/query?view=sitemap` returns
`{kind:"sitemap-manifest",generation,segmentCount,segmentSize}` for the latest
complete publication. `generation` is a sitemap publication identifier. It binds all
child reads to the same committed set of listed canonical Hana IDs. An empty
directory has zero plugin segments. `segmentSize` is at most 2,000 URLs.

`GET /v1/host/catalog/query?view=sitemap&generation=<generation>&segment=<n>&limit=200`
returns `{kind:"sitemap-segment",generation,segment,items:[{hanaId}],nextCursor}`.
Segments are one-based. IDs within and across segments are ordered ascending. Use
`after=<nextCursor>` on the same generation and segment until `nextCursor` is
`null`. Both responses use the same GET as the directory. This view rejects
search, sort, filters, page numbers, repeated parameters and limits above 200.
Publication deliberately omits `lastmod` while no trustworthy public-content
last-modification field is available.

HTTP 400 `INDEXER_INVALID_INPUT` denotes invalid parameters. HTTP 404
`INDEXER_SITEMAP_NOT_FOUND` denotes an unavailable generation or segment. HTTP 503
`INDEXER_SITEMAP_UNAVAILABLE` denotes absent initial publication or upstream
failure. A caller starts over from the manifest for an unavailable generation.


## Exact-ID detail signals

Web and Market use `CatalogDetailSignals` for the `signals` member on an exact-ID Hana detail. The runtime schema is `CATALOG_QUERY_SCHEMA.$defs.detailSignals`.

| Field | Source and meaning |
| --- | --- |
| `stars` | The individual Hana's star count from the Indexer public signal projection. |
| `repositoryStars` | The repository's star count from a separately attributed Indexer source. Include this field only when there is repository provenance. |
| `npmDownloads30d` | The same 30-day npm download count used in the Indexer rank row. |
| `storeInstalls30d` | Store installations in the previous 30 days. Usage owns this statistic and Host composes it. T1 carries forward the historical D1 evidence with the original counting rules. |
| `checkedAt` | The Indexer `observedAt` for the signal group, as a UTC timestamp. |

An unavailable field carries `null` and a matching `unknownReasons` entry. Web and Market show `—` for an unavailable value. A zero is a measured count. `not_observed` indicates a missing observation, `not_applicable` a signal that does not apply to the Hana, `source_unavailable` an unavailable provider, and `history_unavailable` an incomplete historical window. A known value has no unknown reason. Exact-ID alias and installation behavior, discovery rating, and list rank fields keep their existing contracts.
