# @hanamesh/api-contracts

This package exposes the consumed current quote-v2 provider types and exact current ABI artifacts.
The root and `/chain/quote-v2` export QUOTE_V2_CONTRACT metadata; provider functions are not runtime
stubs. Type-only exports describe the actual @hanamesh/server-chain API.

Canonical contracts: https://github.com/yzsnstotz/hanamesh-docs/blob/main/contracts/C-CHAIN-RELEASE-QUOTE-V2.md
and C-CONTRACTS-RELEASE-QUOTE-V2.md in the same directory. ABI revision is 2.3.0.

Run `npm ci` and `npm test` (unit checks and strict TypeScript). No old generations, fee-token
schemas or unused service declaration families are exported or shipped.

The current token artifact includes OpenZeppelin 5.3.0 ERC20Permit and ERC20Votes.
Votes use ERC-6372 timestamps (`CLOCK_MODE() == "mode=timestamp"`). Holders must
explicitly delegate (including to themselves) before their balance counts as voting
power. No application automatically delegates. Permit uses the token name, version
`1`, chain ID and token address as its EIP-712 domain, with the OZ shared nonce.

API 0.22.13 mirrors the Chain v0.40.0 reader declarations byte-for-byte from the
commit and SHA256 recorded in `contracts/chain/quote-v2/provenance.json`.
The market reader exposes `readMarketAnchor`, `withMarketAnchorScope`,
`readMarketHead`, `readMarketWindow`, `readMarketState`, and `readBondLive`.
Window and state reads carry explicit anchors and sealed binding/carry facts;
live reads use the verified binding. The readonly RPC batch method union includes
`eth_chainId`. `createQuoteV2Reader` requires `readRpcBatch` at both type exports;
omitting it or passing `undefined` is invalid.

The retired direct market, quote and personal Bond readers, their batch helpers
(including `withMarketReadBatch`), and their retired DTOs are removed. Consumers
must use the current provider ports. ABI revision 2.3.0 and all ABI artifacts are
unchanged. This package supplies declarations and contract metadata only.

The five-provider alignment audit, including the contracts owned by Indexer,
Registry, Custody and Semantic, is in [docs/provider-alignment-0.22.13.md](docs/provider-alignment-0.22.13.md).
Those providers continue to export their own public contracts.

Release flow: independent review, PR merge to main, `v0.22.13` tag, then normal
`npm pack` and npm publication from that tag. Host must consume the published
`@hanamesh/api-contracts@0.22.13` (exact version), together with Chain 0.40.0.
A candidate branch or local tarball is not the official release.
