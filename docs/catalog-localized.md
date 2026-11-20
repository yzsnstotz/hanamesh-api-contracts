# localized-v2 / does-limits-v2 (API 0.28.0)

Public entry: `@hanamesh/api-contracts/catalog/localized`; JSON entry:
`@hanamesh/api-contracts/catalog/localized/schema.json`.
Canonical schema ID: `https://hanamesh.com/contracts/catalog/localized-v2`.

`Locale` / `LOCALES` are the exact BCP47 content tags:
`zh`, `en`, `ja`, `pt-BR`, `es`, `ko`, `vi`, `id`, `ru`.
Wire keys are case-sensitive and canonical: reject `pt`, `pt-br`, `en-US`, and unknown tags.
The DSH locale service's existing `pt` is mapped to content `pt-BR` by its consumer boundary;
this package does not change DSH or create a second locale preference service.

```json
{"byLocale":{"en":"Search code","pt-BR":"Busca código"}}
```

`LocalizedText` is a closed object with one required `byLocale` map. The map is closed to
these nine keys and must contain at least one string. Languages may be absent, including en;
null/undefined map values, an empty map, extra container fields and the old top-level
`{zh,en,ja}` are invalid. An entirely unknown fact remains null at the owning field.
Empty strings keep the prior string contract; they are present values, not missing keys.
No general summary/README length cap is introduced. TypeScript describes the nonempty map
and allowed keys; exact object closure and numeric/string limits require schema validation
at serialized boundaries (TypeScript is structurally typed).

Fallback is mandatory and ordered: requested key if present, otherwise `en` if present,
otherwise the original source text supplied by the owning provider. If the source text is
also absent, preserve the owner's missing/null state. Do not choose an arbitrary available
language, generate a translation on a read, or write the fallback value into a missing key.
The displayed language/source label must identify the actual selected text; fallback never
means translation completion. This is a display rule, not an old-payload compatibility reader.
`LOCALIZED_FALLBACK_LOCALE` exports the fixed English fallback; original text and its source
language remain in the owning provider's source fields, outside the translation container.

`does-limits-v2` is frozen by the I18NC assignment from I18N1-plan §5:

| Locale | Maximum Unicode code points |
|---|---:|
| zh | 28 |
| en | 70 |
| ja | 35 |
| pt-BR | 80 |
| es | 80 |
| ko | 45 |
| vi | 90 |
| id | 80 |
| ru | 80 |

Only derived translated text is normalized to NFC by its producer before measuring and
validating. Count Unicode code points, including spaces and punctuation, rather than UTF16
code units or grapheme clusters. JSON Schema `maxLength` counts the serialized code points;
it does not perform normalization. Reject overlong output without truncation. Never normalize
or rewrite original README, source hashes, evidence quotes or URLs. This package publishes
schema/data/types, not a second runtime validator, normalizer or translation service.

Register `LOCALIZED_SCHEMA` and `DISCOVERY_SCHEMA` together with Ajv2020 (existing pinned
Ajv8.20.0); resolve canonical `$ref`s from this registry without network fetching.
`$defs.locale` validates a single content tag, `$defs.localizedText` generic text, and
`$defs.does` the same shape with per-language limits. Discovery references these exact definitions.

Replaced shapes: discovery capability句, detail reasons, audience/difficultyReason values,
and all page/directory facet names. `DiscoveryLocalizedText` is deleted; import the shared
`LocalizedText` instead. The consuming provider's summary also adopts this type in its own
follow-up, not as a new discovery field. No legacy union/adapter/dual write is shipped.

Consumers to coordinate before switching a composed system:

| Owner | Required follow-up |
|---|---|
| Indexer | Shared locale at enrichment/translation public ports, summary/override/discovery projections, taxonomy names and inventory; update SQL locale checks and source/hash/manual-lock/stale handling. Inventory manual locks before replacement; never clear original data or budget history. |
| AI | Shared target locale and output shapes, explicit schema/prompt/cache-generation version changes, evidence preservation, per-locale NFC does bounds; retain budget and unknown-usage semantics. |
| Web | Replace three-key reads and inline locale branches, read byLocale, label target/en/original fallback accurately; all nine UI dictionaries and locale-prefixed public routes remain its task. |
| Market | Consume public types and DSH locale service, map pt→pt-BR at boundary, sparse fallback/source labels and localized facets; three-version DSH interaction checks remain its task. |

Host only composes the adopted public ports/dependencies; it does not own a second map,
translation job or SQL implementation. Orchestration schedules coordinated consumer adoption;
this candidate alone does not make existing consumers nine-language compliant.

Mature bases: [BCP47 / RFC5646](https://www.rfc-editor.org/rfc/rfc5646),
[JSON Schema2020-12 validation](https://json-schema.org/draft/2020-12/json-schema-validation),
[Ajv schema registry/reference handling](https://ajv.js.org/guide/managing-schemas.html),
[Unicode normalization](https://www.unicode.org/reports/tr15/).
Custom: the byLocale container, English/source fallback and precise language limits are
HanaMesh contract choices authorized by this assignment, not numeric limits from those standards.
