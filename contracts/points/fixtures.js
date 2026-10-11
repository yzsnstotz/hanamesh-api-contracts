import {readFileSync} from 'node:fs';

export const POINTS_FIXTURE_LABEL = 'FIXTURE · C-POINTS · synthetic examples and programmable ports; no product authentication, SQL or chain execution';
const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
export function createPointsContractExamples() {
  return {...read('./examples.json'), entitlements: read('./entitlements-examples.json')};
}

/** Only records and forwards calls to explicit scenario handlers; never decides binding or claimability. */
export function createPointsProviderFixture(handlers = {}) {
  const calls = [];
  const port = name => async (...args) => {
    calls.push({name, args});
    if (typeof handlers[name] !== 'function') throw new TypeError(`FIXTURE ${name}: scenario handler required`);
    return handlers[name](...args);
  };
  return {
    label: POINTS_FIXTURE_LABEL, calls,
    service: Object.fromEntries(['getOwnPoints','listOwnLedger','listOwnBalances','getHanaClaimSummary','recordUsagePoints','recordClaimCredit','onDeviceBound'].map(name => [name, port(name)])),
    snapshots: Object.fromEntries(['admit','readEntitlements'].map(name => [name, port(name)]))
  };
}
