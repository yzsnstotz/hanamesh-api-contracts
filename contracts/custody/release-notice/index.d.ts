export interface PendingRegistrationQuery {
  readonly cursor?: string;
}

export interface PendingRegistrationRight {
  readonly campaignId: `0x${string}`;
  readonly entitlementId: `0x${string}`;
  readonly hanaId: string;
  readonly requestId: string;
  readonly chainId: number;
  readonly releaseAddress: `0x${string}`;
  readonly pluginName: string;
  readonly tokenSymbol: string;
  /** Exact token base units. */
  readonly total: string;
  readonly openedAt: string;
  readonly registrationDeadline: string;
  readonly committedAccount: '0x0000000000000000000000000000000000000000';
  readonly registered: false;
  readonly swept: false;
}

export interface PendingRegistrationPage {
  readonly schema: 'hanamesh-custody-pending-registration-v1';
  readonly serverNow: string;
  readonly items: readonly PendingRegistrationRight[];
  /** Treat as opaque. A filtered page may be empty and still supply a cursor. */
  readonly nextCursor: string | null;
}

export const PENDING_REGISTRATION_PATH: '/v1/custody/releases/pending-registration/me';
