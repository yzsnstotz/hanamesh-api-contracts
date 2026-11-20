import schema from './schema.json' with {type:'json'};
export const LOCALIZED_SCHEMA=schema;
export const LOCALIZED_SCHEMA_VERSION='localized-v2';
export const LOCALES=Object.freeze(["zh", "en", "ja", "pt-BR", "es", "ko", "vi", "id", "ru"]);
export const LOCALIZED_FALLBACK_LOCALE='en';
export const DOES_LIMITS_VERSION='does-limits-v2';
export const DOES_LIMITS=Object.freeze({"zh": 28, "en": 70, "ja": 35, "pt-BR": 80, "es": 80, "ko": 45, "vi": 90, "id": 80, "ru": 80});
