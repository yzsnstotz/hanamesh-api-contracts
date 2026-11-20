export declare const LOCALES: readonly ['zh','en','ja','pt-BR','es','ko','vi','id','ru'];
export type Locale = typeof LOCALES[number];
/** At least one real translation; absent keys mean missing, never null placeholders. */
export type LocalizedText = {
  readonly byLocale: Readonly<Partial<Record<Locale,string>>> & {
    [K in Locale]: Readonly<Record<K,string>>
  }[Locale];
};
export declare const LOCALIZED_SCHEMA: object;
export declare const LOCALIZED_SCHEMA_VERSION: 'localized-v2';
export declare const LOCALIZED_FALLBACK_LOCALE: 'en';
export declare const DOES_LIMITS_VERSION: 'does-limits-v2';
/** NFC-derived Unicode code points, including spaces and punctuation. Never truncate. */
export declare const DOES_LIMITS: Readonly<{zh:28;en:70;ja:35;'pt-BR':80;es:80;ko:45;vi:90;id:80;ru:80}>;
