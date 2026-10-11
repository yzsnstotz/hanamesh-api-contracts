import type { CLAIM_CONTRACT_DEFINITION } from './contracts/claim/definition.js';
import type { INDEXER_CONTRACT_DEFINITION } from './contracts/indexer-catalog/definition.js';
import type { CONTRACTS_ABI_DEFINITION } from './contracts/contracts-abi/index.js';
import type { IDENTITY_CONTRACT_DEFINITION } from './contracts/identity/definition.js';
import type { CHAIN_CONTRACT_DEFINITION } from './contracts/chain/definition.js';
import type { HANASWAP_CONTRACT_DEFINITION } from './contracts/hanaswap/index.js';
import type { CATALOG_CONTRACT_DEFINITION } from './contracts/catalog/index.js';
import type { UOW_CONTRACT_DEFINITION } from './contracts/uow/index.js';
export interface PublishedContract { readonly provider: string; readonly consumers: readonly string[]; readonly entry: string; readonly definition: { readonly id: string; readonly service: string; readonly methods: Readonly<Record<string, { readonly errors: readonly string[] }>> } }
/** C-IDENTITY spans HTTP routes and server ports, so its definition lists `calls` instead of one service's `methods`. */
export interface PublishedCallContract { readonly provider: string; readonly consumers: readonly string[]; readonly entry: string; readonly definition: typeof IDENTITY_CONTRACT_DEFINITION }
export interface PublishedDefinitionContract<T> { readonly provider: string; readonly consumers: readonly string[]; readonly entry: string; readonly definition: T }
export declare const CONTRACTS: Readonly<Record<'C-CORE' | 'C-USAGE-LOCAL', PublishedContract> & Record<'C-IDENTITY', PublishedCallContract>
    & Record<'C-CHAIN', PublishedDefinitionContract<typeof CHAIN_CONTRACT_DEFINITION>>
    & Record<'C-HANASWAP', PublishedDefinitionContract<typeof HANASWAP_CONTRACT_DEFINITION>>
    & Record<'C-CATALOG', PublishedDefinitionContract<typeof CATALOG_CONTRACT_DEFINITION>>
    & Record<'C-CONTRACTS-ABI', PublishedDefinitionContract<typeof CONTRACTS_ABI_DEFINITION>>
    & Record<'C-CLAIM', PublishedDefinitionContract<typeof CLAIM_CONTRACT_DEFINITION>>
    & Record<'C-INDEXER-CATALOG', PublishedDefinitionContract<typeof INDEXER_CONTRACT_DEFINITION>>
    & Record<'C-UOW', PublishedDefinitionContract<typeof UOW_CONTRACT_DEFINITION>>>;
