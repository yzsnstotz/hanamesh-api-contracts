import type {Locale} from '../../catalog/localized/index.js';
/** POST /v1/identity/me/email and EmailBindingService.requestVerification input.
 * locale is a BCP 47 string, not a supported-locale enum at the input boundary.
 * Omitted -> en; Intl.getCanonicalLocales first; supported base language matches;
 * pt -> pt-BR; well-formed unsupported -> en; malformed/non-string -> 400.
 * Only the email's text changes. Response, verification URL/token and timing do not.
 */
export interface EmailVerificationRequestInput {readonly email: string; readonly locale?: string}
/** Output of the owning Identity input normalizer uses I18N-C's canonical Locale. */
export interface ResolvedEmailVerificationRequest {readonly email: string; readonly locale: Locale}
/** Structural validation only. Identity additionally validates tag syntax with Intl.getCanonicalLocales. */
export declare const EMAIL_VERIFICATION_REQUEST_SCHEMA: object;
