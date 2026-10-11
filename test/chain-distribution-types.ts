import type {
    ChainFactories, ChainFactoryName, DistributionAdapter, DistributionAdapterOptions, DistributionResult, DistributionVerifyResult,
    DistributionCanonicalReadback, DistributionError, DistributionErrorCode, ChainAdapterConfigurationError, ChainAdapterErrorCode,
    DistributionResultWire, ReservedOpeningFact, DistributionSnapshot,
} from '@hanamesh/api-contracts/chain';
import { createChainDistributionExamples, createDistributionReadFixture } from '@hanamesh/api-contracts/chain';
import { CONTRACTS } from '@hanamesh/api-contracts';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Factory = ChainFactories['createDistributionAdapter'];
type Keys = Assert<Equal<Extract<ChainFactoryName, 'createDistributionAdapter'>, 'createDistributionAdapter'>>;
type Options = Assert<Equal<Parameters<Factory>[0], DistributionAdapterOptions>>;
type Returned = Assert<Equal<Awaited<ReturnType<Factory>>, DistributionAdapter>>;
type Verify = Assert<Equal<Awaited<ReturnType<DistributionAdapter['verify']>>, DistributionVerifyResult>>;
type Execute = Assert<Equal<Awaited<ReturnType<DistributionAdapter['execute']>>, DistributionResult>>;
type Result = Assert<Equal<Awaited<ReturnType<DistributionAdapter['result']>>, DistributionResult>>;
type Readback = Assert<Equal<Awaited<ReturnType<DistributionAdapter['canonicalReadback']>>, { result: DistributionResult; readback: DistributionCanonicalReadback }>>;
type Opening = Assert<Equal<DistributionResult['reservedOpening'], ReservedOpeningFact | null>>;
type Code = Assert<Equal<DistributionError['code'], DistributionErrorCode>>;
type ConfigCode = Assert<Equal<ChainAdapterConfigurationError['code'], ChainAdapterErrorCode>>;
type Mode = Assert<Equal<DistributionAdapterOptions['policyMode'], 'test-only' | 'production'>>;

declare const factories: ChainFactories;
declare const options: DistributionAdapterOptions;
declare const snapshot: DistributionSnapshot;
async function host(): Promise<bigint> {
    const adapter = await factories.createDistributionAdapter(options);
    await adapter.verify(snapshot);
    const executed = await adapter.execute(snapshot);
    const { readback } = await adapter.canonicalReadback(executed.intentId);
    return readback.distributorBalance + executed.issuance.amount + executed.ordinary.totalAmount;
}
// @ts-expect-error policyMode has no default
void factories.createDistributionAdapter({ ...options, policyMode: undefined });
// @ts-expect-error only test-only or production policy exists
void factories.createDistributionAdapter({ ...options, policyMode: 'testnet' });
// @ts-expect-error the broadcaster journal is required
void factories.createDistributionAdapter({ ...options, journal: undefined });

declare const DistributionErrorCtor: typeof DistributionError;
declare const ConfigErrorCtor: typeof ChainAdapterConfigurationError;
declare const result: DistributionResult;
const expired = new DistributionErrorCtor('AUTHORIZATION_EXPIRED', 'expired', { result, need: 'a new frozen RootAuthorization' });
void expired.need; void expired.result?.status; void expired.cause;
// @ts-expect-error foreign codes are rejected by the closed union
void new DistributionErrorCtor('CLAIM_WINDOW_CLOSED', 'x');
void new ConfigErrorCtor('CONFIG_INVALID', 'x');
// @ts-expect-error configuration errors use their own closed code set
void new ConfigErrorCtor('ROOT_FACT_MISMATCH', 'x');

const examples = createChainDistributionExamples();
const opening: string | undefined = examples.success.result.reservedOpening?.openedAt;
// @ts-expect-error wire examples carry bigint values as decimal strings
const wrong: bigint = examples.success.canonicalReadback.readback.distributorBalance;
async function fixture(): Promise<DistributionResultWire> {
    const read = createDistributionReadFixture(examples);
    // @ts-expect-error the minimal FIXTURE never executes
    void read.adapter.execute;
    return read.adapter.result(examples.success.result.intentId);
}
void host; void fixture; void opening; void wrong;
void CONTRACTS['C-CHAIN'].definition.factories.createDistributionAdapter.configurationErrors;
void CONTRACTS['C-CHAIN'].definition.distribution.providerTag;
