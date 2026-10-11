import type {
    ChainFactories, ChainFactoryName, ConfirmedLaunch, ConfirmedLaunchProducer, LaunchAdmissionProducer,
    UserPaidClaimAdapter, BondSupplyAdapter, SwapSupplyAdapter, SwapSupplyPublicClientPort,
} from '@hanamesh/api-contracts/chain';
import { createChainContractExamples, createChainProviderFixture } from '@hanamesh/api-contracts/chain';
import { HANASWAP_ROUTER02_ABI } from '@hanamesh/api-contracts/hanaswap';
import { encodeFunctionData } from 'viem';
import { CONTRACTS } from '@hanamesh/api-contracts';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type FactoryKeys = Assert<Equal<keyof ChainFactories, ChainFactoryName>>;
type ConfirmedReturn = Assert<Equal<Awaited<ReturnType<ChainFactories['createConfirmedLaunchProducer']>>, ConfirmedLaunchProducer>>;
type AdmissionReturn = Assert<Equal<Awaited<ReturnType<ChainFactories['createLaunchAdmissionProducer']>>, LaunchAdmissionProducer>>;
type ClaimReturn = Assert<Equal<Awaited<ReturnType<ChainFactories['createUserPaidClaimAdapter']>>, UserPaidClaimAdapter>>;
type BondReturn = Assert<Equal<Awaited<ReturnType<ChainFactories['createBondSupplyAdapter']>>, BondSupplyAdapter>>;
type SwapReturn = Assert<Equal<Awaited<ReturnType<ChainFactories['createSwapSupplyAdapter']>>, SwapSupplyAdapter>>;

declare const factories: ChainFactories;
declare const claimOptions: Parameters<ChainFactories['createUserPaidClaimAdapter']>[0];
declare const swapOptions: Parameters<ChainFactories['createSwapSupplyAdapter']>[0];
declare const bondOptions: Parameters<ChainFactories['createBondSupplyAdapter']>[0];
declare const admissionOptions: Parameters<ChainFactories['createLaunchAdmissionProducer']>[0];
declare const confirmedOptions: Parameters<ChainFactories['createConfirmedLaunchProducer']>[0];
void factories.createConfirmedLaunchProducer(confirmedOptions);
void factories.createLaunchAdmissionProducer(admissionOptions);
void factories.createUserPaidClaimAdapter(claimOptions);
void factories.createBondSupplyAdapter(bondOptions);
void factories.createSwapSupplyAdapter(swapOptions);
// @ts-expect-error claim signing belongs exclusively to the user's wallet
void factories.createUserPaidClaimAdapter({ ...claimOptions, walletClient: {} });
// @ts-expect-error swap signing belongs exclusively to the user's wallet
void factories.createSwapSupplyAdapter({ ...swapOptions, walletClient: {} });
// @ts-expect-error the existing Bond server-signed factory requires a wallet client
void factories.createBondSupplyAdapter({ ...bondOptions, walletClient: undefined });
// @ts-expect-error all admission dependencies remain explicit
void factories.createLaunchAdmissionProducer({});

const examples = createChainContractExamples();
const producer: ConfirmedLaunchProducer = createChainProviderFixture(examples.confirmedLaunch).producer;
async function read(): Promise<ConfirmedLaunch | null> {
    const value = await producer.getConfirmedLaunch({ requestId: examples.confirmedLaunch.requestId });
    if (value) {
        // @ts-expect-error canonical issuance DTO is readonly
        value.paidAmount = '0';
        // @ts-expect-error submission validity is not an issuance fact in the provider's v0.2 DTO
        void value.rootValidUntil;
    }
    return value;
}
const args = [1n, 1n, ['0x0000000000000000000000000000000000000001', '0x0000000000000000000000000000000000000002'], '0x0000000000000000000000000000000000000003', 1n] as const;
void encodeFunctionData({ abi: HANASWAP_ROUTER02_ABI, functionName: 'swapExactTokensForTokens', args });
// @ts-expect-error ABI quantities must be bigint, not decimal wire strings
void encodeFunctionData({ abi: HANASWAP_ROUTER02_ABI, functionName: 'swapExactTokensForTokens', args: ['1', ...args.slice(1)] });
void read; void CONTRACTS['C-CHAIN'].definition.factories.createSwapSupplyAdapter.errors;
void CONTRACTS['C-HANASWAP'].definition.calls.removeLiquidity.errors;
declare const pc: SwapSupplyPublicClientPort;
void pc.simulateCalls;
