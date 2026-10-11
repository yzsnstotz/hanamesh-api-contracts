// Q-33 type consistency with provider test/fixtures/maintenance-port-types.ts at 5ff545a, against this package's published declarations.
import {createUsageMaintenanceFixture,createUsageMaintenanceExamples,USAGE_MAINTENANCE_DEFINITION} from '@hanamesh/api-contracts/usage';
import type {RollupAndPurgeResult,UsageMaintenancePort,UsageHostServices,UsageEventService,UsageServiceOptions,UsageModuleOptions,OnEventsAccepted,AcceptedUsageEvent,EligibilityReaderOptions,UsageMaintenanceErrorCode,WriteContext} from '@hanamesh/api-contracts/usage';
import type {WriteContext as UowWriteContext} from '@hanamesh/api-contracts/uow';
type Equal<A,B>=(<T>()=>T extends A?1:2) extends (<T>()=>T extends B?1:2)?true:false;
export const params:Equal<Parameters<UsageMaintenancePort['rollupAndPurge']>,[now:Date,context?:WriteContext]>=true;
export const uow:Equal<WriteContext,UowWriteContext>=true;
export const result:Equal<Awaited<ReturnType<UsageMaintenancePort['rollupAndPurge']>>,RollupAndPurgeResult>=true;
export const shape:Equal<RollupAndPurgeResult,{rolled:number;purged:number;durability:'committed'|'pending-host-commit'}>=true;
export const retention:Equal<UsageServiceOptions['retentionDays'],number|undefined>=true;
export const readerRetention:Equal<EligibilityReaderOptions['retentionDays'],number|undefined>=true;
export const hook:Equal<OnEventsAccepted,(events:ReadonlyArray<AcceptedUsageEvent>,context:WriteContext)=>Promise<void>>=true;
export const moduleOptions:Equal<UsageModuleOptions['onEventsAccepted'],OnEventsAccepted|undefined>=true;
export const codes:Equal<UsageMaintenanceErrorCode,'USAGE_INPUT_INVALID'|'USAGE_CONFIG_INVALID'|'USAGE_STORAGE_UNAVAILABLE'>=true;
declare const services:UsageHostServices;
export const port:UsageMaintenancePort=services;
export const events:UsageEventService=services;
const fixture=createUsageMaintenanceFixture({retentionDays:30});
export const fixturePort:UsageMaintenancePort=fixture.port;
async function consume(context:WriteContext){
  const r:RollupAndPurgeResult=await fixture.port.rollupAndPurge(new Date(),context);
  // @ts-expect-error now must be a Date, not an ISO string
  await fixture.port.rollupAndPurge('2026-10-11T00:00:00.000Z');
  // @ts-expect-error durability has only two values
  const bad:RollupAndPurgeResult['durability']='rolled-back';
  const examples=await createUsageMaintenanceExamples();
  const code:UsageMaintenanceErrorCode=examples.errors[0]!.code;
  const http:null=USAGE_MAINTENANCE_DEFINITION.http;
  const max:90=USAGE_MAINTENANCE_DEFINITION.retention.max;
  void r;void bad;void code;void http;void max;
}
void consume;
