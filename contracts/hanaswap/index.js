import { readFileSync } from 'node:fs';
const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
export const HANASWAP_ROUTER02_ABI = read('./UniswapV2Router02.json');
export const HANASWAP_ABI_MANIFEST = read('./manifest.json');
export const HANASWAP_CONTRACT_DEFINITION = Object.freeze({
    id: 'C-HANASWAP', provider: 'contracts', providerCommit: 'c9e9809ea305e91b67005acbb34610f15ad7d563',
    calls: Object.freeze({
        swapExactTokensForTokens: { errors: ['UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT'] },
        addLiquidity: { errors: ['UniswapV2Router: INSUFFICIENT_A_AMOUNT'] },
        removeLiquidity: { errors: ['UniswapV2Router: INSUFFICIENT_A_AMOUNT'] },
    }),
    implementationErrors: ['UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT', 'UniswapV2Router: INSUFFICIENT_A_AMOUNT',
        'UniswapV2Router: INSUFFICIENT_B_AMOUNT', 'UniswapV2Router: EXPIRED'],
    errorChannel: 'EVM revert Error(string); libraries/pairs/tokens can propagate other errors',
    note: 'The JSON contains the complete 26-entry Router02 ABI (24 functions). Calls list the baseline subset only. Integer base units; deadline in Unix seconds. Approvals are separate transactions.',
});
export const HANASWAP_FIXTURE_LABEL = 'FIXTURE · supplied Router02 swap example only; no RPC, pool pricing or transactions';
export function createHanaSwapContractExamples() {
    return { label: HANASWAP_FIXTURE_LABEL, swap: read('./example.json') };
}
/** Translation of the provider abi/mock_hanaswap.py, with the same restricted example and defaults. */
export function createHanaSwapProviderFixture() {
    return { label: HANASWAP_FIXTURE_LABEL, swapExactTokensForTokens(args, now = 1900000000) {
        if (BigInt(args.deadline) < BigInt(now)) throw new Error('UniswapV2Router: EXPIRED');
        if (args.path.length !== 2) throw new Error('fixture supports only its two-token example');
        if (BigInt(args.amountIn) !== 10n ** 18n) throw new Error('fixture supports only its documented amountIn');
        if (BigInt(args.amountOutMin) > 996900n) throw new Error('UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
        return [args.amountIn, '996900'];
    } };
}
