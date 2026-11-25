import { ISSUANCE_ALLOCATION_PATH } from '@hanamesh/api-contracts/custody/issuance-quote';
import type { IssuanceLaunchSupplyQuery, IssuanceQuoteView } from '@hanamesh/api-contracts/custody/issuance-quote';
import { PENDING_REGISTRATION_PATH } from '@hanamesh/api-contracts/custody/release-notice';
import type { PendingRegistrationPage } from '@hanamesh/api-contracts/custody/release-notice';

const quotePath: `${typeof ISSUANCE_ALLOCATION_PATH}/quote` = `${ISSUANCE_ALLOCATION_PATH}/quote`;
const noticePath: '/v1/custody/releases/pending-registration/me' = PENDING_REGISTRATION_PATH;
declare const quote: IssuanceQuoteView;
declare const notice: PendingRegistrationPage;
const deadline: string | null = quote.signatureDeadline;
const total: string | undefined = notice.items[0]?.total;
// @ts-expect-error The old preview selector was removed by the provider.
const preview: IssuanceLaunchSupplyQuery['allocationState'] = 'preview';
// @ts-expect-error Pending registration does not expose the internal principal.
const principal = notice.items[0]!.principalId;
void [quotePath, noticePath, deadline, total, preview, principal];
