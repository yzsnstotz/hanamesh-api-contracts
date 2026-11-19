import type {ObservatoryMetric, ObservatoryResponse, ObservatoryContribution, ObservatoryPeople, ObservatoryIncome, ObservatorySpending, ObservatoryHealth, ObservatoryParameter} from '@hanamesh/api-contracts/ops/observatory';
const source = {module: 'custody', port: 'readScopedPopularity', definition: 'Canonical people', asOf: null};
const pending: ObservatoryMetric<ObservatoryPeople> = {id: 'users', source, availability: 'pending', reason: 'PORT_NOT_CONFIGURED'};
// @ts-expect-error Pending metrics must not pretend a value exists.
const fabricated: ObservatoryMetric<ObservatoryPeople> = {id: 'users', source, availability: 'pending', reason: 'PORT_NOT_CONFIGURED', value: {unit: 'people', count: 0, series: []}};
// @ts-expect-error Available metrics require a source.
const unattributed: ObservatoryMetric<ObservatoryPeople> = {id: 'users', availability: 'available', value: {unit: 'people', count: 0, series: []}};
const manual: ObservatoryMetric<ObservatorySpending> = {id: 'costs', source, availability: 'manual', value: null};
declare const response: ObservatoryResponse;
declare const contribution: ObservatoryContribution;
declare const income: ObservatoryIncome;
declare const health: ObservatoryHealth;
declare const parameter: ObservatoryParameter;
void [pending, fabricated, unattributed, manual, response, contribution, income, health, parameter];
