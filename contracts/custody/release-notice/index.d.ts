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

export type PendingRegistrationUpstreamNeed =
  | {readonly input: 'custody.releaseNotice'; readonly scope: 'release-notice'}
  | {readonly input: 'identity.authenticate' | 'identity.principalLinks'; readonly scope: 'claim-eligibility'};

type HttpFailure<Status extends number, Code extends string> = {
  readonly statusCode: Status;
  readonly body: {readonly error: {readonly code: Code; readonly message: string}};
};

export type PendingRegistrationFailure =
  | HttpFailure<400, 'CUSTODY_INPUT_INVALID'>
  | HttpFailure<401, 'CUSTODY_AUTH_REQUIRED'>
  | HttpFailure<403, 'CUSTODY_ORIGIN_REJECTED' | 'CUSTODY_FORBIDDEN'>
  | HttpFailure<413, 'CUSTODY_REQUEST_TOO_LARGE'>
  | HttpFailure<415, 'CUSTODY_CONTENT_TYPE_REQUIRED'>
  | {
    readonly statusCode: 503;
    readonly body: {
      readonly error: {
        readonly code: 'CUSTODY_UPSTREAM_REQUIRED';
        readonly message: string;
        readonly need: PendingRegistrationUpstreamNeed;
      };
    };
  }
  | HttpFailure<503, 'CUSTODY_UNAVAILABLE'>;
