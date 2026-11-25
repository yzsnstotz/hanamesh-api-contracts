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
