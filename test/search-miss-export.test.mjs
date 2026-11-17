import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import Ajv from 'ajv';
import {SEARCH_MISS_EXPORT_SCHEMA, SEARCH_MISS_EXPORT_ERROR_SCHEMA} from '@hanamesh/api-contracts/host/search-miss-export';

const ajv = new Ajv({strict: true, allErrors: true});
const success = ajv.compile(SEARCH_MISS_EXPORT_SCHEMA);
const error = ajv.compile(SEARCH_MISS_EXPORT_ERROR_SCHEMA);
const period = {startDay: '2026-11-11', endDay: '2026-11-17'};
const term = {query: '音楽 plugin', count: 3, kind: 'keyword', period};
const ready = {
  schemaVersion: 1, status: 'ready', period,
  coverage: {startDay: period.startDay, days: 7, requestedDays: 7},
  expiresOn: '2027-02-09',
  totals: {searches: 10, zeroResultSearches: 5, clickedSearches: 2, clickThroughRate: 0.2},
  terms: [term], candidatesTruncated: false, filteredCandidates: 0,
};
function valid(validate, value) {
  assert.equal(validate(value), true, JSON.stringify(validate.errors));
}
function invalid(validate, value, keyword, path) {
  const original = structuredClone(value);
  assert.equal(validate(value), false, JSON.stringify(value));
  assert.ok(validate.errors.some(e => e.keyword === keyword && e.instancePath === path), JSON.stringify(validate.errors));
  assert.deepEqual(value, original, 'validation must not strip, coerce or default data');
}

test('success accepts ready, partial coverage, unavailable rollup and no-data fixtures', () => {
  valid(success, ready);
  valid(success, {...ready, coverage: {startDay: '2026-11-15', days: 3, requestedDays: 7},
    terms: [{...term, kind: 'semantic'}], candidatesTruncated: true, filteredCandidates: 1000});
  for (const status of ['not-ready', 'no-data']) {
    valid(success, {...ready, status, coverage: {startDay: null, days: 0, requestedDays: 7},
      totals: {searches: 0, zeroResultSearches: 0, clickedSearches: 0, clickThroughRate: null}, terms: []});
  }
  valid(success, {...ready, terms: Array.from({length: 100}, () => ({...term, query: '音'.repeat(500)}))});
});

test('success rejects missing fields at every object boundary', () => {
  for (const path of [[], ['period'], ['coverage'], ['totals'], ['terms', 0], ['terms', 0, 'period']]) {
    const original = path.reduce((value, key) => value[key], ready);
    for (const field of Object.keys(original)) {
      const value = structuredClone(ready);
      delete path.reduce((v, key) => v[key], value)[field];
      invalid(success, value, 'required', path.length ? '/' + path.join('/') : '');
    }
  }
});

test('success rejects identity, exact time and other extra fields at every boundary', () => {
  const paths = [[], ['period'], ['coverage'], ['totals'], ['terms', 0], ['terms', 0, 'period']];
  for (const path of paths) {
    for (const field of ['userId', 'principalId', 'sessionId', 'searchId', 'filters', 'topIds', 'ip', 'timestamp', 'queryHash']) {
      const value = structuredClone(ready);
      path.reduce((v, key) => v[key], value)[field] = 'synthetic-only';
      invalid(success, value, 'additionalProperties', path.length ? '/' + path.join('/') : '');
    }
  }
});

test('success rejects invalid scalar types, ranges and more than 100 terms', () => {
  const cases = [
    [['schemaVersion'], 2, 'const'], [['schemaVersion'], '1', 'type'],
    [['status'], 'pending', 'enum'], [['coverage', 'days'], -1, 'minimum'],
    [['coverage', 'days'], 8, 'maximum'], [['coverage', 'days'], 1.5, 'type'],
    [['coverage', 'requestedDays'], 6, 'const'],
    [['terms'], Array.from({length: 101}, () => term), 'maxItems'],
    [['terms', 0, 'query'], '', 'minLength'], [['terms', 0, 'query'], 'x'.repeat(501), 'maxLength'],
    [['terms', 0, 'query'], null, 'type'], [['terms', 0, 'kind'], 'agent', 'enum'],
    [['terms', 0, 'count'], -1, 'minimum'], [['terms', 0, 'count'], 1.5, 'type'],
    [['candidatesTruncated'], 1, 'type'], [['filteredCandidates'], -1, 'minimum'],
    [['filteredCandidates'], 0.5, 'type'],
    [['totals', 'clickThroughRate'], -0.1, 'minimum'], [['totals', 'clickThroughRate'], 1.1, 'maximum'],
    [['totals', 'clickThroughRate'], '0.2', 'type'],
  ];
  for (const field of ['searches', 'zeroResultSearches', 'clickedSearches']) {
    cases.push([['totals', field], -1, 'minimum'], [['totals', field], 0.5, 'type'], [['totals', field], '1', 'type']);
  }
  for (const [path, replacement, keyword] of cases) {
    const value = structuredClone(ready);
    path.slice(0, -1).reduce((v, key) => v[key], value)[path.at(-1)] = replacement;
    invalid(success, value, keyword, '/' + path.join('/'));
  }
});

test('date slots reject precise timestamps, timezone suffixes and non-day syntax', () => {
  for (const path of [['period', 'startDay'], ['period', 'endDay'], ['coverage', 'startDay'], ['expiresOn'],
    ['terms', 0, 'period', 'startDay'], ['terms', 0, 'period', 'endDay']]) {
    for (const replacement of ['2026-11-11T00:00:00.000Z', '2026-11-11+09:00', '2026-1-1', 'not-a-day']) {
      const value = structuredClone(ready);
      path.slice(0, -1).reduce((v, key) => v[key], value)[path.at(-1)] = replacement;
      invalid(success, value, 'pattern', '/' + path.join('/'));
    }
  }
});

test('UTC examples retain inclusive seven days and start-day plus 90 days across calendar boundaries', () => {
  const dayMs = 86_400_000;
  for (const [startDay, endDay, expiresOn] of [
    ['2026-11-11', '2026-11-17', '2027-02-09'],
    ['2024-02-26', '2024-03-03', '2024-05-26'],
    ['2026-12-28', '2027-01-03', '2027-03-28'],
  ]) {
    const utc = day => Date.parse(day + 'T00:00:00.000Z');
    assert.equal((utc(endDay) - utc(startDay)) / dayMs + 1, 7);
    assert.equal((utc(expiresOn) - utc(startDay)) / dayMs, 90);
    valid(success, {...ready, period: {startDay, endDay}, coverage: {startDay, days: 7, requestedDays: 7},
      expiresOn, terms: [{...term, period: {startDay, endDay}}]});
  }
  // These are normative examples, not a new cross-field validator. Host owns date arithmetic.
});

test('error accepts all five public codes and rejects internal or identifying content', () => {
  for (const code of ['AUTH_REQUIRED', 'OPS_FORBIDDEN', 'OPS_ADMIN_LOOKUP_UNAVAILABLE',
    'SEARCH_MISS_EXPORT_INPUT_INVALID', 'SEARCH_MISS_EXPORT_UNAVAILABLE']) valid(error, {error: {code}});
  invalid(error, {error: {code: 'INTERNAL_ERROR'}}, 'enum', '/error/code');
  invalid(error, {}, 'required', '');
  invalid(error, {error: {}}, 'required', '/error');
  invalid(error, {error: {code: 503}}, 'type', '/error/code');
  for (const field of ['message', 'stack', 'userId', 'principalId', 'timestamp']) {
    invalid(error, {error: {code: 'AUTH_REQUIRED'}, [field]: 'synthetic-only'}, 'additionalProperties', '');
    invalid(error, {error: {code: 'AUTH_REQUIRED', [field]: 'synthetic-only'}}, 'additionalProperties', '/error');
  }
});

test('published schemas match recorded Host adoption hashes and remain separately importable', async () => {
  assert.deepEqual(Object.keys(await import('@hanamesh/api-contracts/host/search-miss-export')),
    ['SEARCH_MISS_EXPORT_ERROR_SCHEMA', 'SEARCH_MISS_EXPORT_SCHEMA']);
  const dir = new URL('../contracts/host/search-miss-export/', import.meta.url);
  const provenance = JSON.parse(await readFile(new URL('provenance.json', dir), 'utf8'));
  assert.match(provenance.hostCommit, /^[0-9a-f]{40}$/);
  assert.match(provenance.hostSchemaSourceSHA256, /^[0-9a-f]{64}$/);
  for (const [name, schema] of [['success', SEARCH_MISS_EXPORT_SCHEMA], ['error', SEARCH_MISS_EXPORT_ERROR_SCHEMA]]) {
    const raw = await readFile(new URL(`${name}.schema.json`, dir));
    assert.equal(createHash('sha256').update(raw).digest('hex'), provenance.schemas[name]);
    const mod = await import(`@hanamesh/api-contracts/host/search-miss-export/${name}.schema.json`, {with: {type: 'json'}});
    assert.deepEqual(mod.default, schema);
  }
});

test('Ajv is pinned for development only and C09 does not alter the root contract family', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.devDependencies.ajv, '8.20.0');
  for (const section of ['dependencies', 'optionalDependencies', 'peerDependencies']) assert.equal(pkg[section]?.ajv, undefined);
  assert.deepEqual(Object.keys(await import('@hanamesh/api-contracts')), ['QUOTE_V2_CONTRACT']);
});
