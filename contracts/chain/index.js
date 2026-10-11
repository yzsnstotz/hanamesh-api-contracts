export { CHAIN_CONTRACT_DEFINITION } from './definition.js';
export const CHAIN_FIXTURE_LABEL = 'FIXTURE · synthetic C-CHAIN DTO/read port; no chain verification, signing or broadcasting';
const address = n => '0x' + n.toString(16).padStart(40, '0');
const hash = n => '0x' + n.toString(16).padStart(64, '0');
const requestId = '11111111-1111-4111-8111-111111111111';
const hanaId = '22222222-2222-4222-8222-222222222222';
const principalId = '33333333-3333-4333-8333-333333333333';
const key = (tag, uuid) => '0x' + Buffer.from(tag).toString('hex').padEnd(32, '0') + uuid.replaceAll('-', '');
export function createChainContractExamples() {
    return {
        label: CHAIN_FIXTURE_LABEL,
        confirmedLaunch: {
            requestId, hanaId, principalId, chainId: 31337,
            hanaKey: key('HanaMesh:hana:v1', hanaId), requestKey: key('HanaMesh:lreq:v1', requestId),
            issuer: address(1), token: address(2), distributor: address(3), reservedDistributor: address(4),
            platformWallet: address(5), ordinarySigner: address(6), reservedSigner: address(7),
            authorizationHash: hash(1), subject: hash(2), sourceCommitment: hash(3), transactionHash: hash(4),
            blockNumber: '1', paidToken: address(8), paidAmount: '25000000', initialPoolAmount: '50000000000000000000000000',
            tokenDecimals: 18, confirmedAt: '2030-03-17T17:46:40.000Z', claimWindowSeconds: '7776000',
        },
        admissionRequest: { requestId, principalId, hanaId, name: 'Fixture Hana', symbol: 'FIX' },
        claimRequest: { operationId: 'fixture-claim-1', requestId, principalId, hanaId, route: 'ordinary' },
        bondQuoteRequest: { principalId, deploymentId: 'fixture-deployment', hanaId, action: 'buyExact', amount: '1000000000000000000', bound: { kind: 'exact' } },
        swapQuoteRequest: { principalId, deploymentId: 'fixture-deployment', hanaId, action: 'swap', tokenIn: address(8), amountIn: '1000000000000000000', bound: { kind: 'exact' } },
    };
}
/** Only the read-only ConfirmedLaunch port is simulated. Each result is isolated from caller mutations. */
export function createChainProviderFixture(confirmedLaunch = createChainContractExamples().confirmedLaunch) {
    const value = structuredClone(confirmedLaunch);
    return {
        label: CHAIN_FIXTURE_LABEL,
        producer: { async getConfirmedLaunch({ requestId }) {
            return value?.requestId === requestId ? structuredClone(value) : null;
        } },
    };
}
