import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import type { FeedbackInput, ProviderMode, RecommendRequest, SearchRequest } from './contracts.js';
export declare function resolveActor(request: FastifyRequest): {
    kind: 'anon' | 'device' | 'account';
    ref: string;
};
export interface PluginOptions {
    mode: ProviderMode;
    allowedOrigins: readonly string[];
    rateLimitPerMinute?: number;
    now?: () => number;
    actorResolver?: (request: FastifyRequest) => {
        kind: 'anon' | 'device' | 'account';
        ref: string;
    } | Promise<{
        kind: 'anon' | 'device' | 'account';
        ref: string;
    }>;
    service: {
        search(input: SearchRequest, actor?: {
            kind: 'anon' | 'device' | 'account';
            ref: string | null;
        }): Promise<unknown>;
        recommend?(input: RecommendRequest, actor?: {
            kind: 'anon' | 'device' | 'account';
            ref: string | null;
        }): Promise<unknown>;
        feedback?(input: FeedbackInput): Promise<unknown>;
    };
}
export declare function createSemanticPlugin(options: PluginOptions): FastifyPluginAsync;
