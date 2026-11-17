import {SEARCH_MISS_EXPORT_SCHEMA, SEARCH_MISS_EXPORT_ERROR_SCHEMA} from '@hanamesh/api-contracts/host/search-miss-export';

// Consumers can pass these plain schema objects to a validator of their choice.
const success: Readonly<Record<string, unknown>> = SEARCH_MISS_EXPORT_SCHEMA;
const error: Readonly<Record<string, unknown>> = SEARCH_MISS_EXPORT_ERROR_SCHEMA;
// @ts-expect-error schemas are data, not Host runtime readers
SEARCH_MISS_EXPORT_SCHEMA({endDay: '2026-11-17'});
// @ts-expect-error implementations stay in Host, not in this contract package
import {readSearchMissExport} from '@hanamesh/api-contracts/host/search-miss-export';
// @ts-expect-error this isolated contract does not extend the package root
import {SEARCH_MISS_EXPORT_SCHEMA as RootSchema} from '@hanamesh/api-contracts';
void [success, error];
