import type { BalanceDTO, IntentDTO, LedgerEntryDTO, LedgerKind, PendingHolderKind, PointsEventKind, WithdrawVoucher } from './contracts.js';
import type { WriteContext } from './provider.js';
export interface ReservedIntent extends IntentDTO {
}
export interface PointsEventRow {
    id: string;
    usageEventId: string;
    hanaId: string;
    principalId: string | null;
    deviceId: string | null;
    kind: PointsEventKind;
    pointsMilli: number;
    occurredAt: Date;
    sourceRef: string | null;
}
export interface PointsCreditRow {
    id: string;
    principalId: string;
    hanaId: string;
    kind: LedgerKind;
    pointsMilli: number;
    refKind: string;
    refId: string | null;
    memo: string | null;
    now: Date;
}
/** `pending` is per (Hana, device) holder; `pendingSources` are the scored, still-unbound usage events of those devices summed by kind. */
export interface OwnPointsRows {
    ledger: readonly {
        hanaId: string;
        kind: LedgerKind;
        netMilli: number;
    }[];
    pending: readonly {
        hanaId: string;
        deviceId: string;
        pointsMilli: number;
    }[];
    pendingSources: readonly {
        hanaId: string;
        deviceId: string;
        kind: PointsEventKind;
        pointsMilli: number;
    }[];
}
export interface PendingEventRow {
    id: string;
    hanaId: string;
    deviceId: string;
    kind: PointsEventKind;
    pointsMilli: number;
    occurredAt: string;
}
export interface HanaPointsRows {
    balances: readonly {
        principalId: string;
        netMilli: number;
    }[];
    pendingUnboundMilli: number;
    pendingUnboundHolders: number;
    pendingUnclaimedMilli: number;
}
export interface CustodyStore {
    reserveDueIntent(now: Date, context: WriteContext): Promise<ReservedIntent | null>;
    markSubmitted(id: string, chainRef: string, reservationVersion: number, now: Date, context: WriteContext): Promise<void>;
    markConfirmed(id: string, reservationVersion: number, now: Date, context: WriteContext): Promise<void>;
    completeIntent(id: string, reservationVersion: number, now: Date, context: WriteContext): Promise<void>;
    markFailed(id: string, reason: string, reservationVersion: number, now: Date, context: WriteContext): Promise<void>;
    scheduleRetry(id: string, next: Date, reason: string, reservationVersion: number, now: Date, context: WriteContext): Promise<void>;
    issueVoucher(voucher: WithdrawVoucher, holdEntryId: string, context: WriteContext): Promise<WithdrawVoucher>;
    findVoucher(nonce: string): Promise<(WithdrawVoucher & {
        state: 'issued' | 'redeemed' | 'expired' | 'void';
    }) | null>;
    voidExpired(now: Date, context: WriteContext): Promise<readonly string[]>;
    listLedger(principalId: string, after?: string, limit?: number): Promise<readonly LedgerEntryDTO[]>;
    listBalances(principalId: string): Promise<readonly BalanceDTO[]>;
    listIntents(principalId: string): Promise<readonly IntentDTO[]>;
    /** Transaction-scoped advisory locks, taken in the given order. */
    lockPoints(keys: readonly string[], context: WriteContext): Promise<void>;
    /** Returns false when (usageEventId,kind) already exists — the idempotency gate. */
    insertPointsEvent(row: PointsEventRow, context: WriteContext): Promise<boolean>;
    hasScoredEvent(query: {
        hanaId: string;
        deviceId: string;
        kind: PointsEventKind;
    }, context: WriteContext): Promise<boolean>;
    hasScoredUseOnHour(query: {
        hanaId: string;
        deviceId: string;
        hour: string;
    }, context: WriteContext): Promise<boolean>;
    countScoredEventsOnDay(query: {
        hanaId: string;
        deviceId: string;
        kind: PointsEventKind;
        day: string;
    }, context: WriteContext): Promise<number>;
    sumScoredEventsByKind(query: {
        hanaId: string;
        deviceId: string;
    }, context: WriteContext): Promise<Readonly<Partial<Record<PointsEventKind, number>>>>;
    creditPoints(row: PointsCreditRow, context: WriteContext): Promise<void>;
    /** Adds `deltaMilli` to the holder's pending row, clamped at `capMilli` when given; returns the new total and cap flag. */
    addPending(input: {
        hanaId: string;
        holderKind: PendingHolderKind;
        holderRef: string;
        deltaMilli: number;
        capMilli: number | null;
        now: Date;
    }, context: WriteContext): Promise<{
        pointsMilli: number;
        capped: boolean;
    }>;
    /** Removes and returns every pending row of the holder (locked). */
    takePending(holderKind: PendingHolderKind, holderRef: string, context: WriteContext): Promise<readonly {
        hanaId: string;
        pointsMilli: number;
    }[]>;
    findClaimCreator(hanaId: string, context?: WriteContext): Promise<string | null>;
    readOwnPoints(principalId: string, deviceIds: readonly string[]): Promise<OwnPointsRows>;
    readHanaPoints(hanaId: string): Promise<HanaPointsRows>;
    /** The principal's net claim-bonus and creator-mirror ledger amounts on the Hana's points asset. */
    readCreatorReward(hanaId: string, principalId: string): Promise<{
        claimBonusMilli: number;
        creatorMirrorMilli: number;
    }>;
    /** Scored user events of the given devices that sit in a live pending holder row, ordered (occurred_at,id), keyset after `after`. */
    listPendingEvents(deviceIds: readonly string[], after: string | undefined, limit: number): Promise<readonly PendingEventRow[]>;
}
