import { readFileSync } from 'node:fs';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
export const HANA_LAUNCHER_FROZEN = read('./frozen/HanaLauncher.json');
export const LAUNCH_FEE_FROZEN = read('./frozen/LaunchFee.json');
export const HANA_TOKEN_FROZEN = read('./frozen/HanaToken.json');
export const HANA_LAUNCHER_ABI = HANA_LAUNCHER_FROZEN.abi;
export const LAUNCH_FEE_ABI = LAUNCH_FEE_FROZEN.abi;
export const HANA_TOKEN_ABI = HANA_TOKEN_FROZEN.abi;
export const CONTRACTS_ABI_MANIFEST = read('./launch-manifest.json');
export const CONTRACTS_ABI_FROZEN_MANIFEST = read('./frozen/manifest.json');
export const CONTRACTS_ABI_DEFINITION = Object.freeze({
    id: 'C-CONTRACTS-ABI', provider: 'contracts',
    providerCommit: 'fdfc672d81af286e8f118ccab29eb2a5386ba5ca', evidence: 'SOURCE_BUILD',
});
export function createContractsAbiContractExamples() { return read('./launch-example.json'); }
