import {CONTRACTS} from '@hanamesh/api-contracts';
import {createClaimProviderFixture, createClaimContractExamples} from '@hanamesh/api-contracts/claim';
import {createIndexerProviderFixture, createIndexerContractExamples} from '@hanamesh/api-contracts/indexer-catalog';
import type {ClaimService, ClaimDTO, OnClaimed, ClaimModuleOptions} from '@hanamesh/api-contracts/claim';
import type {IndexerService, IndexerCompositionFactory, IndexerComposition, IndexerRunner, NormalizedHanaInput, IndexRunDTO, RunResult, IndexedHanaDTO} from '@hanamesh/api-contracts/indexer-catalog';
import type {RegistryService} from '@hanamesh/server-registry/server-contracts';
import type {RegistryProfilePort} from '@hanamesh/server-registry/contract/fixtures';
import type {HanaProfileDTO} from '@hanamesh/server-registry/contracts';
import type {SqlPool, UnitOfWork, WriteContext} from '@hanamesh/api-contracts/uow';
const cs:ClaimService=createClaimProviderFixture().service;
const is:IndexerService=createIndexerProviderFixture().service;
const dto:ClaimDTO=createClaimContractExamples().claimed;
const item:IndexedHanaDTO=createIndexerContractExamples().dedupe.output;
const profile:HanaProfileDTO=item;
const input:NormalizedHanaInput=createIndexerContractExamples().dedupe.inputs[0]!;
const hook:OnClaimed=async (event,ctx)=>{ await ctx.executor.query('FIXTURE',[event.githubOwnerId]); };
declare const pool:SqlPool, unitOfWork:UnitOfWork, registry:RegistryService, claimOptions:ClaimModuleOptions;
const rp:RegistryProfilePort=registry;
const factory:IndexerCompositionFactory=async request=>{
    const purpose:'index-once'|'serve'|'migrate'=request.purpose;
    const ports:IndexerComposition={pool,unitOfWork,registry:rp,actor:'FIXTURE',sources:{},policy:async (_request,source)=>source==='awesome',close:async()=>{},migrate:async()=>{}};
    void purpose; return ports;
};
declare const runner:IndexerRunner, context:WriteContext;
const results:Promise<RunResult[]>=runner.run('all');
const pending:Promise<ClaimDTO>=cs.startClaim({},dto.hanaId,context); // signature retained; runtime explicitly rejects context.
// @ts-expect-error actual POST result is not a persisted IndexRunDTO
const persisted:IndexRunDTO=createIndexerContractExamples().result;
// @ts-expect-error no chain execution method is implemented
void cs.withdraw;
// @ts-expect-error factory requires explicit databaseUrl and purpose
void factory({purpose:'serve'});
void [profile,input,hook,claimOptions,results,pending,persisted,is,CONTRACTS['C-CLAIM'],CONTRACTS['C-INDEXER-CATALOG']];
