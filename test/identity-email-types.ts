import type {Locale} from '@hanamesh/api-contracts/catalog/localized';
import {EMAIL_VERIFICATION_REQUEST_SCHEMA, type EmailVerificationRequestInput, type ResolvedEmailVerificationRequest} from '@hanamesh/api-contracts/identity/email';
const omitted:EmailVerificationRequestInput={email:'a@example.test'};
const regional:EmailVerificationRequestInput={email:'a@example.test',locale:'fr-CA'};
const resolved:ResolvedEmailVerificationRequest={email:'a@example.test',locale:'pt-BR'};
const locale:Locale=resolved.locale;
// @ts-expect-error locale is a string BCP47 input, not an array
const array:EmailVerificationRequestInput={email:'a@example.test',locale:['en']};
// @ts-expect-error resolved locale must be the shared canonical supported type
const unsupported:ResolvedEmailVerificationRequest={email:'a@example.test',locale:'fr'};
void [omitted,regional,resolved,locale,array,unsupported,EMAIL_VERIFICATION_REQUEST_SCHEMA];
