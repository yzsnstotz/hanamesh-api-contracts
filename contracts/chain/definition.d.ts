/** Pure metadata; importing the package registry does not require the optional viem peer. */
export type ChainFactoryName = 'createConfirmedLaunchProducer' | 'createLaunchAdmissionProducer' |
    'createUserPaidClaimAdapter' | 'createBondSupplyAdapter' | 'createSwapSupplyAdapter';
export interface ChainFactoryDefinition {
    readonly source: string; readonly errorClass: string; readonly signature: string;
    readonly baselineErrors: readonly string[]; readonly errors: readonly string[]; readonly directErrors: readonly string[];
    readonly sharedErrorSources: readonly string[]; readonly errorChannel: string; readonly note: string;
    readonly sharedErrors: readonly string[];
}
export declare const CHAIN_CONTRACT_DEFINITION: {
    readonly id: 'C-CHAIN'; readonly provider: 'server-chain'; readonly providerCommit: string;
    readonly factories: Readonly<Record<ChainFactoryName, ChainFactoryDefinition>>;
};
