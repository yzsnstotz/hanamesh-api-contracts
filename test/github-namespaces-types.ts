import type {GithubNamespacesDTO,GithubNamespaceDTO} from '@hanamesh/api-contracts/identity/github-namespaces';
const org:GithubNamespaceDTO={login:'visible-org',avatarUrl:'https://avatars.githubusercontent.com/u/1'};
const result:GithubNamespacesDTO={login:'octocat',orgs:[org],checkedAt:'2026-11-21T00:00:00.000Z',truncated:false};
// @ts-expect-error OAuth app approval is not a fact exposed by this contract.
const invalid:GithubNamespaceDTO={...org,authorized:true};
// @ts-expect-error No unknown approval placeholder.
const unknown:GithubNamespaceDTO={...org,appAuthorization:'unknown'};
void [result,invalid,unknown];
