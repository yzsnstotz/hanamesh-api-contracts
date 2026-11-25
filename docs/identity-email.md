# Identity verification email request

`@hanamesh/api-contracts/identity/email` exports `EmailVerificationRequestInput`,
`ResolvedEmailVerificationRequest`, and `EMAIL_VERIFICATION_REQUEST_SCHEMA`.
The browser JSON schema is also exported at `identity/email/request.schema.json`.

`POST /v1/identity/me/email` and Identity's public `requestVerification` service take
`{email: string, locale?: string}`. The existing email validation is unchanged.
Only these properties are allowed over HTTP. Locale is a BCP 47 input string:

1. Omitted locale resolves to `en`.
2. A supplied value must be a string accepted by `Intl.getCanonicalLocales`.
   Invalid syntax (including empty string, underscores, whitespace) returns
   `IDENTITY_INPUT_INVALID` / HTTP 400. JSON null and arrays are invalid.
3. Canonicalize the tag before matching. Use the existing
   `catalog/localized` schema's `$defs.locale` validator and `Locale` type.
   Exact supported tags match; otherwise match the supported primary language.
   Portuguese (`pt`, including region/script variants) resolves to `pt-BR`.
   For example `PT-br` → `pt-BR`, `es-MX` → `es`, `zh-Hant-TW` → `zh`.
4. A syntactically valid unsupported language such as `fr-CA` resolves to `en`.

The structural JSON schema does not attempt to duplicate ECMA-402's BCP 47
grammar. The Identity resource module owns semantic validation. Resolved locale
is I18N-C's existing `Locale`; no second supported-language list is introduced.

The response remains `{pending:{email,expiresAt}}` / HTTP 202. The service result,
authentication, recent-login requirement, `verifyToken({token})`, token creation,
hashing, single-use consumption, expiry and resend interval are unchanged.
Locale only selects the plain-text subject/body and CLDR duration formatting.
It is never appended to, translated into, or used to rewrite the verification URL
or token. The host and website consume public contracts; they do not own templates.

Authority: orchestrator's I18NE ruling on 2026-11-21; allocated version 0.32.0.
Translations are drafts pending R's per-language review.

2026-11-25 编排统一版本裁定：本文件所述新增能力随 api-contracts 0.30.0 合批；上文0.32.0为原未发布分配历史，不能当正式tag。
