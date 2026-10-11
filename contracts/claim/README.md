# C-CLAIM · J3S3-CLAIM-01

来源：server-claim origin/main `21a8b6dbc267ea6f9c016cbd7cabad559e4bc0eb`。本包发布 DTO、ClaimService、OnClaimed 与注入选项类型，保留 verify 入口。正式安装 tag 为 `v0.8.0`。未发布产品 createClaimModule；消费方只 import 本包 /identity、/catalog、/uow 的既有合约。

| 实际 HTTP | 输入 | 返回 |
|---|---|---|
| POST /v1/claim/hanas/:hanaId/claims | 路径 hanaId、Identity cookie；body principalId 不参与认证 | 201 ClaimDTO：单次证明后 claimed；幂等重试仍 201 |
| POST /v1/claim/claims/:claimId/verify | 路径 claimId、拥有者 cookie | 200 ClaimDTO：claimed 或 unclaimed/GITHUB_NO_RELATION |
| GET /v1/claim/claims/:claimId | 拥有者 cookie | ClaimDTO；其它账号收到 CLAIM_NOT_FOUND 404 |
| GET /v1/claim/me/claims | cookie | {items:ClaimDTO[]} |
| GET /v1/claim/hanas/:hanaId/status | 匿名 | PublicClaimStatusDTO；无活动单为 unclaimed/null，不抛基线所列 CLAIM_NOT_FOUND |

所有非 GET 路由要求配置允许的 Origin 和 application/json；错误是 `{error:{code,message}}`，完整目录与实际 HTTP status 在 `CLAIM_CONTRACT_DEFINITION.errors`。ClaimDTO 保留 claimId/hanaId/principalId/githubRepo/state/relation/failureReason/createdAt/updatedAt；ClaimEventDTO 保留事件字段但没有事件 HTTP 路由。

start 使用 authenticate 返回的原 VerifiedActor 调用 GitHub proof；canonical ID 仅用于比较/记录。proof 在事务前完成，start/verify 虽保留 optional context 类型，但传入预先开启 WriteContext 会抛 TypeError，不承诺接受它；HTTP 意外异常映射 CLAIM_UNAVAILABLE 503。expireClaims 可接受宿主 context，无新增 HTTP 入口。

| 输入/状态 | 实现结果 |
|---|---|
| 有效关系 | start 在一个 host UnitOfWork 写 claiming/claimed 两条事件并调用 onClaimed，然后返回 claimed |
| 同 canonical 账号 claiming | 复用原 claimId，完成证明；pending 的 githubRepo 与当前证明仓库不符时 CLAIM_CONFLICT 409 |
| 同 canonical 账号 claimed | 原记录幂等返回，无重复 proof/onClaimed |
| 跨账号活动单，或 start 遇到 on_chain/withdrawable | CLAIM_ALREADY_ACTIVE 409 |
| proof relation:none | start 拒绝 CLAIM_NO_RELATION 403，不建单/不打开写事务/不调用 hook，已有 pending 保留；verify 把 pending 改成 unclaimed、failureReason=GITHUB_NO_RELATION |
| GITHUB_API_UNAVAILABLE | CLAIM_PROOF_UNAVAILABLE 503；pending 不变，可重试 |
| GITHUB_TOKEN_INVALID | CLAIM_GITHUB_LOGIN_REQUIRED 409 |
| IDENTITY_GITHUB_ALREADY_LINKED | CLAIM_GITHUB_ALREADY_LINKED 409 |
| 其他 proof 错误 | CLAIM_UNAVAILABLE 503，服务保留 cause，wire 不泄露 cause |
| verify 遇到 claimed | CLAIM_CONFLICT 409；verify 不是 claimed 幂等入口 |
| verify 遇到 on_chain/withdrawable | CLAIM_STAGE_NOT_AVAILABLE 409；这些仅保留 DTO 值，无新增链/经济行为 |

宿主控制 BEGIN/COMMIT/ROLLBACK/release。Claim、事件、onClaimed 共用固定 executor。成功记录只在 commit 后返回；hook 或 commit 失败时由宿主按 C-UOW 行为处理回滚，失败回滚后的显式重试可以再次尝试 hook；不承诺任意外部 hook 副作用可撤销。提供方按 Hana 使用事务锁；内存夹具不模拟并发/锁或真实持久化。OnClaimed 的 {claimId,hanaId,principalId,relation,githubOwnerId} 与 context 交给宿主；本包不组合 Registry/Custody。

```js
import {createClaimProviderFixture, createClaimContractExamples} from '@hanamesh/api-contracts/claim';
const e = createClaimContractExamples();
const f = createClaimProviderFixture({claims:[e.pending]});
f.setProof('none');
try { await f.service.startClaim({}, e.claimed.hanaId); }
catch (error) { if (error.code !== 'CLAIM_NO_RELATION') throw error; }
// pending 原样保留。
f.setProof('owner');
const claimed = await f.service.startClaim({}, e.claimed.hanaId);
await f.service.startClaim({}, e.claimed.hanaId); // 同 claimId，hookWrites 仍只有一份。
const rollback = createClaimProviderFixture();
rollback.setHookError(new Error('FIXTURE hook failure'));
try { await rollback.service.startClaim({}, e.claimed.hanaId); }
catch (error) { if (error.message !== 'FIXTURE hook failure') throw error; }
// claims/events/hookWrites 均回到空；transactions[0].outcome === 'rolled-back'。
```

`createClaimServiceFixture(rejection?)` 是提供方既有固定返回 stub，不验证状态机。`createClaimProviderFixture` 使用提供方最终服务逻辑和本包合成端口，支持顺序失败/重试/回滚示例；无真实认证、GitHub、SQL、expiry scheduler、跨模块组合或并发证据。所有示例均带 FIXTURE 标签；不代表 owner ACCEPTED。
