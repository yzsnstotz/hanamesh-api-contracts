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
export interface SemanticProviderExports {
  createSemanticModule: CreateSemanticModule;
  createSemanticService: CreateSemanticService;
  bridgeSemanticUnitOfWork: BridgeSemanticUnitOfWork;
  fetchCapabilityReadme: FetchCapabilityReadme;
  StubEmbeddingProvider: typeof import('./providers/embedding.js').StubEmbeddingProvider;
  VoyageEmbeddingProvider: typeof import('./providers/embedding.js').VoyageEmbeddingProvider;
  StubDecisionProvider: typeof import('./providers/decision.js').StubDecisionProvider;
  JevDecisionProvider: typeof import('./providers/decision.js').JevDecisionProvider;
  FallbackDecisionProvider: typeof import('./providers/decision.js').FallbackDecisionProvider;
}
