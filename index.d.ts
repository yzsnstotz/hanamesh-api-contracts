import type { IDENTITY_CONTRACT_DEFINITION } from './contracts/identity/definition.js';
export interface PublishedContract { readonly provider: string; readonly consumers: readonly string[]; readonly entry: string; readonly definition: { readonly id: string; readonly service: string; readonly methods: Readonly<Record<string, { readonly errors: readonly string[] }>> } }
/** C-IDENTITY spans HTTP routes and server ports, so its definition lists `calls` instead of one service's `methods`. */
export interface PublishedCallContract { readonly provider: string; readonly consumers: readonly string[]; readonly entry: string; readonly definition: typeof IDENTITY_CONTRACT_DEFINITION }
export declare const CONTRACTS: Readonly<Record<'C-CORE' | 'C-USAGE-LOCAL', PublishedContract> & Record<'C-IDENTITY', PublishedCallContract>>;
