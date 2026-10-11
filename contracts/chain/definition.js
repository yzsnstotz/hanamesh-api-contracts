import { readFileSync } from 'node:fs';
const provenance = JSON.parse(readFileSync(new URL('./provenance.json', import.meta.url), 'utf8'));
export const CHAIN_CONTRACT_DEFINITION = Object.freeze({
    id: 'C-CHAIN', provider: 'server-chain', providerCommit: provenance.providerCommit,
    factories: Object.freeze(provenance.factories),
});
