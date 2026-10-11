import type { ChainExecutor, ClaimSummaryProvider, CustodyIdentityPort, CustodyService, PointsPolicy, UnitOfWork, VoucherSigner } from './provider.js';
import type { CustodyStore } from './store.js';
export interface CustodyServiceDeps {
    store: CustodyStore;
    identity: CustodyIdentityPort;
    points: PointsPolicy;
    unitOfWork: UnitOfWork;
    executor: ChainExecutor;
    signer: VoucherSigner;
    withdrawEnabled: boolean;
    voucherTtlMs: number;
    outboxMaxAttempts: number;
    now: () => Date;
    randomUUID: () => string;
    claimSummaryProvider?: ClaimSummaryProvider;
}
