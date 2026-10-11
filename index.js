import { CORE_CONTRACT_DEFINITION } from './contracts/core/index.js';
import { USAGE_LOCAL_CONTRACT_DEFINITION } from './contracts/usage-local/index.js';
import { IDENTITY_CONTRACT_DEFINITION } from './contracts/identity/definition.js';
/** Contracts published in this version, keyed by baseline id. Each entry has its own subpath export. */
export const CONTRACTS = Object.freeze({
    'C-CORE': Object.freeze({ provider: 'core', consumers: Object.freeze(['usage', 'desktop']), entry: '@hanamesh/api-contracts/core', definition: CORE_CONTRACT_DEFINITION }),
    'C-USAGE-LOCAL': Object.freeze({ provider: 'usage', consumers: Object.freeze(['app-host']), entry: '@hanamesh/api-contracts/usage-local', definition: USAGE_LOCAL_CONTRACT_DEFINITION }),
    'C-IDENTITY': Object.freeze({ provider: 'server-identity', consumers: Object.freeze(['core', 'web-market', 'server-usage', 'server-custody', 'server-claim', 'server-registry', 'server-host']), entry: '@hanamesh/api-contracts/identity', definition: IDENTITY_CONTRACT_DEFINITION }),
});
