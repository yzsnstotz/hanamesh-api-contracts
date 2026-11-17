# C09 search-miss export contract

This is a read-only Host port. The adopted response schemas are JSON Schema
draft-07 objects, with the same validation content as Host's
`src/search-miss-export-schema.ts`. The source commit, source SHA256 and both
JSON artifact hashes are recorded in
[`provenance.json`](../contracts/host/search-miss-export/provenance.json).
The source semantics are Host's `src/search-miss-export.ts` and
`docs/SEARCH-MISS-EXPORT.md` at that commit. This addition awaits an independently
reviewed minor release; the release version is assigned during integration.

## Public package surface

```js
import {
  SEARCH_MISS_EXPORT_SCHEMA,
  SEARCH_MISS_EXPORT_ERROR_SCHEMA,
} from '@hanamesh/api-contracts/host/search-miss-export';
```

The same schemas are separately exported as
`@hanamesh/api-contracts/host/search-miss-export/success.schema.json` and
`@hanamesh/api-contracts/host/search-miss-export/error.schema.json`.
This subpath exports schema data only. The package root and `/chain/quote-v2`
retain their existing exports. Host owns the implementations and the public
`hanamesh-server/search-miss-export` port, including `readSearchMissExport`,
`renderSearchMissReport`, the DTO types, both response schemas, and the catalog
and policy helpers `readSearchMissVocabulary`, `SearchMissCatalogSource` and
`SEARCH_MISS_RELEASE_POLICY`. Consumers use that port or the HTTP route; they
must not read Host's private tables.

## Route inventory

| Method and route | Input | Access | Cache policy |
| --- | --- | --- | --- |
| `GET /v1/ops/search-miss-export` | Required query `endDay=YYYY-MM-DD`; other query keys are invalid | Identity cookie and existing ops-admin authorization | `Cache-Control: no-store` on success and errors |

| HTTP status | Body | Schema |
| --- | --- | --- |
| 200 | Export object, including `ready`, `not-ready` or `no-data` | `success.schema.json` |
| 400 | `{"error":{"code":"SEARCH_MISS_EXPORT_INPUT_INVALID"}}` | `error.schema.json` |
| 401 | `{"error":{"code":"AUTH_REQUIRED"}}` | `error.schema.json` |
| 403 | `{"error":{"code":"OPS_FORBIDDEN"}}` | `error.schema.json` |
| 503 | `{"error":{"code":"OPS_ADMIN_LOOKUP_UNAVAILABLE"}}` or `{"error":{"code":"SEARCH_MISS_EXPORT_UNAVAILABLE"}}` | `error.schema.json` |

The error schema describes the shared code-only body; this table specifies the
status/code association. Errors expose no internal message, stack or identity.

## Success fields and semantics

Every field below is required. Every object, including nested periods and error
objects, rejects extra properties (`additionalProperties: false`).

| Field | Meaning and shape |
| --- | --- |
| `schemaVersion` | Integer constant `1` |
| `status` | `ready`, `not-ready` (rollup watermark absent, invalid or not settled), or `no-data` (settled but no observable starting day) |
| `period` | `{startDay,endDay}`, fixed seven UTC calendar days including both endpoints |
| `coverage` | `{startDay: string or null, days: integer 0..7, requestedDays: 7}`; observable coverage can be shorter than the requested period |
| `expiresOn` | UTC date equal to the requested `period.startDay` plus 90 calendar days; derived copies must be deleted before 00:00Z on that date |
| `totals` | Nonnegative integer `searches`, `zeroResultSearches`, `clickedSearches`; `clickThroughRate` in 0..1, or null with no denominator. The denominator is all searches, not the exported terms |
| `terms` | At most 100 objects, each containing only `query` (1..500 characters), nonnegative integer `count`, `kind` (`keyword` or `semantic`) and `period` (the requested period). Count means zero-result searches for that word and kind across the whole period |
| `candidatesTruncated` | Boolean; Host scans at most 1000 candidates, fetching one extra to detect truncation. When true this is not a complete safe Top 100 |
| `filteredCandidates` | Nonnegative integer; number of whole terms rejected among the scanned candidates, with no rejected raw text returned |

Host rejects invalid calendar dates, today/future end days, and expired request
periods. Report counts come from settled daily aggregates. Within the same SQL
snapshot, eligible events and clicks also supply distinct anonymous-session
counts, using the existing SL1 agent exclusion and typeahead merging rules.
Not-ready responses do not expose terms or counts. Coverage describes the
observable interval and does not prove complete collection.

The adopted schemas enforce the source's date-only `YYYY-MM-DD` pattern; they
do not validate calendar existence, cross-field arithmetic, status-dependent
values, retention against the current clock, or the sensitive-word policy.
These remain Host guarantees. No custom keywords or second semantic validator
are introduced here. A consumer must check freshness before use and cannot
infer privacy or readiness from schema validation alone.

Normative UTC examples (all inclusive seven-day periods):

| startDay | endDay | expiresOn (start + 90 days) |
| --- | --- | --- |
| 2026-11-11 | 2026-11-17 | 2027-02-09 |
| 2024-02-26 | 2024-03-03 | 2024-05-26 |
| 2026-12-28 | 2027-01-03 | 2027-03-28 |

## Privacy and downstream boundary

There are no user/principal/session/search identifiers, filters, top IDs, IPs,
exact timestamps or query hashes in the response. For the session evidence,
raw session IDs stay inside SQL. Only aggregate distinct-anonymous-session
counts return to the Host application, which evaluates the k threshold. These
internal population counts and all identity fields are absent from the public
DTO.

Host releases a term only when every normalized token has proof from Indexer's
public catalog fields and the same `(kind, query_key)` reaches the anonymous
session threshold within the UTC seven-day window. Missing proof rejects the
term by default. The current k is 5, explicitly pending owner confirmation;
different sessions do not imply different people. Only `terms` may later be
supplied to a model; status, coverage and totals support local deterministic reporting.
Consumers displaying `renderSearchMissReport` output must treat it as plain text.
Saved reports, drafts, downloads and caches must all expire by `expiresOn`.
The read-only export itself does not persist derived content, invoke a model,
send a notification or grant publication capability. C10 must consume the public
export and recheck privacy and freshness before any external call.

## Validation and basis

`npm ci && npm test` runs the existing `node:test` and strict TypeScript entry
points. Ajv **8.20.0** is an exact development dependency approved for these
schema tests; it is not a runtime dependency or shipped validator. Tests compile
both schemas in strict mode, cover positive and negative payloads, reject extra
identity fields at every object boundary, check the 100/101 term boundary and
UTC examples, and verify the adopted artifacts against their recorded hashes.
Validation does not remove extra fields, coerce values or insert defaults.

Basis: [JSON Schema draft-07 validation vocabulary](https://json-schema.org/draft-07/draft-handrews-json-schema-validation-01),
[Ajv compilation and reuse](https://ajv.js.org/guide/getting-started.html#basic-data-validation),
and [Ajv strict mode and data-modification options](https://ajv.js.org/options.html).
Host's source is the authority for business semantics; this package introduces
no independent filtering, authorization or date-arithmetic mechanism.
