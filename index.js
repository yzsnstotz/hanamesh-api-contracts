import { USAGE_CONTRACT_DEFINITION } from './contracts/usage/index.js';
import { POINTS_CONTRACT_DEFINITION } from './contracts/points/index.js';
import { CLAIM_CONTRACT_DEFINITION } from './contracts/claim/index.js';
import { INDEXER_CONTRACT_DEFINITION } from './contracts/indexer-catalog/index.js';
import { CONTRACTS_ABI_DEFINITION } from './contracts/contracts-abi/index.js';
import { CORE_CONTRACT_DEFINITION } from './contracts/core/index.js';
import { USAGE_LOCAL_CONTRACT_DEFINITION } from './contracts/usage-local/index.js';
import { IDENTITY_CONTRACT_DEFINITION } from './contracts/identity/definition.js';
import { CHAIN_CONTRACT_DEFINITION } from './contracts/chain/definition.js';
import { HANASWAP_CONTRACT_DEFINITION } from './contracts/hanaswap/index.js';
import { UOW_CONTRACT_DEFINITION } from './contracts/uow/definition.js';
import { SEMANTIC_CONTRACT_DEFINITION } from './contracts/semantic/index.js';
/** Contracts published in this version, keyed by baseline id. Each entry has its own subpath export. */
export const CONTRACTS = Object.freeze({
    'C-SEMANTIC': Object.freeze({provider: 'server-semantic', consumers: Object.freeze(['server-host']), entry: '@hanamesh/api-contracts/semantic', definition: SEMANTIC_CONTRACT_DEFINITION}),
    'C-POINTS': Object.freeze({provider:'server-custody',consumers:Object.freeze(['core','web-market','server-host']),entry:'@hanamesh/api-contracts/points',definition:POINTS_CONTRACT_DEFINITION}),
    'C-USAGE': Object.freeze({provider:'server-usage',consumers:Object.freeze(['usage','web-market','server-host']),entry:'@hanamesh/api-contracts/usage',definition:USAGE_CONTRACT_DEFINITION}),
    'C-CLAIM': Object.freeze({provider: 'server-claim', consumers: Object.freeze(['web-market', 'server-host']), entry: '@hanamesh/api-contracts/claim', definition: CLAIM_CONTRACT_DEFINITION}),
    'C-INDEXER-CATALOG': Object.freeze({provider: 'server-indexer', consumers: Object.freeze(['web-market', 'server-host']), entry: '@hanamesh/api-contracts/indexer-catalog', definition: INDEXER_CONTRACT_DEFINITION}),
    'C-CONTRACTS-ABI': Object.freeze({ provider: 'contracts', consumers: Object.freeze(['server-chain']), entry: '@hanamesh/api-contracts/contracts-abi', definition: CONTRACTS_ABI_DEFINITION }),
    'C-UOW': Object.freeze({ provider: 'server-host', consumers: Object.freeze(['server-usage', 'server-custody', 'server-claim', 'server-identity', 'server-registry']), entry: '@hanamesh/api-contracts/uow', definition: UOW_CONTRACT_DEFINITION }),
    'C-CORE': Object.freeze({ provider: 'core', consumers: Object.freeze(['usage', 'desktop']), entry: '@hanamesh/api-contracts/core', definition: CORE_CONTRACT_DEFINITION }),
    'C-USAGE-LOCAL': Object.freeze({ provider: 'usage', consumers: Object.freeze(['app-host']), entry: '@hanamesh/api-contracts/usage-local', definition: USAGE_LOCAL_CONTRACT_DEFINITION }),
    'C-IDENTITY': Object.freeze({ provider: 'server-identity', consumers: Object.freeze(['core', 'web-market', 'server-usage', 'server-custody', 'server-claim', 'server-registry', 'server-host']), entry: '@hanamesh/api-contracts/identity', definition: IDENTITY_CONTRACT_DEFINITION }),
    'C-CHAIN': Object.freeze({ provider: 'server-chain', consumers: Object.freeze(['server-host']), entry: '@hanamesh/api-contracts/chain', definition: CHAIN_CONTRACT_DEFINITION }),
    'C-HANASWAP': Object.freeze({ provider: 'contracts', consumers: Object.freeze(['server-chain']), entry: '@hanamesh/api-contracts/hanaswap', definition: HANASWAP_CONTRACT_DEFINITION }),
});
