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

import {SEMANTIC_DEFAULTS, SEMANTIC_LIMITS, createSemanticEmbeddingFactsExamples, createSemanticEmbeddingFactsFixture} from '@hanamesh/api-contracts/semantic';
import type {SemanticEmbeddingFact, SemanticEmbeddingSelection, SemanticEmbeddingFactsQuery, SemanticEmbeddingFactsPage, SemanticEmbeddingFactsReader, SemanticEmbeddingFactsOptions, SemanticEmbeddingFactsConfiguration, SemanticEmbeddingFactsRepository, SemanticEmbeddingFactsProviderExports, CreateSemanticEmbeddingFactsReader, ProviderTransportOptions, SemanticDiagnostic, ReadmeFetchOptions} from '@hanamesh/api-contracts/semantic';
const factsExamples = createSemanticEmbeddingFactsExamples();
const factsFixture = createSemanticEmbeddingFactsFixture(factsExamples);
const factsRepository: SemanticEmbeddingFactsRepository = factsFixture.repository;
const transport: ProviderTransportOptions = {timeoutMs:15000,maxRetries:3,retryBaseDelayMs:250,retryBackoffFactor:2,diagnostic:_event=>{}};
const allOptions: SemanticModuleOptions = {...options,embeddingFactsRepository:factsRepository,embeddingFactsPageSize:2,embeddingFactsMaxPageSize:10,rateLimitWindowMs:60000,readmeTimeoutMs:10000,readmeMaxBytes:1048576};
const completeVoyage: VoyageOptions = {...voyage,...transport};
const completeJev: JevDecisionProviderOptions = {...jev,...transport};
const completePlugin: PluginOptions = {...pluginOptions,rateLimitWindowMs:60000};
const readme: ReadmeFetchOptions = {fetcher:fetch,timeoutMs:10000,maxBytes:1048576,diagnostic:_event=>{}};
const readerOptions: SemanticEmbeddingFactsOptions = {repository:factsRepository,pageSize:2,maxPageSize:10};
declare const currentProvider: SemanticEmbeddingFactsProviderExports;
const readerFactory: CreateSemanticEmbeddingFactsReader = currentProvider.createSemanticEmbeddingFactsReader;
const reader: SemanticEmbeddingFactsReader = readerFactory(readerOptions);
const configuration: Readonly<SemanticEmbeddingFactsConfiguration> = reader.configuration;
const query: SemanticEmbeddingFactsQuery = {limit:1,selection:{provider:'stub',model:'stub-document-v1'}};
const page: Promise<SemanticEmbeddingFactsPage> = reader.list(query);
const selection: SemanticEmbeddingSelection = {kind:'all'};
const fact: SemanticEmbeddingFact = {hanaId:'fixture',hasCurrentEmbedding:false,oldestCurrentEmbeddedAt:null};
const defaults: 200 = SEMANTIC_DEFAULTS.embeddingFactsPageSize;
const distillate: 4096 = SEMANTIC_LIMITS.readmeDistillateBytes;
new SemanticError('SEMANTIC_EMBEDDING_FACTS_PORT_REQUIRED',500);
// @ts-expect-error selection requires both exact provider/model
const badPair: SemanticEmbeddingFactsQuery = {selection:{provider:'stub'}};
// @ts-expect-error reader configuration is readonly
reader.configuration.pageSize = 7;
import type {createSemanticEmbeddingFactsReader} from '@hanamesh/api-contracts/semantic';
// @ts-expect-error product reader factory is type-only
void createSemanticEmbeddingFactsReader;
void [allOptions,completeVoyage,completeJev,completePlugin,readme,page,selection,fact,configuration,defaults,distillate,badPair];
import type {SemanticModuleWithEmbeddingFacts, CreateSemanticModuleWithEmbeddingFacts} from '@hanamesh/api-contracts/semantic';
// Prior published module/factory must remain valid with only the original three members.
const oldModule: SemanticModule = {plugin:module.plugin,services:module.services,mode:module.mode};
const oldModuleFactory: CreateSemanticModule = _options => oldModule;
const enhancedFactory: CreateSemanticModuleWithEmbeddingFacts = currentProvider.createSemanticModule;
const enhancedModule: SemanticModuleWithEmbeddingFacts = enhancedFactory(allOptions);
const currentPage: Promise<SemanticEmbeddingFactsPage> = enhancedModule.embeddingFacts.list();
// @ts-expect-error legacy factories cannot promise a newly required facts reader
const invalidEnhancedFactory: CreateSemanticModuleWithEmbeddingFacts = oldModuleFactory;
void [oldModuleFactory,currentPage,invalidEnhancedFactory];
