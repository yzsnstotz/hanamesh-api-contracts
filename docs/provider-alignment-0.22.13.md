# Provider alignment for API 0.22.13

The audit baseline is Host 0.6.47 commit `5d984bf034f71e2987f4344aedbbd5b903d711d6`.
Its installed packages resolve to the released tags below. Only Chain quote-v2
is mirrored by this package; the other providers own and export their contracts.
No additional service declaration families or runtime factories are introduced.

| Provider | Released source | Public contract and implementation checked | Result |
| --- | --- | --- | --- |
| Chain 0.40.0 | [5cf20a2](https://github.com/yzsnstotz/hanamesh-server-chain/tree/v0.40.0) | `release-quote-v2.d.ts`, `release-quote-v2.js`, `release-quote-v2-market.js` | Replace the entire 0.39.13 declaration snapshot with the exact 0.40.0 file; add `eth_chainId`, anchor scope and window/state/live/head ports and their DTOs. Remove the retired ports/DTOs. |
| Indexer 0.5.1 | [7ab565f](https://github.com/yzsnstotz/hanamesh-server-indexer/tree/v0.5.1) | public root, `dist/market-contracts.d.ts`, `dist/contracts.d.ts`, `dist/market-index.js`, `dist/service.js` | `readMarketTrades`, `readMarketCandles`, `readPoolMarket` and cursor pages are present; `MarketIndex.readMarketHistory` is absent. `RunSourceContext.onProgress` takes zero arguments; runtime invokes it after committed batches. No API-owned declaration to change. |
| Registry 0.4.0 | [31f0e7a](https://github.com/yzsnstotz/hanamesh-server-registry/tree/v0.4.0) | `types/market.d.ts`, market contracts, daily/pool/history contracts and runtime projections | `not-applicable` is present for metadata, metrics, Bond curves, daily values and pool fields. Queries/pages carry `cursor`/`nextCursor`; trades/candles delegate to the new Indexer ports. No API-owned declaration to change. |
| Custody 0.35.23 | [98c1cf9](https://github.com/yzsnstotz/hanamesh-server-custody/tree/v0.35.23) | public root/contracts, popularity declarations/plugin and errors | `GET /v1/custody/platform/popularity?scope=plugins[&channel]`; `readScopedPopularity` input has required `scope:'plugins'` and optional four-channel selection. Response has `scope:'hana-set'`, channel/null, hanaCount, status, counts, dailyUses and snapshot times. No `directoryRevision`, POST route or `readPlatformPopularity`. Public `CUSTODY_REQUEST_TOO_LARGE` maps to 413. Matches the approved CX4 contract (D1=B). No API-owned declaration to change. |
| Semantic 0.3.16 | [024fc4e](https://github.com/yzsnstotz/hanamesh-server-semantic/tree/v0.3.16) | public root, `dist/service.d.ts`, `dist/service.js` | Both `syncProfiles` and `runEmbeddingJob` accept optional `onProgress:()=>void\|Promise<void>` and runtime calls it without arguments after committed batches/pages. No API-owned declaration to change. |

Chain's removed methods are `quoteBuy`, `previewSell`, `quoteSell`, `readBond`,
`readMarketPhases`, `readMarketIssuedWindow`, `readMarketBalances`,
`readMarketFacts`, `readMarketFactsBatch`, `listIssuedHanaKeys`,
`readHoldersAllocation`, `readTimeline`, `readMarketHistory`,
`readMarketHistoryBatch`, `withMarketReadBatch` and `withMarketHistoryBatch`.
The provider source also removes their dedicated query/page/quote DTOs. Shared
market/history facts still used by the new ports remain exactly as upstream.

The API type tests cover the new ports and their required anchors/bindings,
reject all sixteen retired methods, reject retired DTO imports through both
exports, and retain the required `readRpcBatch` and readonly-method constraints.
The declaration provenance records the complete upstream file hash. ABI
revision, manifest hash and all six contract artifacts remain unchanged.

Host's original `test:contract` directly assigns the Chain factory to the API
factory type. It also builds and tests the public UOW tarball in an isolated
consumer. This gate must pass with 0.22.13 without editing its tests or compiler
options. Additional five-provider audit probes remain release evidence rather
than introducing duplicate provider declarations into the API package.
