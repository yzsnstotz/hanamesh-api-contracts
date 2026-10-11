export interface PublishedContract { readonly provider: string; readonly consumers: readonly string[]; readonly entry: string; readonly definition: { readonly id: string; readonly service: string; readonly methods: Readonly<Record<string, { readonly errors: readonly string[] }>> } }
export declare const CONTRACTS: Readonly<Record<'C-CORE' | 'C-USAGE-LOCAL', PublishedContract>>;
