# C-USAGE · J2S3-APIC-04 / Q-18

提供方是 server-usage J2S3-SUSAGE-01 的 main `70c480e42d68d8ff338e40e888a239e887d3f1ed`。
本合约只跟随该提供方；没有改写或放宽服务端判定。发布使用 Git tag `v0.9.0`：

```json
"@hanamesh/api-contracts": "git+https://github.com/yzsnstotz/hanamesh-api-contracts.git#v0.9.0"
```

浏览器 DTO / 服务端端口类型和合约定义从 `@hanamesh/api-contracts/usage` 引入；
提供方 schema 原样置于 `/usage/schema.json`，来源及逐文件 SHA256 见 `/usage/provenance.json`。
Schema 保留提供方原有版本注释与其他路由声明；本卡的调用定义和最小模拟仅覆盖下列三个端点。

| 调用 | 输入、认证 | HTTP 200 返回 |
|---|---|---|
| `POST /v1/usage/events` | 裸事件数组，1..200；设备请求签名；allowed Origin、application/json；最大 65536 字节 | `{accepted,duplicates,rejected:[{eventId,code}],durability:'committed'}` |
| `DELETE /v1/usage/me/devices/:deviceId/events` | 无 body；同设备请求签名或该设备绑定账号的 cookie；allowed Origin；标准空 DELETE 可不带 Content-Type | `{deletedEvents}`；无 durability |
| `GET /v1/usage/me/contributions` | 明确 `from`、`to` query；设备请求签名或 cookie | `EligibilityContribution`：window、byHana、sources、availability、canonicalPrincipalId、bound、deviceCount，以及可选 GitHub account |

事件必需字段：`deviceId,hanaRef,action,occurredAt,eventId,nonce,signature`。
`deviceId` 是 Identity 签发的 43 字符 base64url；action 为 install/open/use/uninstall；
occurredAt 是精确 UTC 毫秒时间，eventId 为小写 UUID；nonce 为 1..128 的有界 token。
可选 `sourceHanaRef,targetRef,receipt`；receipt 仅允许 action=use，形状为 `{providerId,model:string|null,count}`。
额外字段（例如 prompt）拒绝。精确限制由提供方 schema 和移植的校验函数描述。

事件输入不合法、时间越界、摘要冲突、nonce 复用进入 rejected[]，HTTP 仍为 200。
非数组/空数组/>200、无效事件签名、设备撤销或设备不匹配导致整批失败；无效项先收集，
再处理有效项的时钟/存储判定，rejected[] 不承诺原输入顺序。事件时钟允许过去 90 天至未来 5 分钟。
重复事件不增加 accepted 或贡献；accepted hook 仅收到新插入事件，失败整批回滚（503 USAGE_EVENT_HOOK_FAILED）。
全量错误码及名义状态见 `USAGE_CONTRACT_DEFINITION.errors`；错误响应为 `{error:{code,message}}`。
事件级的 conflict/nonce/clock 错误出现在 rejected[]，不使用各自名义 HTTP 状态；超大 body 为 413 USAGE_INPUT_INVALID。

GET 窗口为 `[from,to)`，to 必须大于 from；这个 contributions 接口没有 31/90 天窗口上限。
设备签名只查该设备 principal，cookie 账号查询 canonical principal 和已关联设备。
贡献按 Hana/action 汇总，devices 去重；sources 分别统计原始事件和日汇总。
availability 必须原样保留；过期且无可用数据，或日汇总无法覆盖非午夜边界，可能为 unavailable。
撤回删除该设备归属 principal 的原始事件并记录撤回，不删除既有日汇总；重复撤回可返回 deletedEvents=0。

## 两种 nonce 与重送

**事件级 nonce** 是事件 payload 的 `nonce`。原事件重送必须保留原值、eventId、occurredAt
及其他摘要字段，不能把重送当作新事件重新生成 nonce。
服务端 `src/events.ts:eventDigest` 使用以下固定顺序 JSON 的 UTF-8 字节做 SHA256，输出 hex：

```js
JSON.stringify({
  deviceId, hanaRef, action, occurredAt, eventId, nonce,
  // 仅在存在时加入，顺序固定：
  sourceHanaRef, targetRef,
  receipt: {providerId, model, count}
})
```

无可选字段时省略；signature 不在摘要里。事件 Ed25519 签名的 canonical JSON 只含
`deviceId,hanaRef,action,occurredAt,eventId,nonce` 六字段，顺序同上。
可选字段虽不在事件签名中，仍在摘要内，不得在重送时修改。

`events-repository.ts` 判定顺序如下；范围均在同 deployment、同 device 内：

| 输入 | 结果 |
|---|---|
| 同 eventId、同摘要（含同事件 nonce） | duplicate |
| 同 eventId、不同摘要，包括改事件 nonce | rejected: USAGE_EVENT_CONFLICT |
| 不同 eventId、复用已经存储的事件 nonce | rejected: USAGE_NONCE_REUSED |
| 新 eventId、新 nonce，校验通过 | accepted |

先查 eventId 再查 nonce；同 id 的摘要冲突不能降格为 nonce-reused 或 duplicate。
这是原始事件表仍保留相应记录时的幂等性，不能承诺清除/撤回后的永久去重。

**HTTP 请求认证 nonce** 是 `x-hm-nonce`，每次请求独立生成并重新签名，不能复用已签请求。
四个 header 为 `x-hm-device-id,x-hm-timestamp,x-hm-nonce,x-hm-signature`；签名消息：
`METHOD|route path（不含 query）|epoch 毫秒 timestamp|请求 nonce|sha256hex(raw body bytes)`。
GET 和标准 DELETE 的 body hash 是空字节串的 SHA256；POST 必须按实际发送字节求 hash。
timestamp 在服务端 5 分钟内；请求 nonce 为 16..128 字符 base64url，同设备单次使用。
每次原事件重送，都保留事件 payload（其事件签名无需变化），重新生成请求 nonce、timestamp 并签 HTTP 请求。

原 HTTP 请求重放：C-IDENTITY `authenticateDevice` 抛 **IDENTITY_DEVICE_REPLAY**；
Usage `identityError` 将它映射为 **HTTP 401 USAGE_AUTH_REQUIRED**。
IDENTITY_DEVICE_REPLAY 不在 C-USAGE wire 错误集合中。不能靠重复同一 HTTP header 得到 duplicate。

## 可执行双客户端示例与最小模拟

```js
import {createUsageProviderFixture,createUsageContractExamples} from '@hanamesh/api-contracts/usage';
const f = await createUsageProviderFixture(); // FIXTURE：同一已注册设备
const original = f.event();
const clientAInput = [original];
const clientBInput = structuredClone(clientAInput); // 同设备、同事件全部输入
const path = '/v1/usage/events';
const a = await f.service.ingestEvents(f.request('POST',path,clientAInput),clientAInput);
// {accepted:1,duplicates:0,rejected:[],durability:'committed'}
const b = await f.service.ingestEvents(f.request('POST',path,clientBInput),clientBInput);
// {accepted:0,duplicates:1,rejected:[],durability:'committed'}
// f.request 每次生成不同请求 nonce 并签名；clientA/B 的事件 nonce 保持相同。
const examples = await createUsageContractExamples();
// examples.twoClients 含两组实际签名输入/请求/响应与事件摘要。
// examples.negative：同 id 改事件 nonce、同 id 改 targetRef 均 conflict；不同 id 复用 nonce 为 nonce-reused。
// examples.identityReplay === 'IDENTITY_DEVICE_REPLAY'
// examples.usageReplay.error.code === 'USAGE_AUTH_REQUIRED'
// examples.wire 提供 schema 一致性检验的批次、贡献、撤回和错误 DTO。
```

`createUsageProviderFixture` / `createUsageContractExamples` 全部明确标为 FIXTURE。
三个 service 方法从提供方逐段移植，使用本包 C-IDENTITY 的合成设备/账号、真实 Ed25519 签名与内存事件仓。
内存仓保留 id/nonce 范围与判定先后；不 import 其他模块实现。
模拟不启动 HTTP server、不执行 SQL、不模拟日汇总/保留清理或 host 事务，不验证 Origin/Content-Type/限流。
fixture 不接受 WriteContext；产品服务端口保留提供方 optional context，写入结果可能为 pending-host-commit，
此时宿主仍需 commit，不能发送成功 HTTP 收据。这里的测试仅是合约/模拟一致性证据，非 REAL_DB/REAL_HOST/REAL_UI 或 owner ACCEPTED。

## 宿主维护作业端口 · J2S3-APIC-16 / Q-33（v0.14.0，只加不改）

提供方是 server-usage J2S3-SUSAGE-02 的 main `5ff545afd9d4da7cbb589d37492e7446f65c73eb`（PR #4 合并提交；提供方未为此打 tag）。
提供方只为既有行为命名了类型：`src/service.ts`、`src/database/events-repository.ts`、schema 与 70c480e 逐字节相同，
运行时规则没有变化。上文三个 HTTP 调用、`UsageEventService`、夹具和 nonce/摘要/冲突/撤回语义均不变。

```json
"@hanamesh/api-contracts": "git+https://github.com/yzsnstotz/hanamesh-api-contracts.git#v0.14.0"
```

仍从 `@hanamesh/api-contracts/usage` 引入。新增：

| 名称 | 种类 | 说明 |
|---|---|---|
| `UsageMaintenancePort` | 类型 | `rollupAndPurge(now: Date, context?: WriteContext): Promise<RollupAndPurgeResult>`；提供方写作 `Pick<UsageService,'rollupAndPurge'>` |
| `RollupAndPurgeResult` | 类型 | `{rolled, purged, durability:'committed'\|'pending-host-commit'}`，与 schema `$defs.RollupAndPurgeResult` 相同 |
| `UsageHostServices` | 类型 | `UsageEventService & UsageMaintenancePort`：宿主经合约使用的 `UsageModule.services` 子集（本包命名） |
| `UsageServiceOptions` / `UsageModuleOptions` | 类型 | 模块配置与注入：identity、pool、deploymentId、policy、allowedOrigins，可选 now、retentionDays、isAdmin、onEventsAccepted、devPage、rateLimit |
| `UsagePolicy` / `UsagePolicyContext` / `UsageAction` | 类型 | 宿主策略函数；`summary` 是旧摘要接口的 `UsageSummary`，本包未发布该类型，写作 `unknown` |
| `OnEventsAccepted` / `AcceptedUsageEvent` | 类型 | 上报钩子；抛错一律转为 503 `USAGE_EVENT_HOOK_FAILED`，不附原异常 |
| `EligibilityReader` / `EligibilityReaderOptions` / `EligibilityRule` | 类型 | 读取器的 `retentionDays` 必须与服务端同值 |
| `UsageMaintenanceErrorCode` | 类型 | 三个维护错误码 |
| `USAGE_MAINTENANCE_DEFINITION` | 运行时 | 截止规则、retention、事务、锁、权限/RLS、错误触发条件、关闭顺序、注入面 |
| `createUsageMaintenanceFixture` / `createUsageMaintenanceExamples` / `USAGE_MAINTENANCE_FIXTURE_LABEL` | 运行时 FIXTURE | 见下 |

`createUsageModule`、`UsageModule`（`plugin` 类型依赖 fastify）、完整 `UsageService`（含旧摘要端口）、
`createEligibilityReader`、`getUsageMigrations` 仍只由实现包提供；本包不实现产品工厂。

### 行为（来自提供方源码）

- `now` 必须是 Date 且 `valueOf()` 有限，否则 400 `USAGE_INPUT_INVALID`，且不取连接。作业不读 `options.now`。
- `cutoff = now − retentionDays × 86400000`，按 **`received_at < cutoff`**（不是 occurredAt）选本 deployment 的原始事件，
  按 `(principal, device, hanaRef, action, occurredAt 的 UTC 日)` 累加进 daily_rollups 后删除。`rolled`=选出条数，`purged`=删除条数；无到期时重跑为 0/0。
- `retentionDays`：整数 0..90，缺省 90；不合法时构造期 `USAGE_CONFIG_INVALID`。`EligibilityReaderOptions.retentionDays` 是独立选项，宿主必须传同值。
- 不传 context：模块 `pool.connect()` → BEGIN → 本地 GUC（principal 全零 UUID、deployment、`maintenance='on'`）→
  `LOCK TABLE usage.events IN SHARE UPDATE EXCLUSIVE MODE` → 单条 rollup+delete → COMMIT → release；失败 ROLLBACK 后 release。结果 `committed`。
- 传 C-UOW context：只在 `context.executor` 上执行同样语句，不 BEGIN/COMMIT/ROLLBACK/release，结果 `pending-host-commit`，宿主 COMMIT 后才持久，
  在此之前不能报成功。executor 必须已在宿主事务内（PG 在事务块外拒绝 LOCK → `USAGE_STORAGE_UNAVAILABLE`；这是提供方依 PG 语义的推断，未在真实库复现）。锁持有到宿主提交。
- 错误：`USAGE_INPUT_INVALID`(400)；`USAGE_CONFIG_INVALID`(503，context 为 null/无 `executor.query`，或构造期配置)；
  `USAGE_STORAGE_UNAVAILABLE`(503，连接/权限/锁/SQL，原错误不外泄)。
- 权限：作业不做身份鉴权，调用即授权，只能由宿主进程内的调度调用，没有 HTTP 维护入口。没有独立维护角色，使用 HTTP 同一运行角色；
  跨主体可见只靠本地 GUC `hanamesh_usage.maintenance='on'`，RLS 仍按 deployment_id 隔离。迁移与授权由部署执行。
- 并发：维护作业互相串行，不阻塞上报和撤回。
- 关闭：停调度 → 等在跑的作业 → `usage.close()`（空操作）→ 宿主 `pool.end()`。

### 调用示例

```js
import {createUsageMaintenanceFixture} from '@hanamesh/api-contracts/usage';
const f = createUsageMaintenanceFixture({retentionDays: 30}); // FIXTURE；产品里 port 是 usage.services
f.seed([{deviceId:'A'.repeat(43), principalId:'11111111-1111-4111-8111-111111111111', hanaRef:'fixture.hana', action:'use',
  occurredAt:'2026-09-01T00:00:00.000Z', receivedAt:'2026-09-01T00:00:00.000Z'}]);
const now = new Date('2026-10-11T00:00:00.000Z');
// 模式 A：Usage 自己开事务
await f.port.rollupAndPurge(now);            // {rolled:1, purged:1, durability:'committed'}
await f.port.rollupAndPurge(now);            // {rolled:0, purged:0, durability:'committed'}
// 模式 B：宿主 C-UOW 事务（executor 已 BEGIN），由宿主提交/回滚
const tx = await f.beginHostTransaction();
const r = await f.port.rollupAndPurge(now, tx.context); // durability:'pending-host-commit'
await tx.commit();                           // 此后才算持久
```

`createUsageMaintenanceExamples()` 给出可执行的同类结果：committed、重跑、宿主提交、宿主回滚和四个错误。

### FIXTURE 边界

`createUsageMaintenanceFixture` 是**独立**的维护夹具：逐段移植提供方 `rollupAndPurge`、`withExecutor` 和保留天数校验，
跑在内存 SQL 模拟上（记录语句、BEGIN/ROLLBACK 快照、事务外 LOCK 报错、按本地 GUC 模拟 RLS 可见性）。
它不是 PostgreSQL，没有真实锁、并发、RLS 或宿主调度，不证明 REAL_DB/REAL_HOST，也不是 owner ACCEPTED。
原 `createUsageProviderFixture` 不变：仍不模拟日汇总/保留清理/宿主事务，`USAGE_FIXTURE_LABEL` 原文保留。
