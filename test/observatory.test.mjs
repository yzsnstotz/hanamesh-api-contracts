import test from 'node:test';
import assert from 'node:assert/strict';
import Ajv from 'ajv';
import {OBSERVATORY_SCHEMA, OBSERVATORY_CONTRIBUTION_SCHEMA} from '@hanamesh/api-contracts/ops/observatory';

const ajv = new Ajv({strict: true});
const validate = ajv.compile(OBSERVATORY_SCHEMA);
const validateContribution = ajv.compile(OBSERVATORY_CONTRIBUTION_SCHEMA);
const source = {module: 'custody', port: 'readScopedPopularity', definition: 'Canonical people in the provider published 30-day window', asOf: '2026-11-19T00:00:00.000Z'};
const metric = (value, availability = 'available') => ({id: 'plugins.users30d', source, availability, value});
const body = () => ({schemaVersion: 1, generatedAt: source.asOf, timezone: 'UTC', income: [], spending: [], people: [], health: [], parameters: []});
const money = () => ({accounting: 'revenue', amounts: [{amount: '0', currency: 'BNB', decimals: 18, network: {chainId: 97, kind: 'testnet', blockNumber: '12345'}}]});
const check = (v, expected) => assert.equal(validate(v), expected, JSON.stringify(ajv.errorsText(validate.errors)));

test('snapshot carries all five read-only sections, source and explicit availability', () => {
 const v = body();
 v.income = [metric(money())];
 v.spending = [metric({amounts: [{amount: '31900000', currency: 'USD', decimals: 6, network: null}], funding: 'credit'})];
 v.people = [metric({unit: 'people', count: 214, series: [{from: '2026-11-18T00:00:00.000Z', to: '2026-11-19T00:00:00.000Z', count: 38}]})];
 v.health = [metric({status: 'paused', lastSuccessAt: null, failures: null, failureWindow: null, paused: true, reason: 'quota', attention: 'operations'})];
 v.parameters = [metric({value: 150000000, unit: 'USD-micros', changedBy: 'owner', effective: 'running', meaning: 'Monthly AI hard limit', impact: 'Plans over the limit require owner approval'})];
 check(v, true);
 assert.equal(validateContribution({module: 'custody', income: [], spending: [], people: v.people, health: [], parameters: []}), true);
});

test('missing is pending without a fabricated zero; manual may be unregistered', () => {
 const v = body();
 v.people = [{id: 'identity.accounts', source: {...source, asOf: null}, availability: 'pending', reason: 'PORT_NOT_CONFIGURED'}];
 v.spending = [{id: 'manual.services', source: {...source, module: 'host', port: 'readManualCosts', asOf: null}, availability: 'manual', value: null}];
 check(v, true);
 v.people[0].value = {unit: 'people', count: 0, series: []}; check(v, false);
 delete v.people[0].value; v.people[0].availability = 'available'; check(v, false);
});

test('zero and missing remain distinct and provider failure cannot carry arbitrary secrets', () => {
 const v = body(); v.people = [metric({unit: 'people', count: 0, series: []})]; check(v, true);
 delete v.people[0].source; check(v, false);
 v.people[0].source = source; v.people[0].secret = 'must-not-pass'; check(v, false);
 delete v.people[0].secret; v.people[0].availability = 'unavailable'; check(v, false);
});

test('integer amounts retain precision and testnet, assets and custodial funds are explicit', () => {
 const v = body(); const value = money(); value.amounts[0].amount = '123456789012345678901234567890';
 for (const accounting of ['revenue', 'custodial', 'asset']) {value.accounting = accounting; v.income = [metric(value)]; check(v, true);}
 for (const bad of [0, '-1', '1.5', '01', '1e18']) {value.amounts[0].amount = bad; check(v, false);}
 value.amounts[0].amount = '0'; delete value.amounts[0].network; check(v, false);
 value.amounts[0].network = {chainId: 97, kind: 'unknown', blockNumber: '1'}; check(v, false);
});

test('counts cannot masquerade as people; ratios retain denominators and empty ratios are null', () => {
 const v = body(); v.people = [metric({unit: 'events', count: 1942, series: [], ratio: {numerator: 0, denominator: 0, value: null}})]; check(v, true);
 v.people[0].value.unit = 'unknown'; check(v, false);
 v.people[0].value.unit = 'events'; v.people[0].value.count = -1; check(v, false);
 v.people[0].value.count = 1.5; check(v, false);
 v.people[0].value.count = 1942; v.people[0].value.ratio.value = 2; check(v, false);
});

test('UTC timestamps, bounded response collections and strings constrain the read contract', () => {
 const v = body(); check({...v, timezone: 'Asia/Tokyo'}, false);
 check({...v, generatedAt: '2026-11-19'}, false);
 check({...v, generatedAt: '2026-11-19T09:00:00+09:00'}, false);
 v.people = [metric({unit: 'people', count: 1, series: Array.from({length: 91}, () => ({from: source.asOf, to: source.asOf, count: 1}))})]; check(v, false);
 v.people[0].value.series = []; v.people[0].source = {...source, definition: 'x'.repeat(2049)}; check(v, false);
 check({...body(), people: Array.from({length: 129}, () => metric({unit: 'people', count: 1, series: []}))}, false);
});

test('health unknown is not healthy and parameter DTO has no write command or secret material', () => {
 const v = body(); v.health = [metric({status: 'unknown', lastSuccessAt: null, failures: null, failureWindow: null, paused: null, reason: null, attention: 'unknown'})]; check(v, true);
 v.parameters = [metric({value: true, unit: 'enabled', changedBy: 'admin', effective: 'running', meaning: 'Semantic search', impact: 'Applies to future reads'})]; check(v, true);
 v.parameters[0].value.writeUrl = '/v1/admin/update'; check(v, false);
 delete v.parameters[0].value.writeUrl; v.parameters[0].value.value = {privateKey: 'no'}; check(v, false);
});
