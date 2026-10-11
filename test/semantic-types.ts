import {CONTRACTS} from '@hanamesh/api-contracts';
import {SemanticError, createSemanticContractExamples, createSemanticRepositoryFixture} from '@hanamesh/api-contracts/semantic';
import type {SemanticProviderExports, SemanticModuleOptions, SemanticModule, SemanticService, ServiceOptions, PluginOptions, VoyageOptions, JevDecisionProviderOptions, EmbeddingProvider, EmbeddingResult, DecisionProvider, DecisionInput, DecisionResult, SemanticSourcePort, SemanticUnitOfWork, RequestActor, SqlExecutor, SourceRow, ProfileEnricher, SearchRequest, SearchResponse, RecommendRequest, RecommendResponse, FeedbackInput, BridgeSemanticUnitOfWork, CreateSemanticModule} from '@hanamesh/api-contracts/semantic';
import type {UnitOfWork, SqlExecutor as HostSqlExecutor} from '@hanamesh/api-contracts/uow';
import type {IndexerReadService} from '@hanamesh/api-contracts/indexer-catalog';

declare const provider: SemanticProviderExports, formalUow: UnitOfWork, pool: HostSqlExecutor, indexer: IndexerReadService;
const examples = createSemanticContractExamples();
const fixture = createSemanticRepositoryFixture(examples);
const embedding: EmbeddingProvider = new provider.StubEmbeddingProvider({dimension: 3});
const source: SemanticSourcePort = indexer;
const bridge: BridgeSemanticUnitOfWork = provider.bridgeSemanticUnitOfWork;
const uow: SemanticUnitOfWork = bridge(formalUow);
const factory: CreateSemanticModule = provider.createSemanticModule;
const options: SemanticModuleOptions = {pool, unitOfWork:uow, sourceCatalog: source, embedding, allowedOrigins:['https://example.org'], actorResolver:async _request => ({kind:'device',ref:'fixture'}), readmeFetcher:async row => row.cachedReadme ?? null, diagnostic:_event => {}};
const module: SemanticModule = factory(options);
const services: SemanticService = module.services;
const actor: RequestActor = {kind:'anon',ref:null};
const search: Promise<SearchResponse> = services.search(examples.request, actor);
const recommend: Promise<RecommendResponse> = services.recommend({query:'fixture', more:0},actor);
const feedback: Promise<{ok:true}> = services.feedback(examples.feedback);
const sync: Promise<{scanned:number,changed:number,failed:number}> = services.syncProfiles({since:new Date()});
const job: Promise<{embedded:number,skipped:number,failed:number}> = services.runEmbeddingJob();
const serviceOptions: ServiceOptions = {repository: fixture.repository, embedding, readmeFetcher: async _row => null, unitOfWork:uow, now:()=>new Date(), queryCacheTtlMs:0};
const pluginOptions: PluginOptions = {mode: module.mode, allowedOrigins:['https://example.org'], service:services};
const voyage: VoyageOptions = {apiKey:'FIXTURE',dimension:3,timeoutMs:15000,maxRetries:3,fetcher:fetch,sleep:async _ms=>{}};
const jev: JevDecisionProviderOptions = {apiKey:'FIXTURE',maxCandidates:20,fetcher:async (_input,_init)=>new Response(),sleep:async _ms=>{}};
const decision: DecisionProvider = new provider.FallbackDecisionProvider({enabled:true,delegate:new provider.JevDecisionProvider(jev)});
const legacySql: SqlExecutor = {async query(_text,_values) {return {rows:[]};}};
// @ts-expect-error Formal C-UOW rowCount remains required; the Semantic compatibility subset does not alter it.
const invalidFormalSql: HostSqlExecutor = legacySql;
// @ts-expect-error required source contentHash remains mandatory
const invalidSource: SourceRow = {hanaId:'x'};
// @ts-expect-error no implicit embedding config/factory default
const invalidOptions: SemanticModuleOptions = {pool, unitOfWork:uow, allowedOrigins:[]};
import type {createSemanticModule} from '@hanamesh/api-contracts/semantic';
// @ts-expect-error provider factories are type-only, absent from the API runtime
void createSemanticModule;
new SemanticError('SEMANTIC_SOURCE_PORT_REQUIRED',500);
// @ts-expect-error no invented error code
new SemanticError('SEMANTIC_NO_MATCH',404);
void [CONTRACTS['C-SEMANTIC'], search,recommend,feedback,sync,job,serviceOptions,pluginOptions,voyage,decision,legacySql,invalidFormalSql,invalidSource,invalidOptions];
