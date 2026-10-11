import { readFileSync } from 'node:fs';
const provenance = JSON.parse(readFileSync(new URL('./provenance.json', import.meta.url), 'utf8'));
export const CHAIN_CONTRACT_DEFINITION = Object.freeze({
    id: 'C-CHAIN', provider: 'server-chain', providerCommit: provenance.providerCommit,
    factories: Object.freeze(provenance.factories),
    /** Q-33 createDistributionAdapter surface pinned to the provider's later release; the five earlier factories keep providerCommit. */
    distribution: Object.freeze({ providerTag: provenance.distribution.providerTag, providerCommit: provenance.distribution.providerCommit }),
});
