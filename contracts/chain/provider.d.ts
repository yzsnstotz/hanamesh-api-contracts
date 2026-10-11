// Structural declarations from server-chain f30464b index.d.ts; exported only as types.
import type { PublicClient, Address, Hash, Hex, TransactionReceipt, TypedDataDefinition } from 'viem';

/** Structural client port; the concrete injected methods keep their SDK generics. */
export interface PublicClientPort {
  getChainId: () => Promise<number>;
  simulateContract: (...args: any[]) => any;
  readContract: (...args: any[]) => any;
  getTransactionReceipt: (...args: any[]) => any;
  waitForTransactionReceipt: (...args: any[]) => any;
}

export interface WalletClientPort {
  getChainId: () => Promise<number>;
  signTypedData: (...args: any[]) => any;
  writeContract: (...args: any[]) => any;
}

export interface ReceiptPolicy {
  confirmations: number;
  timeout: number;
  pollingInterval: number;
}

export type IntentStatus = 'submitting' | 'submitted' | 'confirmed' | 'reverted';

export interface IntentRecord {
  id: Hash; digest: Hash; wallet: Address; nonce: number; hana: Address; pool: Address; calldata: Hex;
  status: IntentStatus; hash?: Hash;
}

export type DistributionStep = 'ordinary-root' | 'reserved-funding' | 'reserved-opening';

/** One step of a P19 distribution intent in the same signer journal; plan holds the verified public facts. */
export interface DistributionStepRecord {
  id: string; kind: 'p19-distribution'; intentId: string; step: DistributionStep; digest: Hash; wallet: Address; nonce: number;
  target: Address; calldata: Hex; plan: Readonly<Record<string, unknown>>; status: IntentStatus; hash?: Hash;
}

/** One step the user's own wallet signs and broadcasts; Chain owns no nonce for it (nonce null). */
export interface WalletStepRecord {
  id: string; kind: string; operationId: Hash; index: number; step: string; stepCount: number; steps: { step: string; to: Address; data: Hex }[];
  scopeDigest: Hash; digest: Hash; wallet: Address; nonce: null; broadcaster: 'user-wallet'; target: Address; calldata: Hex;
  preparedBlock: { number: string; hash: Hash }; preparedNonce: number; plan: Readonly<Record<string, unknown>>; status: IntentStatus; hash?: Hash;
}

export type JournalRecord = IntentRecord | DistributionStepRecord | WebSupplyRecord | WalletStepRecord;

/**
 * Every business scope bound to one journal shares chainId; every Chain-signer scope shares the one signer wallet
 * (one broadcast owner per signer). A user-wallet scope names no wallet: each user's own wallet broadcasts its steps.
 */
export type JournalScope = ({ chainId: number; wallet: Address } | { chainId: number; broadcaster: 'user-wallet'; wallet?: undefined }) & Readonly<Record<string, unknown>>;

export interface IntentJournal {
  bind(scope: JournalScope): void;
  scopes(): JournalScope[];
  get(id: string): JournalRecord | undefined;
  records(): JournalRecord[];
  nonceOwner(wallet: Address, nonce: number): JournalRecord | undefined;
  reserve(record: JournalRecord): void;
  transition(id: string, status: 'submitted' | 'confirmed' | 'reverted', hash: Hash): void;
  close(): void;
}

export interface HanaSwapPublicClientPort extends PublicClientPort {
  getBlock: PublicClient['getBlock']; getCode: PublicClient['getCode'];
  getTransaction: PublicClient['getTransaction']; getTransactionCount: PublicClient['getTransactionCount'];
}

export interface HanaSwapWalletClientPort extends WalletClientPort { account: { address: Address } | Address; }

/** P19 server-only business supply. Real admission/quote and authorized wallet/proof producers must be injected. */
export type WebSupplyMode = 'test-only' | 'testnet';

export interface WebSupplyRequest {
  operationId: string; action: 'launch' | 'claim'; principalId: string; hanaId: string; requestId: string;
}

export interface LaunchAuthorizationInput {
  hanaId: Hash; requestId: Hash; payer: Address; subject: Hash; snapshot: Hash;
  name: string; symbol: string; hanaTreasury: Address; harnUsdE18: string; deadline: string;
}

export interface WebSupplyFactBase extends WebSupplyRequest {
  mode: WebSupplyMode; chainId: number; issuer: Address; authorityRef: string;
  hanaKey: Hash; requestKey: Hash; subject: Hash; sourceCommitment: Hash; account: Address;
}

export interface WebLaunchFact extends WebSupplyFactBase {
  action: 'launch'; authorization: LaunchAuthorizationInput; signature: Hex;
  admissionSigner: Address; feeToken: Address; feeAmount: string;
}

export interface WebClaimFact extends WebSupplyFactBase {
  action: 'claim'; route: 'ordinary' | 'reserved'; token: Address; root: Hash; batchId: Hash;
  entitlementId?: Hash; cumulativeAmount: string; proof: Hash[];
}

export interface WebSupplyProducer {
  mode: WebSupplyMode; source: string;
  resolve(request: WebSupplyRequest): Promise<WebLaunchFact | WebClaimFact>;
}

export interface WebLaunchEffect {
  token: Address; bond: Address; authorizationHash: Hash; paidAmount: string; paidToken: Address; initialPoolAmount: string;
}

export interface WebClaimEffect {
  token: Address; account: Address; root: Hash; batchId: Hash; entitlementId: Hash | null;
  cumulativeAmount: string; creditedAmount: string;
}

export interface WebSupplyResult extends WebSupplyRequest {
  schema: 'hanamesh-web-supply-result-v1'; mode: WebSupplyMode; chainId: number; issuer: Address;
  distributor: Address; reservedDistributor: Address; hanaKey: Hash; requestKey: Hash;
  subject: Hash; sourceCommitment: Hash; account: Address; digest: Hash; broadcaster: Address;
  status: 'complete' | 'unknown' | 'reverted'; effect: WebLaunchEffect | WebClaimEffect | null;
  nonce: number; target: Address; calldata: Hex; transactionHash?: Hash; blockNumber?: bigint; blockHash?: Hash;
  receipt?: TransactionReceipt; reason?: string; producer: string; authorityRef: string;
  authorization?: Omit<LaunchAuthorizationInput, 'harnUsdE18' | 'deadline'> & {harnUsdE18: bigint; deadline: bigint};
  authorizationHash?: Hash; signature?: Hex; admissionSigner?: Address; feeToken?: Address; feeAmount?: bigint;
  route?: 'ordinary' | 'reserved'; token?: Address; root?: Hash; batchId?: Hash;
  entitlementId?: Hash | null; cumulativeAmount?: bigint; proof?: Hash[];
}

export interface WebSupplyRecord {
  id: string; kind: 'p19-web-supply'; scopeDigest: Hash; digest: Hash; wallet: Address; nonce: number;
  target: Address; calldata: Hex; plan: Readonly<Record<string, unknown>>; previousClaimed: bigint;
  status: IntentStatus; hash?: Hash;
}

/** P24 server-only Bond business supply. Chain owns state/quote/prepare/execute/result/readback and the sole broadcast. */
export type BondSupplyMode = 'test-only' | 'testnet';

export type BondAction = 'buyExact' | 'buyBudget' | 'sell';

export interface BondHanaFact { hanaId: string; mode: BondSupplyMode; chainId: number; issuer: Address; hanaKey: Hash; authorityRef: string }

export interface BondAccountFact { principalId: string; deploymentId: string; mode: BondSupplyMode; chainId: number; account: Address; authorityRef: string }

/** Owning facts injected by the trusted server: Hana id -> launch key and authenticated principal -> bound wallet. */
export interface BondTrustedInputs {
  mode: BondSupplyMode; source: string;
  hana(hanaId: string): Promise<BondHanaFact>;
  account(principal: { principalId: string; deploymentId: string }): Promise<BondAccountFact>;
}

/** Decimal uint256 strings and exact reduced price fractions "num/den" (HARN per Hana). */
export interface BondState {
  evidence: 'fixture' | 'testnet'; hanaId: string; hanaKey: Hash; chainId: number; token: Address; harn: Address; bond: Address;
  bondFactory: Address; router: Address; issuer: Address; canonical: true; blockNumber: string; blockHash: Hash;
  active: boolean; migrated: boolean; pair: Address | null; sold: string; inventory: string; netReserve: string; migrationHarn: string;
  tailPrice: string; firstPoolPrice: string | null; sales: string; liquidity: string; virtualHarn: string; harnUsdE18: string;
  hanaTreasury: Address; meshTreasury: Address; bondHanaBalance: string; bondHarnBalance: string;
}

export type BondBound = { kind: 'exact' } | { kind: 'explicit'; value: string };

export interface BondQuoteRequest { principalId: string; deploymentId: string; hanaId: string; action: BondAction; amount: string; bound: BondBound }

export interface BondAmount { token: Address; amount: string }

export interface BondQuote {
  id: Hash; evidence: BondState['evidence']; hanaId: string; principalId: string; deploymentId: string; chainId: number; account: Address;
  action: BondAction; amount: string; state: BondState; hanaAmount: string; principalHarn: string; hanaFee: string; meshFee: string;
  debit: BondAmount; credit: BondAmount; maxSpend: string; minReceive: string; deadline: string;
  approval: { token: Address; spender: Address; amount: string };
  producer: string; hanaAuthorityRef: string; accountAuthorityRef: string; intent: TypedDataDefinition;
}

export interface BondEnvelope { quote: BondQuote; signature: Hex }

export interface BondStep {
  step: 'approve' | 'trade'; nonce: number; target: Address; calldata: Hex; transactionHash: Hash | null;
  receipt?: TransactionReceipt; transaction?: unknown; blockNumber?: string; blockHash?: Hash; receiptStatus?: 'success' | 'reverted';
}

export interface BondPlan {
  schema: 'hanamesh-bond-supply-plan-v1'; operationId: Hash; digest: Hash; wallet: Address; blockNumber: string; blockHash: Hash;
  state: BondState; current: { hanaAmount: string; principalHarn: string; hanaFee: string; meshFee: string; debit: string; credit: string };
  allowance: string; requiredSteps: ('approve' | 'trade')[];
  steps: { step: 'approve' | 'trade'; target: Address; calldata: Hex; simulation?: 'passed' | 'after-approval'; simulatedResult?: string }[];
}

export interface BondMigration { pair: Address; hanaAmount: string; harnAmount: string; burnedLP: string; lockedLP: string; firstPoolPrice: string }

export interface BondResult {
  schema: 'hanamesh-bond-supply-result-v1'; id: Hash; evidence: BondState['evidence']; hanaId: string; principalId: string; deploymentId: string;
  chainId: number; account: Address; action: BondAction; amount: string; state: BondState; hanaAmount: string; principalHarn: string;
  hanaFee: string; meshFee: string; debit: BondAmount; credit: BondAmount; maxSpend: string; minReceive: string; deadline: string;
  approval: { token: Address; spender: Address; amount: string }; broadcaster: Address; digest: Hash;
  status: 'confirmed' | 'partial' | 'pending' | 'unknown' | 'reverted'; reason?: string; canonical: boolean;
  transactionHash: Hash | null; blockNumber: string | null; blockHash: Hash | null;
  effect: { hanaAmount: string; principalHarn: string; hanaFee: string; meshFee: string; debit: string; credit: string } | null;
  migration: BondMigration | null; steps: BondStep[];
}

export interface BondSupplyAdapter {
  state(hanaId: string): Promise<BondState>;
  quote(request: BondQuoteRequest): Promise<BondQuote>;
  prepare(envelope: BondEnvelope): Promise<BondPlan>;
  execute(envelope: BondEnvelope): Promise<BondResult>;
  result(operationId: Hash): Promise<BondResult>;
  readback(operationId: Hash): Promise<{ result: BondResult; readback: {
    blockNumber: string; blockHash: Hash; canonical: true; state: BondState; account: Address;
    harnBalance: string; hanaBalance: string; harnAllowance: string; hanaAllowance: string;
  } }>;
}

export declare class BondSupplyError extends Error {
  readonly code: string; readonly need?: Readonly<Record<string, unknown>>; readonly result?: BondResult;
  constructor(code: string, message: string, details?: Record<string, unknown>);
}

export declare function createBondSupplyAdapter(options: {
  publicClient: HanaSwapPublicClientPort; walletClient: HanaSwapWalletClientPort; expectedChainId: number; mode: BondSupplyMode;
  issuer: Address; bondFactory: Address; harn: Address; receiptPolicy: ReceiptPolicy; journal: IntentJournal;
  trustedInputs: BondTrustedInputs; quoteTtlSeconds: number;
}): Promise<BondSupplyAdapter>;

/** P19 pre-launch admission producer: qualified per-Hana quote + signed LaunchAuthorization + frozen AdmissionRecord. Never broadcasts. */
export type LaunchAdmissionMode = 'test-only' | 'testnet';

/** Admission signing authority. custodyRef is a non-secret reference to where the key is held; the key itself never enters this package. */
export interface AdmissionSignerPort { address: Address; custodyRef: string; signTypedData: (typedData: any) => Promise<Hex>; }

/** Identity rc7 public WalletBindingDTO (wallets.getBinding). Only SIWE-proved EOA bindings can pay. */
export interface LaunchWalletFact { principalId: string; deploymentId: string; chainId: number; address: Address; proofMethod: 'siwe-eoa'; boundAt: string }

/** Registry public HanaProfileDTO (hanaId/sourceId/sourceRef/displayName/kind/githubRepo/homepage/ownerPrincipalId/indexedAt). */
export interface LaunchHanaFact { hanaId: string; [publicProfileField: string]: unknown }

/** Host passes Identity wallets.getBinding and the Registry HanaProfile read through unchanged. null = not bound / not registered. */
export interface LaunchAdmissionFacts {
  mode: LaunchAdmissionMode; source: string;
  wallet(input: { principalId: string; chainId: number }): Promise<LaunchWalletFact | null>;
  hana(hanaId: string): Promise<LaunchHanaFact | null>;
}

export interface IssuanceInputContext { hanaId: string; hanaKey: Hash; chainId: number; hana: LaunchHanaFact }

/** Answered rule: the current Hana treasury is managed by HanaMesh. Absent port = no actual source = no signature. */
export interface LaunchTreasuryFact { hanaId: string; address: Address; managedBy: 'HanaMesh'; custodyRef: string; authorityRef: string }

export interface LaunchIssuanceInputs {
  treasury?: { mode: LaunchAdmissionMode; ruleRef: string; resolve(context: IssuanceInputContext): Promise<LaunchTreasuryFact> };
}

/** Named market policy; every field is required, nothing is defaulted. Reserves are raw token units (decimal strings). */
export interface LaunchMarketPolicy {
  policyVersion: string; v2Factory: Address; pool: Address; harn: Address; quoteToken: Address;
  minWindowSeconds: number; maxObservationAgeSeconds: number; minHarnReserve: string; minQuoteReserve: string; maxSpotDeviationBps: number;
}

export interface MarketObservation {
  policyDigest: Hash; pool: Address; blockNumber: bigint; blockHash: Hash; timestamp: bigint;
  reserveHarn: bigint; reserveQuote: bigint; cumulative: bigint;
}

export interface AdmissionQuote {
  policyVersion: string; policyDigest: Hash; qualification: 'fixture' | 'testnet-dev-pool'; unit: string; method: string;
  pool: Address; v2Factory: Address; harn: Address; quoteToken: Address; harnDecimals: number; quoteDecimals: number;
  from: Omit<MarketObservation, 'policyDigest'> | MarketObservation; to: Omit<MarketObservation, 'policyDigest'>; windowSeconds: bigint;
  twapX112: bigint; harnUsdE18: bigint; spotE18: bigint; deviationBps: bigint | null; bondY0: bigint; feeToken: Address; quoteTokenIsFeeToken: boolean;
}

export interface AdmissionRecord {
  schema: 'hanamesh-launch-admission-v2'; mode: LaunchAdmissionMode; chainId: number; issuer: Address;
  launchFee: Address; bondFactory: Address; feeToken: Address; feeAmount: bigint;
  requestId: string; principalId: string; hanaId: string; hanaKey: Hash; requestKey: Hash; keyRule: string; subjectRule: string; sourceRule: string;
  payer: Address; subject: Hash; sourceCommitment: Hash;
  inputs: { payer: Address; walletFact: LaunchWalletFact; hanaFact: LaunchHanaFact; hanaTreasury: Address;
    treasury: { rule: 'hanamesh-managed'; ruleRef: string; managedBy: 'HanaMesh'; custodyRef: string; authorityRef: string };
    name: string; symbol: string; metadata: { rule: 'payer-declared'; declaredBy: string; payer: Address; payerProof: string };
    factsSource: string; inputsDigest: Hash };
  quote: AdmissionQuote; quoteDigest: Hash; admittedAt: { blockNumber: bigint; blockHash: Hash; timestamp: bigint }; signatureTtlSeconds: bigint;
  admissionSigner: Address; custodyRef: string;
  authorization: Omit<LaunchAuthorizationInput, 'harnUsdE18' | 'deadline'> & { harnUsdE18: bigint; deadline: bigint };
  authorizationDigest: Hash; signature: Hex; recordDigest: Hash;
}

/** name/symbol are chosen by the authenticated paying principal; required for a new admission, optional (must match) on repeat. */
export interface AdmissionRequest { requestId: string; principalId: string; hanaId: string; name?: string; symbol?: string }

export interface AdmissionReadback {
  record: AdmissionRecord; state: 'admitted' | 'expired' | 'issued' | 'superseded';
  chain: { token: Address; bond: Address; authorizationHash: Hash; harnUsdE18: bigint; bondY0: bigint; payer: Address; hanaTreasury: Address; tokenName: string; tokenSymbol: string } | null;
  readback: { blockNumber: bigint; blockHash: Hash; timestamp: bigint; canonical: true };
}

export interface AdmissionStore {
  bind(scope: Record<string, unknown>): void; scope(): Record<string, unknown> | null; get(requestId: string): AdmissionRecord | undefined;
  records(): AdmissionRecord[]; observations(): MarketObservation[];
  putObservation(observation: MarketObservation): void; putAdmission(record: AdmissionRecord): void; close(): void;
}

/** Also a WebSupplyProducer: resolve() serves the launch branch of createWebSupplyAdapter's trustedInputs. */
export interface LaunchAdmissionProducer extends WebSupplyProducer {
  mode: LaunchAdmissionMode; source: string; signer: { address: Address; custodyRef: string };
  market: Readonly<Record<string, unknown>>;
  observe(): Promise<MarketObservation>;
  admit(request: AdmissionRequest): Promise<AdmissionRecord>;
  getAdmission(requestId: string): Promise<AdmissionReadback>;
  /** Returns the frozen admission's WebLaunchFact; never admits or invents metadata (PAYER_METADATA_REQUIRED). */
  resolve(request: WebSupplyRequest): Promise<WebLaunchFact>;
  /** Hana id -> launch key from the canonical issuance this producer admitted; directly usable as BondTrustedInputs.hana. */
  bondHanaFact(hanaId: string): Promise<BondHanaFact>;
}

export declare class LaunchAdmissionError extends Error {
  readonly code: string; readonly need?: Readonly<Record<string, unknown>>;
  constructor(code: string, message: string, details?: Record<string, unknown>);
}

export declare function createLaunchAdmissionProducer(options: {
  mode: LaunchAdmissionMode; expectedChainId: number; publicClient: HanaSwapPublicClientPort; issuer: Address;
  admissionSigner: AdmissionSignerPort; store: AdmissionStore; facts: LaunchAdmissionFacts; issuanceInputs?: LaunchIssuanceInputs;
  market: LaunchMarketPolicy; signatureTtlSeconds: number;
}): Promise<LaunchAdmissionProducer>;

/**
 * P22 server-only HanaSwap supply for the user's own wallet: swap both ways and own LP add/remove on the P24
 * automatic migration pool. Chain owns state/quote/prepare/submit/result/readback and canonical effects.
 * The user's wallet is the only signer and the only broadcaster (EIP-1193 eth_sendTransaction); no wallet client is accepted.
 */
export type SwapSupplyMode = 'test-only' | 'testnet';

export type SwapAction = 'swap' | 'addLiquidity' | 'removeLiquidity';

export type SwapTrustedInputs = BondTrustedInputs;

/** Decimal uint256 strings, lowercase addresses, exact reduced fractions "num/den". */
export interface SwapPoolState {
  evidence: 'fixture' | 'testnet'; hanaId: string; hanaKey: Hash; chainId: number;
  issuer: Address; bondFactory: Address; router: Address; factory: Address; bond: Address; pair: Address; harn: Address; hana: Address;
  canonical: true; blockNumber: string; blockHash: Hash; timestamp: string;
  harnReserve: string; hanaReserve: string; totalLP: string; lockedLP: string; ownableLP: string;
}

export interface SwapPosition {
  account: Address; harnBalance: string; hanaBalance: string; walletLP: string; share: string;
  allowances: { harn: string; hana: string; lp: string }; nativeBalance: string;
}

export interface SwapState { schema: 'hanamesh-swap-supply-state-v1'; principalId: string; deploymentId: string; pool: SwapPoolState; position: SwapPosition }

interface SwapRequestBase { principalId: string; deploymentId: string; hanaId: string }

export type SwapQuoteRequest =
  | SwapRequestBase & { action: 'swap'; tokenIn: Address; amountIn: string; bound: { kind: 'exact' } | { kind: 'explicit'; minOut: string } }
  | SwapRequestBase & { action: 'addLiquidity'; harnDesired: string; bound: { kind: 'exact' } | { kind: 'explicit'; minHarn: string; minHana: string } }
  | SwapRequestBase & { action: 'removeLiquidity'; liquidity: string; bound: { kind: 'exact' } | { kind: 'explicit'; minHarn: string; minHana: string } };

export type SwapTerms =
  | { tokenIn: Address; tokenOut: Address; amountIn: string; amountOut: string; minOut: string }
  | { harnDesired: string; hanaDesired: string; harnMin: string; hanaMin: string }
  | { liquidity: string; harnMin: string; hanaMin: string };

export interface SwapApproval { role: 'harn' | 'hana' | 'lp'; token: Address; spender: Address; amount: string; allowance: string; required: boolean }

export interface SwapQuote {
  schema: 'hanamesh-swap-supply-quote-v1'; id: Hash; evidence: SwapPoolState['evidence']; hanaId: string; principalId: string; deploymentId: string;
  chainId: number; account: Address; action: SwapAction; terms: SwapTerms;
  expected: { amountOut: string } | { harn: string; hana: string; liquidity: string } | { harn: string; hana: string };
  deadline: string; approvals: SwapApproval[]; pool: SwapPoolState; position: SwapPosition; broadcaster: 'user-wallet';
  producer: string; hanaAuthorityRef: string; accountAuthorityRef: string;
}

/** Exactly the EIP-1193 eth_sendTransaction parameter object; the wallet adds gas/fees/nonce and signs. */
export interface WalletTransactionRequest { from: Address; to: Address; data: Hex; value: '0x0' }

export type SwapStepName = 'approve-harn' | 'approve-hana' | 'approve-lp' | SwapAction;

export interface SwapPlan {
  schema: 'hanamesh-swap-supply-plan-v1'; operationId: Hash; digest: Hash; evidence: SwapPoolState['evidence']; chainId: number; account: Address;
  action: SwapAction; terms: SwapTerms; deadline: string; broadcaster: 'user-wallet'; preparedBlock: { number: string; hash: Hash };
  steps: { index: number; step: SwapStepName; transaction: WalletTransactionRequest; transactionHash: Hash | null; recorded: 'awaiting-wallet' | 'hash-bound' | 'confirmed' | 'reverted' }[];
}

export interface SwapSubmitRequest { operationId: Hash; index: number; transactionHash: Hash }

export interface SwapReceiptSummary {
  transactionHash: Hash; blockNumber: string; blockHash: Hash; status: 'success' | 'reverted'; from: Address; to: Address | null;
  gasUsed: string; effectiveGasPrice: string; logCount: number;
}

export type SwapEffect =
  | { tokenIn: Address; tokenOut: Address; amountIn: string; amountOut: string }
  | { harn: string; hana: string; liquidity: string }
  | { liquidity: string; harn: string; hana: string };

export interface SwapResult {
  schema: 'hanamesh-swap-supply-result-v1'; id: Hash; evidence: SwapPoolState['evidence']; hanaId: string; principalId: string; deploymentId: string;
  chainId: number; account: Address; action: SwapAction; terms: SwapTerms; deadline: string; broadcaster: 'user-wallet'; digest: Hash;
  status: 'confirmed' | 'pending' | 'unknown' | 'reverted' | 'partial' | 'expired'; reason: string | null; canonical: boolean;
  need?: { action: 'wallet-send-then-submit'; index: number; step: SwapStepName };
  transactionHash: Hash | null; blockNumber: string | null; blockHash: Hash | null; effect: SwapEffect | null;
  poolBefore: SwapPoolState | null; poolAfter: SwapPoolState | null; positionBefore: SwapPosition | null; positionAfter: SwapPosition | null;
  standingApprovals: { step: SwapStepName; transactionHash: Hash | null }[]; recoveredThrough: { number: string; hash: Hash; timestamp: string };
  steps: { index: number; step: SwapStepName; transaction: WalletTransactionRequest; transactionHash: Hash | null;
    status: 'confirmed' | 'reverted' | 'pending' | 'unknown'; receipt: SwapReceiptSummary | null; blockNumber: string | null; blockHash: Hash | null }[];
}

export interface SwapSupplyAdapter {
  state(request: SwapRequestBase): Promise<SwapState>;
  quote(request: SwapQuoteRequest): Promise<SwapQuote>;
  prepare(envelope: { quote: SwapQuote }): Promise<SwapPlan>;
  submit(request: SwapSubmitRequest): Promise<SwapResult>;
  result(operationId: Hash): Promise<SwapResult>;
  readback(operationId: Hash): Promise<{ result: SwapResult; readback: { blockNumber: string; blockHash: Hash; canonical: true; pool: SwapPoolState; position: SwapPosition } }>;
}

export declare class SwapSupplyError extends Error {
  readonly code: string; readonly need?: Readonly<Record<string, unknown>>;
  constructor(code: string, message: string, details?: Record<string, unknown>);
}

export interface SwapSupplyPublicClientPort extends HanaSwapPublicClientPort {
  simulateCalls: PublicClient['simulateCalls']; getBalance: PublicClient['getBalance'];
}

export declare function createSwapSupplyAdapter(options: {
  publicClient: SwapSupplyPublicClientPort; expectedChainId: number; mode: SwapSupplyMode;
  issuer: Address; bondFactory: Address; harn: Address; journal: IntentJournal; trustedInputs: SwapTrustedInputs; quoteTtlSeconds: number;
  walletClient?: never;
}): Promise<SwapSupplyAdapter>;

/** Exactly the existing Custody ConfirmedLaunch structural DTO. All fields come from trusted canonical issuance facts. */
export interface ConfirmedLaunch {
  readonly requestId: string; readonly hanaId: string; readonly principalId: string; readonly chainId: number; readonly hanaKey: Hex; readonly requestKey: Hex;
  readonly issuer: Hex; readonly token: Hex; readonly distributor: Hex; readonly reservedDistributor: Hex; readonly platformWallet: Hex;
  readonly ordinarySigner: Hex; readonly reservedSigner: Hex; readonly authorizationHash: Hex; readonly subject: Hex; readonly sourceCommitment: Hex;
  readonly transactionHash: Hex; readonly blockNumber: string; readonly paidToken: Hex; readonly paidAmount: string; readonly initialPoolAmount: string;
  readonly tokenDecimals: number;
  /** Canonical issuance receipt block.timestamp seconds converted to UTC ISO8601 Z, millisecond precision. */
  readonly confirmedAt: string;
  /** Issuance facts only: root authorization submission validity is frozen by Custody into the unsigned root payload at cut. */
  readonly claimWindowSeconds: string;
}

export interface ConfirmedLaunchProducer {
  getConfirmedLaunch(input: { requestId: string }): Promise<ConfirmedLaunch | null>;
}

export interface ConfirmedLaunchProducerOptions {
  mode: LaunchAdmissionMode; expectedChainId: number;
  publicClient: Pick<HanaSwapPublicClientPort, 'getChainId' | 'getBlock' | 'getCode' | 'readContract' | 'getTransactionReceipt' | 'getTransaction'>;
  admission: Pick<LaunchAdmissionProducer, 'mode' | 'source' | 'getAdmission'>;
  webSupply: { resultForRequest(requestId: string): Promise<WebSupplyResult | null> };
  deployment: { distributor: Address; reservedDistributor: Address };
}

export declare function createConfirmedLaunchProducer(options: ConfirmedLaunchProducerOptions): Promise<ConfirmedLaunchProducer>;

export declare class ConfirmedLaunchError extends Error {
  readonly code: string; readonly need?: Readonly<Record<string, unknown>>;
  constructor(code: string, message: string, details?: Record<string, unknown>);
}

/** User-paid claim: server-owned frozen entitlement and verified wallet, never browser-authored rights. */
export interface UserPaidClaimRequest {
  readonly operationId: string; readonly principalId: string; readonly hanaId: string; readonly requestId: string;
  readonly route: 'ordinary' | 'reserved';
}

export interface UserPaidClaimFact extends UserPaidClaimRequest {
  readonly mode: 'test-only' | 'testnet'; readonly chainId: number;
  readonly issuer: Address; readonly distributor: Address; readonly reservedDistributor: Address;
  readonly account: Address; readonly token: Address; readonly hanaKey: Hash; readonly requestKey: Hash;
  readonly root: Hash; readonly batchId: Hash; readonly entitlementId?: Hash | null;
  readonly cumulativeAmount: string; readonly proof: readonly Hash[]; readonly snapshotId: string; readonly authorityRef: string;
  readonly walletBinding: { readonly principalId: string; readonly chainId: number; readonly address: Address };
}

export interface UserPaidClaimTrustedInputs {
  readonly mode: 'test-only' | 'testnet'; readonly source: string;
  resolve(request: UserPaidClaimRequest): Promise<UserPaidClaimFact | null>;
}

/** Same-block, domain-validated allocation and distributor token balance; not a funding deposit receipt or issuer ack. */
export interface UserPaidClaimFunding {
  readonly status: 'verified'; readonly canonical: true; readonly unit: 'token-base-units'; readonly tokenDecimals: number;
  readonly source: 'Distributor.distributions + HanaToken.balanceOf/decimals' | 'ReservedDistributor.batches + HanaToken.balanceOf/decimals';
  readonly target: Address; readonly block: {readonly number: string; readonly hash: Hash};
  readonly allocatedAmount: string; readonly totalClaimed: string; readonly remainingAllocation: string;
  readonly distributorBalance: string; readonly sufficientForClaim: true;
}

export interface UserPaidClaimPlan extends Omit<UserPaidClaimFact, 'walletBinding' | 'entitlementId'> {
  readonly schema: 'hanamesh-user-paid-claim-plan-v1'; readonly broadcaster: 'user-wallet'; readonly producer: string;
  readonly entitlementId: Hash | null; readonly digest: Hash;
  readonly preparedBlock: { readonly number: string; readonly hash: Hash }; readonly previousClaimed: string; readonly preparedBalance: string;
  /** Prepared cumulativeAmount minus canonical previousClaimed, in token base units; execution can credit less. */
  readonly claimAmount: string; readonly funding: UserPaidClaimFunding;
  /** EIP-1193 eth_sendTransaction parameters; application chooses user's own wallet, which pays gas. */
  readonly transaction: { readonly chainId: Hex; readonly from: Address; readonly to: Address; readonly data: Hex; readonly value: '0x0' };
}

export interface UserPaidClaimEffect {
  readonly token: Address; readonly account: Address; readonly root: Hash; readonly batchId: Hash; readonly entitlementId: Hash | null;
  readonly cumulativeAmount: string; readonly creditedAmount: string; readonly claimed: string; readonly balance: string;
}

export interface UserPaidClaimResult extends Omit<UserPaidClaimPlan, 'schema'> {
  readonly schema: 'hanamesh-user-paid-claim-result-v1'; readonly status: 'complete' | 'pending' | 'unknown' | 'reverted';
  readonly reason: 'user-hash-not-bound' | 'no-canonical-receipt' | null; readonly transactionHash: Hash | null;
  readonly canonical: boolean; readonly blockNumber: string | null; readonly blockHash: Hash | null; readonly effect: UserPaidClaimEffect | null;
}

export interface UserPaidClaimReadback {
  readonly result: UserPaidClaimResult;
  readonly readback: { readonly blockNumber: string; readonly blockHash: Hash; readonly canonical: true; readonly claimed: string; readonly balance: string } | null;
}

export type UserPaidClaimPublicClient = Pick<HanaSwapPublicClientPort, 'getChainId' | 'getBlock' | 'getCode' | 'getTransaction' | 'getTransactionCount' | 'getTransactionReceipt' | 'readContract'>;

export interface UserPaidClaimOptions {
  publicClient: UserPaidClaimPublicClient; journal: IntentJournal; expectedChainId: number; mode: 'test-only' | 'testnet';
  issuer: Address; distributor: Address; reservedDistributor: Address; trustedInputs: UserPaidClaimTrustedInputs;
  walletClient?: never;
}

export interface UserPaidClaimAdapter {
  prepare(request: UserPaidClaimRequest): Promise<UserPaidClaimPlan>;
  submit(request: UserPaidClaimRequest & { transactionHash: Hash }): Promise<UserPaidClaimResult>;
  result(request: UserPaidClaimRequest): Promise<UserPaidClaimResult>;
  readback(request: UserPaidClaimRequest): Promise<UserPaidClaimReadback>;
}

export declare class UserPaidClaimError extends Error { readonly code: string; readonly need?: Readonly<Record<string, unknown>>; constructor(code: string, message: string, details?: object); }

export declare function createUserPaidClaimAdapter(options: UserPaidClaimOptions): Promise<UserPaidClaimAdapter>;

// C-CHAIN distribution surface (Q-33): verbatim declarations from server-chain v0.3.0 (dd0b142) index.d.ts; exported only as types.
export type ChainAdapterErrorCode = 'CONFIG_INVALID' | 'CHAIN_ID_MISMATCH' |
  'WALLET_CLIENT_REQUIRED' | 'RECEIPT_POLICY_REQUIRED_OR_INVALID';
export declare class ChainAdapterConfigurationError extends Error {
  readonly code: ChainAdapterErrorCode;
  constructor(code: ChainAdapterErrorCode, message: string);
}

/** Structural mirror of the public Custody LaunchSnapshot fields Chain consumes (no Custody import). Amounts are decimal strings. */
export interface DistributionRootPayload {
  domain: { name: string; version: string; chainId: number; verifyingContract: Address };
  primaryType: 'RootAuthorization'; types: Readonly<Record<string, readonly { name: string; type: string }[]>>;
  message: Readonly<Record<string, string>>;
}
export interface DistributionRootOutput {
  root: Hash; totalAmount: string; payload: DistributionRootPayload; digest: Hash;
  leaves: readonly { entitlementId?: Hash; account: Address; amount: string; leaf: Hash; proof: readonly Hash[] }[];
}
export interface DistributionSnapshot {
  requestId: string; outboxIntentId: string; policy: { mode: 'test-only' | 'production' };
  launch: {
    requestId: string; chainId: number; hanaKey: Hash; token: Address; distributor: Address; reservedDistributor: Address; platformWallet: Address;
    ordinarySigner: Address; reservedSigner: Address; initialPoolAmount: string; claimWindowSeconds: string;
    /** Original P19 issuance: HanaLauncher address, launch transaction/block and the Issued request/authorization binding. */
    issuer: Address; transactionHash: Hash; blockNumber: string; requestKey: Hash; authorizationHash: Hash;
  };
  distribution: { batchId: Hash; ordinary: DistributionRootOutput; reserved: DistributionRootOutput | null; platformDust: string; reservedDust: string };
}
/** Exactly the Custody ReservedOpening field set; produced only from a confirmed, fully funded formal opening. */
export interface ReservedOpeningFact {
  requestId: string; chainId: number; transactionHash: Hash; distributor: Address; batchId: Hash; token: Address; root: Hash;
  totalAmount: string; nonce: '1'; fundedAmount: string; blockNumber: string; openedAt: string; claimDeadline: string;
}
export type DistributionStepStatus = 'not-sent' | 'unknown' | 'confirmed' | 'reverted';
export interface DistributionStepResult {
  step: DistributionStep; status: DistributionStepStatus; nonce?: number; target?: Address; calldata?: Hex; transactionHash?: Hash;
  reason?: 'submission-without-hash' | 'no-canonical-receipt'; blockNumber?: bigint; blockHash?: Hash; timestamp?: bigint;
  receipt?: TransactionReceipt; transaction?: unknown; effect?: Readonly<Record<string, bigint>> | null;
}
/** complete = every required step confirmed and verified; partial = some confirmed, rest not sent; unknown/reverted never succeed. */
export type DistributionStatus = 'complete' | 'partial' | 'unknown' | 'reverted' | 'not-started';
export interface DistributionRootResult { contract: Address; signer: Address; root: Hash; totalAmount: bigint; nonce: 1n; digest: Hash; }
/** Canonical successful P19 issuance receipt verified on chain: to = issuer, Issued binds hana/request/token/authorization, exact pool Transfer to Distributor. */
export interface IssuanceFact { transactionHash: Hash; blockHash: Hash; blockNumber: bigint; blockTimestamp: bigint; to: Address; amount: bigint; }
export interface DistributionResult {
  kind: 'p19-distribution'; intentId: string; requestId: string; digest: Hash; resultId: Hash; status: DistributionStatus; policyMode: 'test-only' | 'production';
  chainId: number; distributor: Address; reservedDistributor: Address; token: Address; hanaKey: Hash; batchId: Hash; broadcaster: Address;
  requiredSteps: DistributionStep[]; issuer: Address; issuance: IssuanceFact; authorizationHash: Hash; requestKey: Hash;
  ordinary: DistributionRootResult; reserved: DistributionRootResult | null;
  steps: DistributionStepResult[]; reservedOpening: ReservedOpeningFact | null;
}
export interface RootSignerPort { address: Address; signTypedData: (...args: any[]) => Promise<Hex>; }
/** Facts every remaining step needs, verified at one canonical block before anything is signed or sent. */
export interface DistributionVerifyResult { intentId: string; digest: Hash; requiredSteps: DistributionStep[]; blockNumber: bigint; blockHash: Hash }
/** One pinned canonical block: receipt/issuance blocks still canonical, final state re-read for complete results, token balances. */
export interface DistributionCanonicalReadback {
  blockNumber: bigint; blockHash: Hash; timestamp: bigint; canonical: true; distributorBalance: bigint; reservedDistributorBalance: bigint;
  /** Decimal uint256 strings read at the same pinned block: Distributor.distributions(hanaKey).totalClaimed and Distributor.reserved(token). */
  ordinaryTotalClaimed: string; ordinaryReservedAmount: string;
}
export interface DistributionAdapter {
  verify(snapshot: DistributionSnapshot): Promise<DistributionVerifyResult>;
  execute(snapshot: DistributionSnapshot): Promise<DistributionResult>;
  result(intentId: string): Promise<DistributionResult>;
  canonicalReadback(intentId: string): Promise<{ result: DistributionResult; readback: DistributionCanonicalReadback }>;
}
/** Every DistributionError code createDistributionAdapter and its methods throw (factory chain/config faults use ChainAdapterConfigurationError). */
export type DistributionErrorCode = 'DISTRIBUTION_INPUT_INVALID' | 'POLICY_MODE_REQUIRED' | 'POLICY_MODE_MISMATCH' | 'CHAIN_ID_MISMATCH' |
  'WALLET_MISMATCH' | 'DEPLOYMENT_MISMATCH' | 'PROTOCOL_CODE_MISMATCH' | 'ROOT_PAYLOAD_MISMATCH' | 'ROOT_FACT_MISMATCH' | 'ROOT_DIGEST_MISMATCH' |
  'AMOUNT_MISMATCH' | 'FUNDING_LEAF_MISMATCH' | 'PROOF_MISMATCH' | 'LEAF_MISMATCH' | 'ROOT_SIGNER_REQUIRED' | 'ROOT_SIGNER_MISMATCH' |
  'ROOT_SIGNATURE_INVALID' | 'ROOT_SIGNER_INVALID' | 'DISTRIBUTOR_UNFUNDED' | 'AUTHORIZATION_EXPIRED' | 'ISSUANCE_NOT_CONFIRMED' |
  'ONCHAIN_STATE_CONFLICT' | 'INTENT_CONFLICT' | 'NONCE_ALREADY_USED' | 'INTENT_NOT_FOUND' | 'INTENT_SUBMISSION_UNKNOWN' | 'TRANSACTION_REVERTED' |
  'RECEIPT_AUTHORITY_MISMATCH' | 'RECEIPT_EFFECT_MISMATCH' | 'RECEIPT_POLICY_INVALID' | 'JOURNAL_REQUIRED' | 'JOURNAL_INVALID';
/**
 * Post-send outcomes (TRANSACTION_REVERTED, INTENT_SUBMISSION_UNKNOWN, AUTHORIZATION_EXPIRED after earlier steps) carry `result`;
 * missing prerequisites carry `need` (what to supply next); SDK failures during a send carry `cause`.
 */
export declare class DistributionError extends Error {
  readonly name: 'DistributionError';
  readonly code: DistributionErrorCode; readonly result?: DistributionResult; readonly need?: string; readonly cause?: unknown;
  constructor(code: DistributionErrorCode, message: string, details?: { result?: DistributionResult; need?: string; cause?: unknown });
}
export interface DistributionAdapterOptions {
  publicClient: HanaSwapPublicClientPort; walletClient: HanaSwapWalletClientPort; expectedChainId: number;
  distributor: Address; reservedDistributor: Address; policyMode: 'test-only' | 'production';
  receiptPolicy: ReceiptPolicy; journal: IntentJournal; rootSigners?: { ordinary?: RootSignerPort; reserved?: RootSignerPort };
}
/** Throws ChainAdapterConfigurationError (CONFIG_INVALID, CHAIN_ID_MISMATCH) for client/chain faults, else DistributionError. */
export declare function createDistributionAdapter(options: DistributionAdapterOptions): Promise<DistributionAdapter>;
