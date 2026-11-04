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

API 0.22.8 mirrors the Chain 0.39.9 reader declarations, including anchored
`readMarketBalances`, `readMarketPhases`, `readMarketIssuedWindow`, and the native multicall capability of its explicit public client. Optional `multicall3Address` selects the deployed Multicall3 transport; all bounded chunks share one explicit anchor.
Balances are raw decimal strings for every requested token/account, including zero;
this package supplies declarations only. ABI revision 2.3.0 and all contract artifacts
remain unchanged.
