# Unified catalog query (U1)

The Indexer owns one selection port for lists, keyword/names search and hybrid search. Domain/subdivision are ordinary AND filters. Host composes page-bounded hydration/discovery fields and existing SL1 logs; U1 does not change Host or Web.

`CatalogQuery` and `CatalogQueryPage` are exported at `@hanamesh/api-contracts/catalog/query`. The schema definitions describe the query, identity-free selection page, names suggestions and Host log envelope. The provider returns stable 1-based `rank`; Host adds `searchId` per new logged search and reuses it on subsequent pages/clicks. Never cache a logged envelope across users.

All sort orders are deterministic, with Hana ID ascending on ties. `relevance` uses the published Indexer SEARCH_ORDER_POLICY revision; `popular` uses stored authority; the existing `ranking:'plugins'` selects Custody's published users30d order and excludes platform-official suite entries (publisher-official remains eligible); `latest` uses catalog updated time; `stars` uses plugin stars; `downloads` uses npm30d only for a card with a valid npm package. Unknown signals sort last and remain null; known zero remains zero. A query with text admits the existing 1000-result authority window plus one count sentinel before applying the requested sort. Names mode excludes body/alias-only matches. Hybrid accepts only Semantic's existing bounded candidates and uses the existing RRF policy; it does not call a model from Indexer.

Category values have OR semantics; different dimensions have AND semantics. Source uses active source-link membership, repo is a case-insensitive exact identity; a literal owner/repo in q retains the existing repository prefix guard. Claim is an Indexer-owned projection of Registry public facts, never a cross-schema join. Unknown claim is not unclaimed. Subdivision must belong to the selected domain. IncludeInsufficient is explicit at the provider boundary; Host's public default awaits the DM1 owner decision and must not depend on domain.

Cursor is opaque and binds the normalized query including page size, resolved semantic candidate order, policy, authority and projection epochs. Changes invalidate it explicitly; Host maps this to the existing paginationReset behavior. No offset paging or full-catalog application filtering/sorting is allowed.

Facet semantics and all previously public sort/candidate-window edge cases are being aligned to the frozen D1 oracle during U1 implementation; this draft must not be adopted before the measured provider delivery and review. No U2 route switch, fallback path or new product ranking policy is authorized by this document.

Engineering basis: PostgreSQL 17 parameterized SELECT, deterministic ORDER BY, indexed keyset ranges, window functions and aggregation; node-postgres's parameter binding. Existing bounds (200 page/facet, 512 query bytes, 32 terms, 1000/1001 recall, 50 semantic candidates) are reused rather than new product limits.
