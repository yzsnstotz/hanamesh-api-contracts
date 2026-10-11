import type {IndexedHanaDTO, IndexRunDTO, IndexerService, NormalizedHanaInput, RunResult, SourceId} from './contracts.js';
import type {IndexerErrorResponse} from './definition.js';
export declare const INDEXER_FIXTURE_LABEL: string;
export interface IndexerContractExamples {
    readonly label: string; readonly item: IndexedHanaDTO;
    readonly items: {items:IndexedHanaDTO[];next:string|null}; readonly runs:{items:IndexRunDTO[]};
    readonly request:{source:string}; readonly result:RunResult;
    readonly errors:Record<string,{status:number;body:IndexerErrorResponse}>;
    readonly page1:{items:IndexedHanaDTO[];next:string}; readonly page2:{items:IndexedHanaDTO[];next:null};
    readonly dedupe:{inputs:NormalizedHanaInput[];output:IndexedHanaDTO;replay:RunResult};
    readonly failures:Record<'source'|'collision'|'unknownContent',{status:number;body:RunResult}>;
    readonly differences:Record<string,string>;
}
export declare function createIndexerContractExamples(): IndexerContractExamples;
export declare function createIndexerProviderFixture(options?: {items?:readonly IndexedHanaDTO[];runs?:readonly IndexRunDTO[];results?:Partial<Record<SourceId,RunResult>>}): {label:string;service:IndexerService};
