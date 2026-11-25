import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import {ISSUANCE_ALLOCATION_PATH} from '@hanamesh/api-contracts/custody/issuance-quote';
import {PENDING_REGISTRATION_PATH} from '@hanamesh/api-contracts/custody/release-notice';

function validators(packageName) {
  const url = import.meta.resolve(`@hanamesh/api-contracts/custody/${packageName}/schema.json`);
  const schema = JSON.parse(readFileSync(new URL(url), 'utf8'));
  const ajv = new Ajv2020().addSchema(schema, packageName);
  return Object.fromEntries(Object.keys(schema.$defs).map(name => [name, ajv.compile({$ref: `${packageName}#/$defs/${name}`})]));
}

const issuance = validators('issuance-quote');
const notices = validators('release-notice');
const now = '2026-11-26T00:00:00.000Z';
const id = '00000000-0000-4000-8000-000000000001';
const hash = `0x${'a'.repeat(64)}`;
const address = `0x${'a'.repeat(40)}`;
const body = {campaignId: hash, quote: address, issuerEarlyReleaseOptIn: false};

test('quote and payment inputs reject removed selectors and extra write fields', () => {
  assert.equal(ISSUANCE_ALLOCATION_PATH, '/v1/custody/issuance-allocation/:hanaId/requests/:requestId');
  assert(issuance.quoteRequest(body));
  assert(!issuance.quoteRequest({...body, snapshotHash: hash}));
  assert(issuance.freezeRequest({...body, snapshotHash: hash, emptyConfirmation: true}));
  assert(!issuance.freezeRequest({...body, snapshotHash: '0x01'}));
  assert(issuance.launchSupplyQuery({...body, issuerEarlyReleaseOptIn: 'false', allocationState: 'quote'}));
  assert(!issuance.launchSupplyQuery({...body, issuerEarlyReleaseOptIn: 'false', allocationState: 'preview'}));
  assert(issuance.recipientsQuery({after: '51', limit: '50'}));
  assert(!issuance.recipientsQuery({limit: '51'}));
});

test('queue and signed quote preserve their public time fields', () => {
  const queued = {
    schema: 'hanamesh-issuance-quote-v1', hanaId: id, requestId: id, principalId: id,
    campaignId: hash, issuerEarlyReleaseOptIn: false, status: 'queued', contributorCount: 2,
    estimatedSeconds: 1, queuedAt: now, queuePosition: 4, queueEtaSeconds: 10, computeStartedAt: null,
    pointsCutoffAt: null, heldAt: null, expiresAt: null, frozenAt: null, signatureDeadline: null,
    serverNow: now, failure: null, summary: null, allocation: null,
  };
  assert(issuance.quote(queued), JSON.stringify(issuance.quote.errors));
  assert(!issuance.quote({...queued, estimatedWaitSeconds: 10}));
  const amounts = {amount: '5', userAmount: '2', creatorAmount: '1', launchInitiatorAmount: '2'};
  const issuer = {...amounts, shareBps: 5000, budget: '10'};
  const allocation = {
    schema: 'hanamesh-issuance-allocation-preview-v1', evidence: 'FIXTURE',
    hanaId: id, requestId: id, principalId: id, campaignId: hash, asOf: now,
    policyVersion: 1, settingsVersion: 1, snapshotHash: hash,
    parameters: {pointsBps: 1000, earlyReleaseAllowed: false, quote: address, launchFeeWei: '0'},
    route: 'ordinary', qualifiedHolderCount: 1, holderCountBasis: 'positive-qualified-points',
    qualifiedPoints: '2.25', issuer, maturing: {points: '0', nextMaturesAt: null},
    topLimit: 10, topRecipients: [], launchInitiator: {holderId: id, amount: '2'},
    top10Amount: '5', creatorHolderKind: 'claimed', recipientCount: 1,
    reconciliation: {
      budget: '10', platformAmount: '5', recipientsAmount: '5', topRecipientsAmount: '5',
      otherRecipientsAmount: '0', userAmount: '2', creatorAmount: '1', launchInitiatorAmount: '2',
    },
    budget: '10', platformAmount: '5', userBudget: '5', accountCapWithheld: '0',
    platformWithheld: '5', roundingDust: '0', remainderDestination: 'platform',
    thresholds: {status: 'configured', missing: [], lowQualifiedHolders: 10, highIssuerShareBps: 2000},
    warnings: {lowQualifiedHolders: true, highIssuerShareBps: true},
    zeroQualified: {
      known: true, active: false, severity: 'none', requiresIssuerConfirmation: false,
      copy: {code: 'ZERO_QUALIFIED_PLATFORM_RESERVE', version: 'owner-2026-10-19', heading: 'Hana', message: 'Hana', confirmationLabel: null},
    },
  };
  const expiresAt = '2026-11-26T00:15:00.000Z';
  const summary = {
    schema: 'hanamesh-issuance-quote-summary-v1', requestId: id, hanaId: id, principalId: id,
    status: 'signed', computedAt: now, heldAt: now, expiresAt, frozenAt: now, failureCode: null,
    contributorCount: 2, recipientCount: 1, budget: '10', top10Amount: '5', issuer: amounts, snapshotHash: hash,
    categories: {contributors: '2', author: '1', launchInitiator: '2', platformWithheld: '5', roundingDust: '0'},
  };
  const signed = {
    ...queued, status: 'signed', computeStartedAt: now, heldAt: now, expiresAt, frozenAt: now,
    pointsCutoffAt: now, signatureDeadline: expiresAt, queuePosition: null, queueEtaSeconds: null,
    summary, allocation,
  };
  assert(issuance.quote(signed), JSON.stringify(issuance.quote.errors));
  assert(issuance.quote({...signed, signatureDeadline: null}));
  assert(!issuance.quote({...signed, signatureDeadline: '1795651200'}));
  assert(!issuance.quote({...signed, allocation: null}));
  assert(!issuance.quote({...signed, status: 'expired'}));

  const legacyFrozen = {
    ...allocation, issuer: {amount: '5', shareBps: 5000, budget: '10'},
    reservationId: null, frozenAt: now, quoteExpiresAt: null, issuerEarlyReleaseOptIn: false, confirmation: null,
  };
  assert(issuance.frozenAllocation(legacyFrozen), JSON.stringify(issuance.frozenAllocation.errors));
  assert(!issuance.frozenAllocation({...legacyFrozen, cut: {}}));
});

test('pending-registration pagination can continue across an empty filtered page', () => {
  assert.equal(PENDING_REGISTRATION_PATH, '/v1/custody/releases/pending-registration/me');
  const page = {schema: 'hanamesh-custody-pending-registration-v1', serverNow: now, items: [], nextCursor: 'Y3Vyc29y'};
  const right = {
    campaignId: hash, entitlementId: hash, hanaId: id, requestId: id, chainId: 97,
    releaseAddress: address, pluginName: 'Hana', tokenSymbol: 'HANA', total: '9007199254740993',
    openedAt: now, registrationDeadline: '2026-12-03T00:00:00.000Z',
    committedAccount: `0x${'0'.repeat(40)}`, registered: false, swept: false,
  };
  assert(notices.page(page));
  assert(notices.page({...page, items: [right], nextCursor: null}), JSON.stringify(notices.page.errors));
  assert(!notices.page({...page, items: [{...right, principalId: id}]}));
  assert(!notices.page({...page, items: [{...right, total: Number(right.total)}]}));
  assert(!notices.page({...page, items: [{...right, registered: true}]}));
  assert(!notices.page({...page, items: Array(51).fill(right)}));
  assert(notices.query({cursor: page.nextCursor}));
  assert(!notices.query({cursor: 'a'.repeat(385)}));
});

test('pending-registration errors pin each status and the owning need for named source failures', () => {
  const failure = (statusCode, code, more = {}) => ({
    statusCode, body: {error: {code, message: code, ...more}},
  });
  for (const [status, code] of [
    [400, 'CUSTODY_INPUT_INVALID'], [401, 'CUSTODY_AUTH_REQUIRED'],
    [403, 'CUSTODY_ORIGIN_REJECTED'], [403, 'CUSTODY_FORBIDDEN'],
    [413, 'CUSTODY_REQUEST_TOO_LARGE'], [415, 'CUSTODY_CONTENT_TYPE_REQUIRED'],
    [503, 'CUSTODY_UNAVAILABLE'],
  ]) {
    assert(notices.failure(failure(status, code)), JSON.stringify(notices.failure.errors));
    assert(!notices.failure(failure(418, code)));
  }
  for (const need of [
    {input: 'custody.releaseNotice', scope: 'release-notice'},
    {input: 'identity.authenticate', scope: 'claim-eligibility'},
    {input: 'identity.principalLinks', scope: 'claim-eligibility'},
  ]) {
    assert(notices.failure(failure(503, 'CUSTODY_UPSTREAM_REQUIRED', {need})));
    assert(!notices.failure(failure(503, 'CUSTODY_UNAVAILABLE', {need})));
  }
  assert(!notices.failure(failure(503, 'CUSTODY_UPSTREAM_REQUIRED')));
  assert(!notices.failure(failure(503, 'CUSTODY_UPSTREAM_REQUIRED', {
    need: {input: 'custody.releaseNotice', scope: 'claim-eligibility'},
  })));
});
