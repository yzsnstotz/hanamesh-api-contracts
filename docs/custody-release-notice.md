# Custody release deadline notice

`@hanamesh/api-contracts/custody/release-notice` defines the pending-registration banner's HTTP
contract from NTF1's `3ecbef8cc773e7c4c718b3efe033c2130a41a44a` and merged Custody
0.39.0 candidate `95cb664b871ef1d5a015a1e49de3d4606e1bdea4`. The package exposes `query`
and `page` definitions under `$defs` at `/custody/release-notice/schema.json`.

`GET /v1/custody/releases/pending-registration/me` uses the account's cookie with
`Cache-Control: no-store`. The only query field is an optional opaque `cursor`.
Follow `nextCursor` until null, even when a filtered page has zero items.
The provider checks the canonical principal for the cursor and returns at most 50
items, ordered by registration deadline, campaign and entitlement. An invalid cursor is 400
`CUSTODY_INPUT_INVALID`; no authenticated account is 401 `CUSTODY_AUTH_REQUIRED`.
The origin allowlist applies when supplied. Unavailable confirmed facts are a named source
failure, never an empty success.

The deadline comes from the confirmed registration-open facts and the GET rechecks pending
registration. Each item carries the claim request, Hana, deployment chain and release address,
plugin label, token symbol and the exact amount of the entitlement in base units. The current
pending predicate is uncommitted, unregistered and unswept. The wire projection omits the
principal, the confirmation block and any email details. Wallet binding hides the item from the
banner and routes the situation to operations.

Custody owns the UTC daily 7-day and 1-day notification windows and durable per-entitlement
deduplication. Already-expired or registered rights are suppressed. Identity owns verified
recipient resolution and locale. Without a verified address, the browser may still receive
eligible pending rights. Host must supply confirmed facts and mount the plugin before Web can
consume the endpoint. The package exports no mail transport or scheduling interface.
