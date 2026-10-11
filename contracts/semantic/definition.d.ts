export declare const SEMANTIC_CONTRACT_DEFINITION: {
  "id": "C-SEMANTIC",
  "provider": "server-semantic",
  "entry": "@hanamesh/api-contracts/semantic",
  "providerCommit": "7930d7729d2fbaae4f096cea481d29a4c8068132",
  "module": {
    "factory": "createSemanticModule",
    "input": "SemanticModuleOptions",
    "output": "SemanticModule",
    "implementation": "deployment manifest -> @hanamesh/server-semantic; signatures only in API package",
    "docs": "MODULE.md"
  },
  "service": "SemanticService",
  "methods": {
    "syncProfiles": {
      "input": "{since?:Date}?",
      "output": "Promise<{scanned:number,changed:number,failed:number}>",
      "docs": "MODULE.md#service-behavior-and-errors"
    },
    "runEmbeddingJob": {
      "input": "none",
      "output": "Promise<{embedded:number,skipped:number,failed:number}>",
      "docs": "MODULE.md#service-behavior-and-errors"
    },
    "search": {
      "input": "SearchRequest, RequestActor?",
      "output": "Promise<SearchResponse>",
      "docs": "MODULE.md#service-behavior-and-errors"
    },
    "recommend": {
      "input": "RecommendRequest, RequestActor?",
      "output": "Promise<RecommendResponse>",
      "docs": "MODULE.md#service-behavior-and-errors"
    },
    "feedback": {
      "input": "FeedbackInput",
      "output": "Promise<{ok:true}>",
      "docs": "MODULE.md#service-behavior-and-errors"
    }
  },
  "http": {
    "method": "POST",
    "paths": [
      "/v1/capabilities/search",
      "/v1/capabilities/recommend",
      "/v1/capabilities/feedback"
    ],
    "docs": "API-O5.md"
  },
  "errorChannels": {
    "SemanticError": "errors.d.ts; code/statusCode are provider supplied",
    "plainError": "MODULE.md; messages remain unstructured",
    "sourceAndHost": "propagate as documented; no invented normalization"
  },
  "boundary": "PACKAGE/FIXTURE; no product factory, SQL, hash, ranking, model, source traversal, scheduler or transaction implementation"
};
