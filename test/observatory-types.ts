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
import type {ObservatoryProtocolFeeSettings, ObservatoryProtocolFeePosition} from '@hanamesh/api-contracts/ops/observatory';
declare const protocolFee: ObservatoryProtocolFeeSettings;
declare const position: ObservatoryProtocolFeePosition;
const protocolIncome: ObservatoryIncome = {accounting:'revenue',amounts:[],protocolFees:{settings:protocolFee,scope:'explicit-pool-page',positions:[position]}};
const protocolParameter: ObservatoryParameter = {value:protocolFee.enabled,unit:'enabled',changedBy:'operations',effective:'running',meaning:'feeTo',impact:'feeToSetter',protocolFee};
void [protocolIncome,protocolParameter];

import type {ObservatoryAiPendingCountMetric,ObservatoryAiPendingCountSource,ObservatoryAiPendingCountValue} from '@hanamesh/api-contracts/ops/observatory';
const aiSource:ObservatoryAiPendingCountSource={module:'ai',port:'readPendingCount',definition:'All pending reviews across billing months',asOf:null};
const aiValue:ObservatoryAiPendingCountValue={pendingCount:0};
const aiZero:ObservatoryAiPendingCountMetric={id:'hl.ai',source:aiSource,availability:'available',value:aiValue};
const aiMissing:ObservatoryAiPendingCountMetric={id:'hl.ai',source:aiSource,availability:'pending',reason:'AI_OWNER_REQUIRED'};
const aiContribution:ObservatoryContribution={module:'ai',income:[],spending:[],people:[],health:[aiZero,aiMissing],parameters:[]};
// @ts-expect-error Missing source is not a global count snapshot.
const aiNoSource:ObservatoryAiPendingCountMetric={id:'hl.ai',availability:'available',value:aiValue};
// @ts-expect-error Pending must not fabricate an available zero.
const aiFakeZero:ObservatoryAiPendingCountMetric={id:'hl.ai',source:aiSource,availability:'pending',reason:'AI_OWNER_REQUIRED',value:aiValue};
// @ts-expect-error Global approval facts are not manual inputs.
const aiManual:ObservatoryAiPendingCountMetric={id:'hl.ai',source:aiSource,availability:'manual',value:aiValue};
// @ts-expect-error Failure count is not pendingCount.
const aiFailures:ObservatoryAiPendingCountMetric={id:'hl.ai',source:aiSource,availability:'available',value:{failures:2}};
// @ts-expect-error Text is not a typed pending count.
const aiText:ObservatoryAiPendingCountValue={pendingCount:'2'};
// @ts-expect-error Host or listReviews cannot substitute for the owning guarded aggregate.
const aiWrongSource:ObservatoryAiPendingCountSource={module:'host',port:'listReviews',definition:'page length',asOf:null};
void [aiZero,aiMissing,aiContribution,aiNoSource,aiFakeZero,aiManual,aiFailures,aiText,aiWrongSource];
