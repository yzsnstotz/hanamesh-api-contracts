import type {
    createConfirmedLaunchProducer, createLaunchAdmissionProducer, createUserPaidClaimAdapter,
    createBondSupplyAdapter, createSwapSupplyAdapter, ConfirmedLaunch, ConfirmedLaunchProducer,
    AdmissionRequest, UserPaidClaimRequest, BondQuoteRequest, SwapQuoteRequest,
    createDistributionAdapter, DistributionAdapter, DistributionAdapterOptions, DistributionResult, DistributionStepResult,
    DistributionCanonicalReadback, DistributionVerifyResult, DistributionSnapshot, DistributionErrorCode, ChainAdapterErrorCode,
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
    createDistributionAdapter: typeof createDistributionAdapter;
}
export declare const CHAIN_FIXTURE_LABEL: string;
export declare function createChainContractExamples(): {
    label: string; confirmedLaunch: ConfirmedLaunch; admissionRequest: AdmissionRequest; claimRequest: UserPaidClaimRequest;
    bondQuoteRequest: BondQuoteRequest; swapQuoteRequest: SwapQuoteRequest;
};
export declare function createChainProviderFixture(confirmedLaunch?: ConfirmedLaunch | null): {
    label: string; producer: ConfirmedLaunchProducer;
};

/** JSON wire form of the provider examples: every bigint is a decimal string (in process they are bigint as declared). */
export type DistributionWire<T> = T extends bigint ? string : T extends readonly (infer U)[] ? readonly DistributionWire<U>[]
    : T extends object ? { readonly [K in keyof T]: DistributionWire<T[K]> } : T;
/** Example receipts/transactions are trimmed to the fields the adapter verified; they are not full viem objects. */
export type DistributionStepResultWire = Omit<DistributionWire<DistributionStepResult>, 'receipt' | 'transaction'> &
    { readonly receipt?: unknown; readonly transaction?: unknown };
export type DistributionResultWire = Omit<DistributionWire<DistributionResult>, 'steps'> & { readonly steps: readonly DistributionStepResultWire[] };
export type DistributionErrorWire =
    { readonly name: 'DistributionError'; readonly code: DistributionErrorCode; readonly message: string; readonly need?: string; readonly result?: DistributionResultWire } |
    { readonly name: 'ChainAdapterConfigurationError'; readonly code: ChainAdapterErrorCode; readonly message: string };
type InjectedPort = 'publicClient' | 'walletClient' | 'journal' | 'rootSigners';
/** Byte-exact copy of server-chain v0.3.0 docs/distribution/contract-examples.json (FIXTURE; produced by the real adapter over TEST_ONLY transport). */
export interface DistributionContractExamples {
    readonly contract: 'C-CHAIN'; readonly provider: string; readonly surface: 'createDistributionAdapter'; readonly evidence: 'FIXTURE';
    readonly label: string; readonly generator: string; readonly encoding: string;
    readonly frozenInputs: Readonly<Record<'package' | 'version' | 'tag' | 'commit' | 'path' | 'manifestSha256' | 'providerCard' | 'providerCommit', string>>;
    readonly call: {
        readonly factory: string; readonly methods: readonly string[];
        readonly options: Omit<DistributionWire<DistributionAdapterOptions>, InjectedPort> & Readonly<Record<Exclude<InjectedPort, 'rootSigners'>, string>> &
            { readonly rootSigners?: Readonly<Record<'ordinary' | 'reserved', { readonly address: string; readonly signTypedData: 'function' }>> };
        readonly snapshot: DistributionWire<DistributionSnapshot>;
    };
    readonly success: {
        readonly verify: DistributionWire<DistributionVerifyResult>; readonly result: DistributionResultWire;
        readonly canonicalReadback: { readonly result: DistributionResultWire; readonly readback: DistributionWire<DistributionCanonicalReadback> };
    };
    readonly partial: { readonly execute: DistributionErrorWire; readonly result: DistributionResultWire };
    readonly failure: Readonly<Record<'rootFactMismatch' | 'authorizationExpiredBeforeAnySend' | 'intentNotFound' | 'policyModeRequired' | 'configurationInvalid', DistributionErrorWire>>;
}
export declare const CHAIN_DISTRIBUTION_FIXTURE_LABEL: string;
export declare function createChainDistributionExamples(): DistributionContractExamples;
/**
 * Minimal read-only FIXTURE of the two DistributionAdapter read methods, in wire form. It never verifies, signs or sends:
 * execute/verify stay with the real adapter (provider TEST_ONLY transport: @hanamesh/server-chain/distribution/test-only).
 */
export declare function createDistributionReadFixture(examples?: DistributionContractExamples): {
    label: string;
    adapter: {
        result(intentId: string): Promise<DistributionResultWire>;
        canonicalReadback(intentId: string): Promise<DistributionContractExamples['success']['canonicalReadback']>;
    };
};

export type * from './quote-v2/provider.js';
