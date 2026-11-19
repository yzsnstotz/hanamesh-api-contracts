# @hanamesh/api-contracts

This package exposes the consumed current quote-v2 provider types and exact current ABI artifacts,
plus the isolated [C09 search-miss export response schemas](docs/search-miss-export.md)
at `/host/search-miss-export`.
The root and `/chain/quote-v2` export QUOTE_V2_CONTRACT metadata; provider functions are not runtime
stubs. Type-only exports describe the actual @hanamesh/server-chain API.

Canonical contracts: https://github.com/yzsnstotz/hanamesh-docs/blob/main/contracts/C-CHAIN-RELEASE-QUOTE-V2.md
and C-CONTRACTS-RELEASE-QUOTE-V2.md in the same directory. ABI revision is 2.4.0.

Run `npm ci` and `npm test` (unit checks and strict TypeScript). No old generations, fee-token
schemas or unused service declaration families are exported or shipped.

The current token artifact includes OpenZeppelin 5.3.0 ERC20Permit and ERC20Votes.
Votes use ERC-6372 timestamps (`CLOCK_MODE() == "mode=timestamp"`). Holders must
explicitly delegate (including to themselves) before their balance counts as voting
power. No application automatically delegates. Permit uses the token name, version
`1`, chain ID and token address as its EIP-712 domain, with the OZ shared nonce.

API 0.24.0 mirrors the Chain 0.41.0 reader declarations byte-for-byte from the
commit and SHA256 recorded in `contracts/chain/quote-v2/provenance.json`.
The market reader exposes `readMarketAnchor`, `withMarketAnchorScope`,
`readMarketHead`, `readMarketWindow`, `readMarketState`, and `readBondLive`.
Window and state reads carry explicit anchors and sealed binding/carry facts;
live reads use the verified binding. The readonly RPC batch method union includes
`eth_chainId`. `createQuoteV2Reader` requires `readRpcBatch` at both type exports;
omitting it or passing `undefined` is invalid.

The retired direct market, quote and personal Bond readers, their batch helpers
(including `withMarketReadBatch`), and their retired DTOs are removed. Consumers
must use the current provider ports. ABI revision 2.4.0 removes standalone migration/deferred-state interfaces and
adds pair graduation and rotatable, distinct admission/root signers. This package supplies declarations and contract metadata only.

The five-provider alignment audit, including the contracts owned by Indexer,
Registry, Custody and Semantic, is in [docs/provider-alignment-0.22.13.md](docs/provider-alignment-0.22.13.md).
Those providers continue to export their own public contracts.

Release flow: independent review, PR merge to main, `v0.24.0` tag, then normal
`npm pack` and npm publication from that tag. Host must consume the published
`@hanamesh/api-contracts@0.24.0` (exact version), together with Chain 0.41.0.
A candidate branch or local tarball is not the official release.

Candidate status: independently reviewed for API 0.24.0; no tag or npm publication is performed here.
The exact provider commit is 8d801c4ed02f013f5f34a6ead510a138cbbb0f96. New live facts use migrated, closedAt,
migratedAt and closingQuote; migrationState has only open/completed. migrationQuote is the Bond
contribution, migrationPoolQuote includes donations. Provider declarations expose signer rotation
and advanceEpoch builders, and require a verified official pool for reserve/claim recipient guards.
Runtime still exports metadata only; implementations remain in Chain.

Claim context requires both the verified issuance pool and the actual right recipient from the trusted
state for the same campaign/entitlement IDs; the sender may be a relayer.


Host ops manifest HTTP 契约与 JSON Schema：[`docs/ops-manifest.md`](docs/ops-manifest.md)，公开子路径 `@hanamesh/api-contracts/host/ops-manifest`。清单由运行中的 Host 声明，本包不维护页面名单。

观测台只读 DTO 与 JSON Schema 候选：[`docs/observatory.md`](docs/observatory.md)，子路径
`@hanamesh/api-contracts/ops/observatory`。每个指标附来源与 available/pending/manual；
模块拥有统计与授权，Host 只组合。候选包版本 **0.26.0**；正式合入、发布及 Host 采用仍待独审与验收。

OB1 追加的 ops 页面声明候选采用 manifest schemaVersion 2：模块必填
`group: {id,labelKey,order}`、组内 `order`、`permission: {policyId}`；Host 组合 `pages`，
原精确 GET 允许集 `paths` 保留独立职责。见 [`docs/ops-manifest.md`](docs/ops-manifest.md)。
本候选包版本为 **0.26.0**，提供方/消费方采用仍由编排协调。

编排11-19更正的 feeTo 协议手续费采用结构化 Factory 设置和 LP 持仓页：
`ObservatoryIncome.protocolFees` / `ObservatoryParameter.protocolFee`，已持有、未铸费LP、
可提取底层资产分开；详见 [`docs/observatory.md`](docs/observatory.md)。
