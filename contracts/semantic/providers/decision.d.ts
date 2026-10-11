import { type ProviderTransportOptions } from '../configuration.js';
import type { DecisionInput, DecisionProvider, DecisionResult, ProviderMode } from '../contracts.js';
export declare class StubDecisionProvider implements DecisionProvider {
    readonly name = "stub";
    readonly mode: ProviderMode;
    choose(input: DecisionInput): Promise<DecisionResult>;
    rank(input: DecisionInput): Promise<DecisionResult>;
    score(input: DecisionInput): Promise<DecisionResult>;
}
type Fetcher = (input: string | URL, init?: RequestInit) => Promise<Response>;
export interface JevDecisionProviderOptions extends ProviderTransportOptions {
    apiKey: string;
    endpoint?: string;
    model?: string;
    maxCandidates?: number;
    timeoutMs?: number;
    maxRetries?: number;
    fetcher?: Fetcher;
    sleep?: (milliseconds: number) => Promise<void>;
}
export declare class JevDecisionProvider implements DecisionProvider {
    private readonly options;
    readonly name = "jev";
    readonly mode: ProviderMode;
    private readonly endpoint;
    private readonly model;
    private readonly maxCandidates;
    private readonly timeoutMs;
    private readonly maxRetries;
    private readonly retryBaseDelayMs;
    private readonly retryBackoffFactor;
    private readonly fetcher;
    private readonly sleep;
    constructor(options: JevDecisionProviderOptions);
    choose(input: DecisionInput): Promise<DecisionResult>;
    rank(input: DecisionInput): Promise<DecisionResult>;
    score(input: DecisionInput): Promise<DecisionResult>;
    private request;
    private parse;
}
export declare class FallbackDecisionProvider implements DecisionProvider {
    private readonly options;
    readonly name = "fallback";
    readonly mode: ProviderMode;
    constructor(options: {
        enabled: boolean;
        delegate: DecisionProvider;
    });
    choose(input: DecisionInput): Promise<DecisionResult>;
    rank(input: DecisionInput): Promise<DecisionResult>;
    score(input: DecisionInput): Promise<DecisionResult>;
}
export {};
