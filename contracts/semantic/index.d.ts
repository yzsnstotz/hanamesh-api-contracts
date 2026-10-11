export type * from './contracts.js';
export type * from './provider.js';
export type * from './service.js';
export type * from './http.js';
export type * from './providers/embedding.js';
export type * from './providers/decision.js';
export {SEMANTIC_CONTRACT_DEFINITION} from './definition.js';
export * from './errors.js';
export * from './fixtures.js';
/** Provider functions/constructors are obtained from the deployment manifest, never this package's JS. */
export type CreateSemanticModule = typeof import('./provider.js').createSemanticModule;
export type CreateSemanticService = typeof import('./service.js').createSemanticService;
export type CreateSemanticPlugin = typeof import('./http.js').createSemanticPlugin;
export type BridgeSemanticUnitOfWork = typeof import('./contracts.js').bridgeSemanticUnitOfWork;
export type FetchCapabilityReadme = typeof import('./provider.js').fetchCapabilityReadme;
export type SemanticService = ReturnType<CreateSemanticService>;
/** Same constructor arguments and public instance members; private implementation fields are not contract identity. */
export type SemanticProviderConstructor<C extends abstract new (...args: any[]) => any> =
  new (...args: ConstructorParameters<C>) => Pick<InstanceType<C>, keyof InstanceType<C>>;
export interface SemanticProviderExports {
  createSemanticModule: CreateSemanticModule;
  createSemanticService: CreateSemanticService;
  bridgeSemanticUnitOfWork: BridgeSemanticUnitOfWork;
  fetchCapabilityReadme: FetchCapabilityReadme;
  StubEmbeddingProvider: SemanticProviderConstructor<typeof import('./providers/embedding.js').StubEmbeddingProvider>;
  VoyageEmbeddingProvider: SemanticProviderConstructor<typeof import('./providers/embedding.js').VoyageEmbeddingProvider>;
  StubDecisionProvider: SemanticProviderConstructor<typeof import('./providers/decision.js').StubDecisionProvider>;
  JevDecisionProvider: SemanticProviderConstructor<typeof import('./providers/decision.js').JevDecisionProvider>;
  FallbackDecisionProvider: SemanticProviderConstructor<typeof import('./providers/decision.js').FallbackDecisionProvider>;
}
export type * from './configuration.js';
export type * from './embedding-facts.js';
export {SEMANTIC_DEFAULTS, SEMANTIC_LIMITS} from './configuration.js';
export type CreateSemanticEmbeddingFactsReader = typeof import('./embedding-facts.js').createSemanticEmbeddingFactsReader;
/** Additive host provider surface; original deployment exports remain assignable. */
export type SemanticModuleWithEmbeddingFacts = import('./provider-current.js').SemanticModule;
export type CreateSemanticModuleWithEmbeddingFacts = typeof import('./provider-current.js').createSemanticModule;
export interface SemanticEmbeddingFactsProviderExports extends SemanticProviderExports {
  createSemanticModule: CreateSemanticModuleWithEmbeddingFacts;
  createSemanticEmbeddingFactsReader: CreateSemanticEmbeddingFactsReader;
}
