/** Pure metadata; importing the package registry does not require the optional viem peer. */
export type ChainFactoryName = 'createConfirmedLaunchProducer' | 'createLaunchAdmissionProducer' |
    'createUserPaidClaimAdapter' | 'createBondSupplyAdapter' | 'createSwapSupplyAdapter' | 'createDistributionAdapter';
export interface ChainFactoryDefinition {
    readonly source: string; readonly errorClass: string; readonly signature: string;
    readonly baselineErrors: readonly string[]; readonly errors: readonly string[]; readonly directErrors: readonly string[];
    readonly sharedErrorSources: readonly string[]; readonly errorChannel: string; readonly note: string;
    readonly sharedErrors: readonly string[];
    /** Set when the factory is pinned to a later provider release than the contract-wide providerCommit. */
    readonly providerCommit?: string; readonly providerTag?: string;
    /** Separate error class the factory rejects with before any errorClass check (client/chain configuration faults). */
    readonly configurationErrorClass?: string; readonly configurationErrors?: readonly string[];
}
export declare const CHAIN_CONTRACT_DEFINITION: {
    readonly id: 'C-CHAIN'; readonly provider: 'server-chain'; readonly providerCommit: string;
    readonly factories: Readonly<Record<ChainFactoryName, ChainFactoryDefinition>>;
    readonly distribution: { readonly providerTag: string; readonly providerCommit: string };
};
