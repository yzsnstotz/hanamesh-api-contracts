/** Only active/admin organizations visible to the current OAuth token. No app approval state. */
export interface GithubNamespaceDTO {readonly login:string; readonly avatarUrl:string}
export interface GithubNamespacesDTO {readonly login:string|null; readonly orgs:readonly GithubNamespaceDTO[]; readonly checkedAt:string; readonly truncated:boolean}
export declare const GITHUB_NAMESPACES_SCHEMA:Readonly<Record<string,unknown>>;
export declare const GITHUB_NAMESPACES_PATH:'/v1/identity/me/github/namespaces';
export declare const GITHUB_NAMESPACES_MAX_ORGANIZATIONS:1000;
