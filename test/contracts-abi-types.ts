import { encodeFunctionData } from 'viem';
import { HANA_TOKEN_ABI, LAUNCH_FEE_ABI, HANA_LAUNCHER_ABI, HANA_TOKEN_FROZEN } from '@hanamesh/api-contracts/contracts-abi';
encodeFunctionData({abi: HANA_TOKEN_ABI, functionName: 'transfer', args: ['0x0000000000000000000000000000000000000001', 1n]});
encodeFunctionData({abi: LAUNCH_FEE_ABI, functionName: 'pay', args: ['0x00', '0x00']});
encodeFunctionData({abi: HANA_LAUNCHER_ABI, functionName: 'authorizationDigest', args: [{hanaId: '0x00', requestId: '0x00', payer: '0x0000000000000000000000000000000000000001', subject: '0x00', snapshot: '0x00', name: 'Hana', symbol: 'HANA', hanaTreasury: '0x0000000000000000000000000000000000000001', harnUsdE18: 1n, deadline: 1n}]});
const metadata: Readonly<Record<string, unknown>> = HANA_TOKEN_FROZEN.metadata;
void metadata;

// The complete CTR-09 collection has its own ABI literals; legacy imports above stay unchanged.
import {encodeDeployData} from 'viem';
import {DISTRIBUTOR_ABI, RESERVED_DISTRIBUTOR_ABI, DISTRIBUTOR_FROZEN, RESERVED_DISTRIBUTOR_FROZEN, CONTRACTS_ABI_FROZEN, CONTRACTS_ABI_FROZEN_MANIFEST, CONTRACTS_ABI_PROVENANCE} from '@hanamesh/api-contracts/contracts-abi/frozen/oz-ctr09';
const signer = '0x0000000000000000000000000000000000000001' as const;
const treasury = '0x0000000000000000000000000000000000000002' as const;
encodeDeployData({abi: DISTRIBUTOR_ABI, bytecode: DISTRIBUTOR_FROZEN.creationBytecode, args: [signer]});
encodeDeployData({abi: RESERVED_DISTRIBUTOR_ABI, bytecode: RESERVED_DISTRIBUTOR_FROZEN.creationBytecode, args: [signer, treasury]});
// @ts-expect-error Distributor takes exactly one address.
encodeDeployData({abi: DISTRIBUTOR_ABI, bytecode: DISTRIBUTOR_FROZEN.creationBytecode, args: [signer, treasury]});
// @ts-expect-error ReservedDistributor requires treasury as its second address.
encodeDeployData({abi: RESERVED_DISTRIBUTOR_ABI, bytecode: RESERVED_DISTRIBUTOR_FROZEN.creationBytecode, args: [signer]});
const completeName: 'ReservedDistributor' = CONTRACTS_ABI_FROZEN.ReservedDistributor.contract;
const providerCommit: '2ca2fb07b8b94804ac5c8b336d26dfb9f195253a' = CONTRACTS_ABI_PROVENANCE.providerCommit;
const sourceCompiler: '0.8.26+commit.8a97fa7a' = CONTRACTS_ABI_FROZEN_MANIFEST.compiler;
void [completeName, providerCommit, sourceCompiler];
