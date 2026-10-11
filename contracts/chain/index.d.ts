import type {
    createConfirmedLaunchProducer, createLaunchAdmissionProducer, createUserPaidClaimAdapter,
    createBondSupplyAdapter, createSwapSupplyAdapter, ConfirmedLaunch, ConfirmedLaunchProducer,
    AdmissionRequest, UserPaidClaimRequest, BondQuoteRequest, SwapQuoteRequest,
} from './provider.js';
/** All production factories and error constructors are type-only; implementation stays with server-chain. */
export type * from './provider.js';
export { CHAIN_CONTRACT_DEFINITION } from './definition.js';
export type { ChainFactoryName, ChainFactoryDefinition } from './definition.js';
export interface ChainFactories {
    createConfirmedLaunchProducer: typeof createConfirmedLaunchProducer;
    createLaunchAdmissionProducer: typeof createLaunchAdmissionProducer;
    createUserPaidClaimAdapter: typeof createUserPaidClaimAdapter;
    createBondSupplyAdapter: typeof createBondSupplyAdapter;
    createSwapSupplyAdapter: typeof createSwapSupplyAdapter;
}
export declare const CHAIN_FIXTURE_LABEL: string;
export declare function createChainContractExamples(): {
    label: string; confirmedLaunch: ConfirmedLaunch; admissionRequest: AdmissionRequest; claimRequest: UserPaidClaimRequest;
    bondQuoteRequest: BondQuoteRequest; swapQuoteRequest: SwapQuoteRequest;
};
export declare function createChainProviderFixture(confirmedLaunch?: ConfirmedLaunch | null): {
    label: string; producer: ConfirmedLaunchProducer;
};
