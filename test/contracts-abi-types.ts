import { encodeFunctionData } from 'viem';
import { HANA_TOKEN_ABI, LAUNCH_FEE_ABI, HANA_LAUNCHER_ABI, HANA_TOKEN_FROZEN } from '@hanamesh/api-contracts/contracts-abi';
encodeFunctionData({abi: HANA_TOKEN_ABI, functionName: 'transfer', args: ['0x0000000000000000000000000000000000000001', 1n]});
encodeFunctionData({abi: LAUNCH_FEE_ABI, functionName: 'pay', args: ['0x00', '0x00']});
encodeFunctionData({abi: HANA_LAUNCHER_ABI, functionName: 'authorizationDigest', args: [{hanaId: '0x00', requestId: '0x00', payer: '0x0000000000000000000000000000000000000001', subject: '0x00', snapshot: '0x00', name: 'Hana', symbol: 'HANA', hanaTreasury: '0x0000000000000000000000000000000000000001', harnUsdE18: 1n, deadline: 1n}]});
const metadata: Readonly<Record<string, unknown>> = HANA_TOKEN_FROZEN.metadata;
void metadata;
