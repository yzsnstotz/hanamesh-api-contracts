import type {OpsManifest} from '@hanamesh/api-contracts/host/ops-manifest';
import {
  OPS_COMPANION_LIMITS,
  type OpsAccessDecision,
  type OpsAccessPage,
  type OpsAccessReadPort,
  type OpsRouteBinding,
  type OpsRoutePage,
  type OpsTextPage,
} from '@hanamesh/api-contracts/host/ops-manifest/companions';
import type {OpsCoverageSnapshot, OpsSettlementSnapshot} from '@hanamesh/api-contracts/ops/observatory/snapshots';

const manifest: OpsManifest = {schemaVersion: 2, paths: [], pages: []};
const texts: OpsTextPage = {
  schema: 'hanamesh-ops-texts-v1', revision: 'revision-1', complete: true, missing: [],
  items: [{pageId: 'fixture', texts: [{key: 'fixture.title', zh: '界面', en: 'Page', ja: 'ページ'}]}],
  nextAfter: null,
};
const access: OpsAccessPage = {
  schema: 'hanamesh-ops-access-v1', revision: texts.revision,
  complete: true, missing: [], nextAfter: null,
  items: [{pageId: 'fixture', actionId: null, scope: 'fixture', policyRevision: '1', status: 'allowed', reason: null}],
};
const routes: OpsRoutePage = {
  schema: 'hanamesh-ops-routes-v1', revision: texts.revision,
  complete: true, missing: [], nextAfter: null,
  items: [
    {pageId: 'fixture', kind: 'web-route', href: '/ops/fixture'},
    {pageId: 'legacy', kind: 'host-html', hostPath: '/ops/legacy', href: '/hm/ops/legacy'},
  ],
};

type Actor = {readonly principalId: string};
const readPort: OpsAccessReadPort<Actor> = {
  async readOpsAccess(actor, query) {
    if (actor.principalId !== 'fixture-admin' || query.revision !== access.revision) {
      throw new Error('FIXTURE_REJECTED');
    }
    return access;
  },
};
const results: Promise<OpsAccessPage> = readPort.readOpsAccess({principalId: 'fixture-admin'}, {
  revision: 'revision-1', limit: OPS_COMPANION_LIMITS.pageItems,
});

const requestedWindow = {from: '2026-11-01T00:00:00Z', to: '2026-11-02T00:00:00Z'};
const source = {module: 'fixture', port: 'read', definition: 'Fixture only'};
const coverage: OpsCoverageSnapshot = {
  schema: 'hanamesh-ops-coverage-v1', source, scope: {deploymentId: 'fixture', scopeId: 'chain-97'},
  requestedWindow, coveredWindow: null, snapshotId: null, revision: null, asOf: null,
  complete: false, missing: ['UNPUBLISHED'], nextAfter: null,
};
const settlement: OpsSettlementSnapshot = {
  schema: 'hanamesh-ops-settlement-snapshot-v1', source, scope: {deploymentId: 'fixture', providerId: 'provider'},
  requestedWindow, coveredWindow: requestedWindow, snapshotId: 'snapshot', revision: 'source-1', asOf: requestedWindow.to,
  complete: true, missing: [], nextAfter: null, acceptanceRevision: 'accept-1', expectedRows: 0,
};
const partialSettlement: OpsSettlementSnapshot = {
  ...settlement, complete: false, missing: ['RETENTION_GAP'], expectedRows: null, nextAfter: 'cursor',
};

function assertCompleteRowCount(snapshot: OpsSettlementSnapshot): number | null {
  return snapshot.complete ? snapshot.expectedRows : null;
}

// @ts-expect-error The public manifest does not carry actor-specific access.
const leakedManifest: OpsManifest = {...manifest, access};
// @ts-expect-error A denied decision needs a reason.
const denied: OpsAccessDecision = {...access.items[0]!, status: 'denied', reason: null};
// @ts-expect-error A proxied HTML binding needs an explicit Host path.
const noHostPath: OpsRouteBinding = {pageId: 'fixture', kind: 'host-html', href: '/hm/ops/fixture'};
// @ts-expect-error Terminating pagination does not make a missing snapshot complete.
const fabricatedCoverage: OpsCoverageSnapshot = {...coverage, complete: true, missing: []};
// @ts-expect-error A complete provider-period snapshot needs an authoritative count.
const fabricatedZero: OpsSettlementSnapshot = {...settlement, expectedRows: null};
// @ts-expect-error A continuation cannot operate without its acceptance policy.
const unboundPage: OpsSettlementSnapshot = {...partialSettlement, acceptanceRevision: null};
// @ts-expect-error Provider receipts are not accepted by this metadata contract.
const injectedReceipts: OpsSettlementSnapshot = {...settlement, receipts: []};

void [routes, results, assertCompleteRowCount(settlement), leakedManifest, denied, noHostPath,
  fabricatedCoverage, fabricatedZero, unboundPage, injectedReceipts];
