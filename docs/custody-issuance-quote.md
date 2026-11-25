# Custody issuance quote

`@hanamesh/api-contracts/custody/issuance-quote` defines the Custody 0.39.0 HTTP contract from
`hanamesh-server-custody@95cb664b871ef1d5a015a1e49de3d4606e1bdea4` and ISS2's
`C-POINTS-ISSUANCE-ALLOCATION` update at docs commit `7fdcbd085ecc070bfdead75c826f59394956c778`.
The package also exposes `/custody/issuance-quote/schema.json`; select a named schema under `$defs`.

Routes below use `/v1/custody/issuance-allocation/:hanaId/requests/:requestId` except the points route.
The issuer authenticates by cookie. Writes require a permitted Origin and JSON. Responses use `Cache-Control: no-store`.

| Method and suffix | Request schema | Success schema |
| --- | --- | --- |
| POST `/quote` | `quoteRequest` | `quote`, 202 on creation, 200 on same-request re-entry |
| GET `/quote` | No query | `quote` |
| GET `/quote/recipients` | `recipientsQuery` | `recipients` |
| POST `/freeze` | `freezeRequest` | `frozenAllocation` |
| GET `/frozen` | No defined query fields | `frozenAllocation` |
| GET `/launch-supply` | `launchSupplyQuery` | `launchSupply` |
| GET `/v1/custody/issuance-allocation/:hanaId/point-phases/me` | No query | `ownPointPhases` |

A newly created quote is queued or computing. Poll the same request. `queuePosition` and
`queueEtaSeconds` describe queued work. The 15-minute hold starts at `heldAt` and ends at
`expiresAt`. Use `serverNow` to reconcile the browser clock. Payment supply with
`allocationState=quote` requires a held quote; `allocationState=frozen` reads the frozen allocation.
`GET /preview` and the `allocationState=preview` value are retired. Freeze takes the exact held
`snapshotHash` and a new freeze only succeeds inside the hold. The public frozen response omits the
internal cut. Legacy frozen records may have a null `quoteExpiresAt` and predate the issuer role split.

The issuer portion total is the sum of contributor, creator and launch-initiator units.
`top10Amount` is independent of `topLimit`. Recipients are paged from held or signed quotes, in
persisted rank order. Pass the previous `next` as `after`; the page limit is 1–50.
Amounts are decimal strings in token base units. The provider retains an aggregate summary on
expiry or failure. Clients should use the top-level allocation only when it is present.

| HTTP result | Consumer handling |
| --- | --- |
| 404 `CUSTODY_ISSUANCE_QUOTE_REQUIRED` on read, 409 on freeze | Start the quote using POST |
| 409 `CUSTODY_ISSUANCE_QUOTE_NOT_HELD` | Continue polling while queued or computing |
| 409 `CUSTODY_ISSUANCE_QUOTE_EXPIRED` | Recalculate with a new request ID |
| 409 `CUSTODY_ISSUANCE_QUOTE_CONFLICT` | Keep the request binding or start a new request |
| 409 `HANA_ADMISSION_PENDING` | Resume the in-flight request identified by `error.need.requestId` |
| `failed` quote | Present the provider's `failure`, then use a new request ID to recalculate |

The signing service records ordinary signatures inside the signing transaction. Its decision time
must precede the hold deadline and every chain deadline must be at or before it. The public
`signatureDeadline` is an ISO UTC timestamp when a signature was recorded. A chain-only issued
observation can yield `signed` with a null signature deadline. A confirmed not-issued terminal
observation yields `expired`. A recorded signature is never released solely by the hold clock.

Point phases derive from the live or issued frozen cut. Sources with `received_at` strictly after
`pointsCutoffAt` are post-issuance. Without a live or issued cut the status is `not-issued` and all
points count as pre-issuance. Custody supplies these facts; Host composes the route and Web consumes it.

### HTTP failure details

Malformed request fields and invalid JSON return 400 `CUSTODY_INPUT_INVALID`; writes with
unsupported content type return 415 `CUSTODY_CONTENT_TYPE_REQUIRED`. An unauthenticated issuer
gets 401 `CUSTODY_AUTH_REQUIRED`; disallowed Origin and issuer access use 403
`CUSTODY_ORIGIN_REJECTED` and `CUSTODY_FORBIDDEN`, respectively.

A missing quote returns `CUSTODY_ISSUANCE_QUOTE_REQUIRED` 404 for quote, recipients and quote-mode
launch supply. Freeze returns the same code with 409 and
`need: {input: "custody.issuanceQuote", scope: "session-h"}`. Recipients and quote-mode payment
return 409 when the quote is expired or unavailable for that step. Launch-supply scope mismatch
returns 409 `CUSTODY_LAUNCH_SUPPLY_SCOPE_MISMATCH`. A read of a missing frozen allocation returns
409 `CUSTODY_ISSUANCE_ALLOCATION_REQUIRED`. A failed view reaching freeze returns 409 with its stored
failure code. Legacy requote is a trusted signing refusal.

Known missing inputs produce 503 `CUSTODY_UPSTREAM_REQUIRED` with an owning `need`. An unexpected
exception maps to 503
`CUSTODY_ISSUANCE_ALLOCATION_UNAVAILABLE` with
`need: {input: "custody.issuanceAllocation", scope: "session-h"}`. The status is carried by the HTTP
response, while the body is `{error: {code, message, need?}}`. Reservation and Chain presenter errors
retain their actual need shape, including the in-flight request ID when supplied.

### Freeze conflicts

`POST /freeze` returns the following public 409 responses for these freeze decisions.

| Code | Condition and client action | `error.need` |
| --- | --- | --- |
| `CUSTODY_EMPTY_ISSUANCE_CONFIRMATION_REQUIRED` | The held or already-frozen allocation uses the empty route and explicit confirmation is missing. Show the empty-allocation confirmation and submit `emptyConfirmation: true` after the issuer confirms. | Absent |
| `CUSTODY_ISSUANCE_ALLOCATION_CONFLICT` | A frozen request already binds a different Hana, principal, campaign, snapshot, early-release choice or quote asset. Keep the existing freeze and its binding. | Absent |
| `CUSTODY_ISSUANCE_RESERVATION_LEGACY_REVIEW_REQUIRED` | The matching frozen record lacks a matching deployment reservation or its frozen snapshot. Stop and request manual review of the original operation before proceeding. | `{input: "custody.issuanceReservations", scope: "session-h"}` |

### Launch-supply assembly

During server assembly, `createIssuanceLaunchSupplySource` throws a 503 `PolicyError` if it
cannot construct the configured source. An invalid deployment ID or service port produces
`CUSTODY_LAUNCH_SUPPLY_CONFIG_REQUIRED`, with input `custody.issuanceLaunchSupply`.
Missing or invalid deployment binding produces `CUSTODY_LAUNCH_SUPPLY_DEPLOYMENT_UNAVAILABLE`,
with input `custody.issuanceReservations`. The HTTP plugin registers `GET /launch-supply`
when Host supplies a successfully constructed source. Its request handler calls that source's
`read` method and returns the HTTP failures documented above.
