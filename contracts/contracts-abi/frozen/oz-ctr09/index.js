import {readFileSync} from 'node:fs';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
export const HANA_LAUNCHER_FROZEN = read('./HanaLauncher.json');
export const HANA_LAUNCHER_ABI = HANA_LAUNCHER_FROZEN.abi;
export const LAUNCH_FEE_FROZEN = read('./LaunchFee.json');
export const LAUNCH_FEE_ABI = LAUNCH_FEE_FROZEN.abi;
export const HANA_TOKEN_FROZEN = read('./HanaToken.json');
export const HANA_TOKEN_ABI = HANA_TOKEN_FROZEN.abi;
export const DISTRIBUTOR_FROZEN = read('./Distributor.json');
export const DISTRIBUTOR_ABI = DISTRIBUTOR_FROZEN.abi;
export const RESERVED_DISTRIBUTOR_FROZEN = read('./ReservedDistributor.json');
export const RESERVED_DISTRIBUTOR_ABI = RESERVED_DISTRIBUTOR_FROZEN.abi;
export const CONTRACTS_ABI_FROZEN_MANIFEST = read('./manifest.json');
export const CONTRACTS_ABI_PROVENANCE = read('./provenance.json');
export const CONTRACTS_ABI_FROZEN = Object.freeze({HanaLauncher: HANA_LAUNCHER_FROZEN, LaunchFee: LAUNCH_FEE_FROZEN, HanaToken: HANA_TOKEN_FROZEN, Distributor: DISTRIBUTOR_FROZEN, ReservedDistributor: RESERVED_DISTRIBUTOR_FROZEN});
export const CONTRACTS_ABI_DEFINITION = Object.freeze({id: 'C-CONTRACTS-ABI', provider: 'contracts', providerCommit: '2ca2fb07b8b94804ac5c8b336d26dfb9f195253a', evidence: 'SOURCE_BUILD'});
export function createDistributorContractExamples() { return read('./distributor-example.json'); }
