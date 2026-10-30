# @hanamesh/api-contracts

HanaMesh 模块间 API 合约的唯一来源：类型、错误码、示例数据、最小模拟实现和一致性自检。
只跟着提供方卡改；模块之间只经这里交互，不互相 import。

## 安装（按 git tag 取已发布版本）

```json
{
  "devDependencies": {
    "@hanamesh/api-contracts": "git+https://github.com/yzsnstotz/hanamesh-api-contracts.git#v0.19.0"
  }
}
```

合约只放 `devDependencies`，不得放消费模块的 `dependencies` 或 `peerDependencies`。
消费运行结构由模块构建编入；生产插件不得携带整个合约包或在运行时加载它。
部署宿主按自己的 composition 清单加载提供方正式实现，普通消费者仅使用合约类型与开发 FIXTURE。

## 合约

| 合约 | 入口 | 提供方 → 使用方 | 来源 |
|---|---|---|---|
| C-SEMANTIC | `@hanamesh/api-contracts/semantic` | server-semantic → server-host | J3S1-SEM-02 正式 main `7930d77`；v0.19.0 新增当前 embedding 事实读口与完整配置；[公开端口与固定来源](contracts/semantic/README.md) |
| C-POINTS | `@hanamesh/api-contracts/points`（schema：`/points/schema.json`、`/points/entitlements.schema.json`；来源：`/points/provenance.json`） | server-custody → core, web-market, server-host | J2S4-CUST-01 提交 `bee5d82`：points/ledger/balance、宿主三写钩子、launch-snapshots/entitlements；Q-13 必填绑定状态与旧字段保留；Q-50 跟随 J4S3-CUST-05 main `c93e7a6e` 增补受益人同步 checker/expected/port、服务注入与具名设置类型（来源：`/points/validation-provenance.json`）；[字段、错误、示例和夹具](contracts/points/README.md) |
| C-CORE | `@hanamesh/api-contracts/core`（schema：`/core/schema.json`；来源：`/core/provenance.json`） | core → usage, desktop | v1 定义/schema/独立 fixture 仍来自 hanamesh-core main `0fa85ef`，原样搬入（仅改相对路径）；共享身份语义跟随 J1S4-CORE-02 main `572d853` 的 `docs/API.md`、`docs/CORE_CONTRACT.md` 与已校验归档 REPORT |
| C-USAGE | `@hanamesh/api-contracts/usage`（schema：`/usage/schema.json`；来源：`/usage/provenance.json`） | server-usage → usage, web-market, server-host | J2S3-SUSAGE-01 origin/main `70c480e`：POST events、DELETE 撤回、GET contributions；Q-18 摘要包含事件 nonce，id/摘要冲突先于跨事件 nonce 复用；[说明与双客户端示例](contracts/usage/README.md)。Q-33 宿主维护端口跟随 J2S3-SUSAGE-02 main `5ff545a`：`UsageMaintenancePort`/`RollupAndPurgeResult`、模块配置与注入类型、`USAGE_MAINTENANCE_DEFINITION`、独立维护 FIXTURE（[维护节](contracts/usage/README.md#宿主维护作业端口--j2s3-apic-16--q-33v0140只加不改)） |
| C-USAGE-LOCAL | `@hanamesh/api-contracts/usage-local`（schema：`/usage-local/schema.json`） | usage → app-host | hanamesh-usage main `7517d76`：`src/host/contracts.d.ts`、`src/host/record.js`、`src/host/transport.js`；Q-18 跟随 J1S4-USAGE-02 main `6f724fc`：`occurredAt` 必填、稳定事件 nonce、跨客户端同事实规则；[说明与示例](contracts/usage-local/README.md) |
| C-IDENTITY | `@hanamesh/api-contracts/identity`（schema：`/identity/schema.json`） | server-identity → core, web-market, server-usage/custody/claim/registry/host | hanamesh-server-identity origin/main `ffe1ae5`（与 J2S1-IDENT-01 核验的 `f0cb96c` 在类型/schema/路由/服务源码上逐字节相同）：`contract/hanamesh-server-identity.v1.schema.json` 原样搬入；`src/contracts.ts`、`src/server-contracts.ts`、`src/contract.ts`、`src/core/errors.ts`、`src/contract-fixtures.ts` 移植为 JS |
| C-CHAIN | `@hanamesh/api-contracts/chain`；`/chain/confirmed-launch.schema.json`、`/chain/user-paid-claim.schema.json` | server-chain → server-host | J4S2-CHAIN-01 origin/main `f30464b`：`index.d.ts` 中五个工厂及其依赖声明逐字提取，两个 schema 原样搬入；`/chain/provenance.json` 记录源码与声明哈希。Q-33 分发面跟随 J4S2-CHAIN-07 tag `v0.3.0`（`dd0b142`）：`createDistributionAdapter` 及依赖声明逐字追加，`/chain/distribution-examples.json` 为提供方 FIXTURE 例子原字节 |
| C-HANASWAP | `@hanamesh/api-contracts/hanaswap`；`/hanaswap/UniswapV2Router02.json` | contracts → server-chain | J4S2-CTR-01 origin/main `c9e9809`：`abi/UniswapV2Router02.json`、`manifest.json`、`example.json` 原样搬入，GPL-3.0-or-later 来源与许可保留 |
| C-UOW | `@hanamesh/api-contracts/uow`（来源：`/uow/provenance.json`） | server-host → server-usage, server-custody, server-claim, server-identity, server-registry | J3S1-HOST-01 既有事务行为：host origin/main `b63fb8c` 的 `src/unit-of-work.ts`；共享 SQL 类型按 identity origin/main `9378af2` 的 `src/server-contracts.ts` 增补 |
| C-CLAIM | `@hanamesh/api-contracts/claim`（来源：`/claim/provenance.json`） | server-claim → web-market, server-host | J3S3-CLAIM-01 origin/main `21a8b6d`：单次 start claimed、幂等/复用、拒绝错误、verify 与事务夹具 |
| C-INDEXER-CATALOG | `@hanamesh/api-contracts/indexer-catalog`（来源：`/indexer-catalog/provenance.json`） | server-indexer → web-market, server-host | J3S3-IDX-01 基线保留；Q55 跟随 J3S3-IDX-02 正式 main `f2a089a`/v0.2.0：readonly contentHash、强保证 IndexerReadService、读取500错误与独立新例/FIXTURE；[读取说明](contracts/indexer-catalog/README.md#q55--j3s3-idx-02--j3s3-apic-20--v0170) |

每个合约导出：`*_CONTRACT_DEFINITION`（调用、返回、错误码、错误通道与说明）、
类型、JSON Schema 或 ABI、`create*ProviderFixture`（带 `FIXTURE` 标签的内存模拟提供方，不是产品实现）和 `create*ContractExamples`（示例数据）。
`errors` 是基线声明的错误码；`implementationErrors` 是当前提供方实际还会返回的码；两者不一致的地方写在 `note` 里。

## C-CORE 共享身份细化（v0.6.0）

同一 OS 用户且解析到同一共享根的 DSH 与 HanaMesh 客户端使用同一签名身份。
新增语义、创建/采用/冲突、失败关闭、refresh 与替换边界见
[共享身份合约说明](contracts/core/SHARED_IDENTITY.md)。既有 wire v1、类型形状和错误码集合不变。
新增 `createCoreSharedIdentityFixture` / `createCoreSharedIdentityExamples` 是明确标为 **FIXTURE** 的内存示例；
覆盖两个独立服务对象共享身份、验签和 `CORE_NOT_READY`，不代表真实客户端或文件系统验收。

## C-IDENTITY 要点（按提供方现状，不是基线原文）

- **wire 与服务端口分开**：`definition.d.ts` 上半是 HTTP DTO（浏览器安全），下半是进程内服务端口（`VerifiedActor`、`WriteContext`、`*WriteResult`，只在服务端）。
  按消费方取 `IdentityUsagePorts` / `IdentityCustodyPorts` / `IdentityClaimPorts` / `IdentityRegistryPorts` / `IdentityHostPorts`，不要再 import `@hanamesh/server-identity`。
- **设备注册**：`POST /v1/identity/devices/challenge` 入 `{purpose:'register'|'bind'}` 出 `{nonce,expiresAt}`；`POST /v1/identity/devices` 以 **201（新建）/ 200（同公钥再注册）** 区分，wire **没有 `created` 字段**（`created` 只在服务结果 `DeviceRegistrationResult`）。
- **设备注册没有限速**：不会返回 `IDENTITY_RATE_LIMITED`（429 只出现在登录桥、GitHub 绑定、邮箱验证请求）。
- **钱包绑定两步**：challenge `{chainId,address}` → `WalletChallengeDTO`（含要原样签的 SIWE `message`）；bind `{nonce,signature}` → `{binding,created}`（201/200）。
- **钱包登录（SIWE 会话）未实现**：`calls.walletSignIn.implemented === false`，后续卡 J4S1-IDENT-02。
- **`principalLinks.resolveCanonical` 不查存在性**：未知 id 原样返回 `{canonicalPrincipalId:<输入>, linkedDevicePrincipalIds:[]}`。
- **`wallets.getBinding` 未绑定返回 `null`**，包括格式合法但不存在的 principalId。两者都**不会**返回 `IDENTITY_NOT_FOUND`。
- **GitHub 证明**：无关系是结果 `relation:'none'`，不抛 `GITHUB_NO_RELATION`；是否拒绝由 claim 决定（后续卡 J3S3-IDENT-03）。
- 每个 call 的 `errors` 是提供方实际会返回的码，`baselineErrors` 是基线原列，差异写在 `note`。
- 服务错误按 `code` 匹配（`isIdentityError`），不要用 `instanceof`：本包的 `IdentityError` 与提供方的不是同一个构造器。

**示例数据全部是 FIXTURE**（`IDENTITY_FIXTURE_LABEL` 以 `FIXTURE ·` 开头）：`createIdentityServicesFixture()` 是内存合成提供方，不是产品实现；
GitHub 证明恒为 `GITHUB_TOKEN_INVALID`；钱包 challenge/bind 需要可选 peer 依赖 `viem`（不装时 `createIdentityContractExamples({wallets:false})`，`getBinding` 等其余端口不需要 viem）。
未移植提供方的 Pick/port 一致性套件（`/contract/ports`、`/contract/suite`）。

## C-UOW 与共享 SQL 连接（v0.5.0）

`@hanamesh/api-contracts/uow` 导出服务端 `UnitOfWork`、`UnitOfWorkFactory` 类型，
并重导出 C-IDENTITY 的 `SqlResult`、`SqlExecutor`、`WriteContext` 及新增 `SqlConnection`、`SqlPool`。
`/identity` 同时增加后两种类型；原 v0.2.0 已发布类型、字段和路径保留。
本包不导出产品用 `createUnitOfWork` 实现；工厂类型映射现有 host 的 `Pick<pg.Pool, 'connect'>`。

```ts
import type {UnitOfWork, SqlPool, SqlExecutor, WriteContext} from '@hanamesh/api-contracts/uow';
// 原有 /identity 路径可继续使用；SqlConnection/SqlPool 在该路径也可用。
import type {SqlConnection, SqlResult} from '@hanamesh/api-contracts/identity';

// 生产 host 注入现有 createUnitOfWork(pool)，模块只消费已发布的类型。
async function compose(unitOfWork: UnitOfWork) {
  return unitOfWork(async context => {
    await context.executor.query('SELECT $1::int AS example', [1]);
    // identity/usage/custody/claim/registry 写入均须使用同一个 context.executor。
    return {ok: true}; // unitOfWork 在 COMMIT 成功后才返回该结果。
  });
}
// 模块已经收到 host context：仅使用 executor，事务生命周期仍由 host 控制。
async function withHostContext<T>(context: WriteContext, work: (sql: SqlExecutor) => Promise<T>) {
  return work(context.executor);
}
```

- `UnitOfWork = <T>(work: (context: WriteContext) => Promise<T>) => Promise<T>`。
  host `pool.connect()` 一次，然后同连接 BEGIN → 回调 `{executor: connection}` → COMMIT → release。
  回调或 COMMIT 抛错时，在同连接尝试 ROLLBACK，finally 总会调用 release。
  connect 失败没有已取得的连接；BEGIN 失败按现有代码只 release、不 ROLLBACK；
  ROLLBACK/release 自身失败可能覆盖原错误，不额外承诺错误保留或成功回滚。
- `WriteContext` 只供可信服务端传递，executor 必须来自**同一数据库、已经 BEGIN 的固定连接**。
  多模块事务必须共用同一个 executor；host 传入 context 时，只有 host 执行 COMMIT/ROLLBACK/release。
  模块不应另开连接、改用 pool.query 或自行提交 host 事务。它是进程内端口，没有新增 HTTP DTO/schema。
- `SqlConnection extends SqlExecutor {release(): void}`；`SqlPool extends SqlExecutor {connect(): Promise<SqlConnection>}`。
  保留 `query(text:string, values?:unknown[]):Promise<SqlResult>`，结果仍是
  `{rows:Record<string,unknown>[], rowCount:number|null}`。`pool.query` 不保证固定连接；类型也不能验证
  当前事务状态、数据库身份或事务所有权，不能用 pool 自身冒充事务 executor。
- 模块**自己开启**事务时由模块获取连接并负责 BEGIN/COMMIT/ROLLBACK/release。
  identity 的现有 `runWrite` 在有 host executor 时直接调用 work；无 executor 时自行管理连接。
  它在 ROLLBACK 失败时保留原错误；这一点与当前 host 实现不同，替身分别保留两者的行为。
- Custody 的必需 host 写入上下文缺失、executor 缺失或 executor.query 不是函数时，
  抛 `CUSTODY_HOST_TRANSACTION_REQUIRED`，`statusCode:500`。按 `code` 识别；
  该码来自 custody 服务/存储的检查，不是 UnitOfWork 新增的本地错误。
  `UowErrorCode`、`UowErrorResponse` 和 `UOW_ERROR_CODES` 提供此既有错误子集，不穷举 SQL/回调异常。

可执行的最小示例使用明确标记的 `createUnitOfWorkProviderFixture()`：

```js
import {createUnitOfWorkProviderFixture, createUnitOfWorkContractExamples} from '@hanamesh/api-contracts/uow';
const fixture = createUnitOfWorkProviderFixture();
await fixture.unitOfWork(async context => {
  await fixture.moduleWrite(sql => sql.query('identity write'), context);
  await fixture.custodyExecutor(context).query('custody write');
});
// fixture.connections[0].queries: BEGIN, identity write, custody write, COMMIT
// fixture.connections[0].releaseCount: 1；两次写入使用同一个 connection。
try {
  await fixture.unitOfWork(async context => {
    await context.executor.query('write');
    throw new Error('example failure');
  });
} catch (error) { if (error.message !== 'example failure') throw error; }
// 第二个连接: BEGIN, write, ROLLBACK；releaseCount: 1。
await fixture.moduleWrite(sql => sql.query('module-owned write'));
// 没有 context：模块获取自己的第三个连接并 COMMIT/release。
const examples = createUnitOfWorkContractExamples(); // 成功/失败命令序列与错误 DTO。
```

替身只记录 pool/connection 调用及 release 次数，不执行 SQL、不模拟真实数据持久化、
数据库身份检查或并发事务；可注入 `query(call)` 模拟 SQL 结果/错误。
C-UOW 和共享连接的正式发布渠道是同一个 git tag `v0.5.0`，供 server-usage/custody 使用。
Host API 的后续发布属于 J3S1-APIC-11，本卡未增加该 API。

## C-CATALOG profile 接口

本入口只覆盖本卡的 Hana profile API；不导出 registry 的 publisher/package/release API。
浏览器 DTO 使用 `HanaProfileDTO`、`UpsertHanaProfileInput`、`HanaProfileQuery`、`HanaProfilePage`；
服务端使用 `RegistryCatalogPort`（四个方法）或 `RegistryProfilePort`（upsert/list/get 三个方法）。
`RegistryIndexerSubject` 与 `WriteContext` 复用本包 C-IDENTITY 类型，不需要 import 提供方包。

- `GET /v1/registry/hanas/:hanaId` 返回 `HanaProfileDTO`（含 `githubRepo:string|null`），缺失返回 404 `REGISTRY_NOT_FOUND`，非法 UUID 返回 400 `REGISTRY_INPUT_INVALID`。
- `upsertHanaProfile(subject, input, context?)` 返回 `{disposition:'created'|'updated', durability:'committed'|'pending-host-commit', profile}`。
  基线 `NormalizedHanaInput` 对应实际 `UpsertHanaProfileInput`。稳定键是 `(sourceId,sourceRef)`；更新保留 hanaId 和 owner，拒绝输入 ownerPrincipalId。
  认证 subject 是必填参数，写入由宿主 indexer policy 决定。`REGISTRY_IDENTITY_CONFLICT` 是基线摘要，实际 profile upsert 不抛此码。
- `listHanaProfiles(query?)` 返回 `{items,next}`，默认 limit 20、范围 1..100；支持 search/sourceId/kind/claimed/after，按 UUID 升序分页。
  提供方同时有公开 `GET /v1/registry/hanas`；HTTP claimed/limit 字符串由适配器转换成服务端 boolean/integer。
- `getHanaProfile(hanaId)` 缺失抛 `REGISTRY_NOT_FOUND`，不会返回 null。
- `assignHanaOwner(hanaId, principalId, context?)` 只给可信宿主使用。类型保留提供方 optional context 写法，运行时必须有 executor，否则 `REGISTRY_HOST_TRANSACTION_REQUIRED`（500）。
  返回 `{durability:'pending-host-commit',profile}`；宿主负责验证 principal 与 commit/rollback。任何已有 owner（包括同一 principal）都拒绝为 `REGISTRY_HANA_ALREADY_OWNED`（409）。
  它还可能抛输入无效或 profile 缺失；没有对应 HTTP owner 写入路由。
- 提供方另有 `POST /v1/registry/hanas`：201（新建）/200（更新），wire 是 `{created,profile}`，没有服务结果的 disposition/durability。
  `calls.*.errors` 记录本地实际错误，`baselineErrors` 保留基线；注入的 policy/storage 还可能传播其他错误，不能按目录穷举所有异常。

`createCatalogContractExamples()` 提供 DTO、HTTP 和全部已列错误示例；`createCatalogProviderFixture()` 是明确标记的 FIXTURE 内存模拟。
夹具支持宿主 `commit(executor)`/`rollback(executor)`，覆盖 profile upsert 和 owner assignment；不执行 SQL、不验证真实认证或事务，也不模拟事务并发。
提供方原 schema 仅有 profile/query/page/upsert/error，未定义 AssignHanaOwnerResult；该返回类型直接保留提供方声明，测试检查其 pending 标记及 profile schema。
`provenance.json` 记录提供方 SHA、源文件哈希与发布的 schema/声明/验证器哈希。

## C-CHAIN 工厂签名

`ChainFactories` 精确保留以下五个提供方工厂的 options、异步返回、服务端口和相关 DTO：
`createConfirmedLaunchProducer`、`createLaunchAdmissionProducer`、`createUserPaidClaimAdapter`、
`createBondSupplyAdapter`、`createSwapSupplyAdapter`。可用 `Parameters<ChainFactories['createSwapSupplyAdapter']>[0]`
取 options，用 `Awaited<ReturnType<...>>` 取端口。工厂名及错误类**只作为类型导出**；本包没有生产工厂实现。
Host 组合提供方工厂时，以 `ChainFactories` 校验其签名；不要从本包运行时 import 这些工厂。

- `ConfirmedLaunch` 为 readonly 发行事实，缺失发行返回 `null`，没有 `rootValidUntil`；根授权提交有效期由 Custody 在 cut 时冻结。
- admission 显式依赖事实、市场、signer、store；新请求由 payer 声明 name/symbol。
- user-paid claim 和 swap 的 `walletClient?: never` 原样保留，由用户钱包签名广播；现有 Bond 工厂要求服务端 wallet client 与 receipt policy。
- `factories.*.baselineErrors` 保留基线摘要；`errors` / `directErrors` 是提供方源码及已列 shared helpers 的错误目录，按 `code` 识别。
  注入端口、journal、RPC/SDK 或组合 producer 还会传播其他错误，不能将目录当作穷举 union。
  例如 Bond 基线的 `HANA_NOT_ISSUED` / `MARKET_NOT_QUALIFIED` 来自可信事实/admission 路径，不能凭基线给 Bond 工厂编造本地错误。
- `createChainContractExamples()` 给出五条调用相关的合成 DTO/请求；`createChainProviderFixture()` 仅模拟 `ConfirmedLaunchProducer` 的匹配请求读口和缺失 `null`，不模拟链验证或可执行交易。

### C-CHAIN 分发适配器（Q-33，server-chain `v0.3.0` / `dd0b142`）

`ChainFactories.createDistributionAdapter(options: DistributionAdapterOptions): Promise<DistributionAdapter>`，
options 为 publicClient、walletClient、expectedChainId、distributor、reservedDistributor、`policyMode: 'test-only' | 'production'`（无默认值）、
receiptPolicy、journal、可选 rootSigners。适配器四个方法：`verify` → `DistributionVerifyResult`；`execute` / `result` → `DistributionResult`；
`canonicalReadback` → `{ result, readback: DistributionCanonicalReadback }`。`DistributionResult` 含 issuance、ordinary/reserved 根、
三步（ordinary-root / reserved-funding / reserved-opening）结果与 `reservedOpening`。声明从提供方 `v0.3.0` 的 `index.d.ts` 逐字追加到
`provider.d.ts`，哈希记在 `provenance.json` 的 `distribution.declarationSHA256`；原五个工厂的声明在 `v0.3.0` 上核对无变化。

- 错误通道：工厂先经 `createChainAdapter` 校验客户端/链，失败以 `ChainAdapterConfigurationError`（`CONFIG_INVALID`、`CHAIN_ID_MISMATCH`）拒绝；
  其后一律 `DistributionError`：`name: 'DistributionError'`，`code: DistributionErrorCode`（32 个，封闭集合 = 提供方 `reject()` = 文档码表），
  发送后结果带 `result`，缺前置条件带 `need`（要补什么），发送时 SDK 失败带 `cause`。构造 `(code, message, details?)`。
  `CHAIN_ID_MISMATCH` 两个通道都有：工厂时为配置错误，之后链漂移为 `DistributionError`。
- 两个错误类与工厂**只作为类型导出**，运行时实现在 server-chain；真实 Chain 由部署组合加载。本包不放宽任何交易规则。
- `createChainDistributionExamples()` 返回提供方 `docs/distribution/contract-examples.json` 原字节（FIXTURE：真实适配器跑 TEST_ONLY 合成传输，
  bigint 写成十进制字符串，回执只保留被核验字段）：调用、成功、partial（`AUTHORIZATION_EXPIRED` 带 need 与 `status: 'partial'`）及五个失败。
- `createDistributionReadFixture()` 是最小 FIXTURE：只用例子回放 `result` / `canonicalReadback`，未知 intent 按例子拒绝 `INTENT_NOT_FOUND`；
  不验证、不签名、不发送。完整 TEST_ONLY 传输夹具归提供方：`@hanamesh/server-chain/distribution/test-only`。

## C-HANASWAP Router02

JSON 与 `HANASWAP_ROUTER02_ABI` 是完整 **26 项 / 24 个函数** ABI，类型入口保留字段字面量，支持 viem 编解码类型推导。
`HANASWAP_ABI_MANIFEST` 原样记录冻结 periphery `ed249913`、solc 0.6.6、Istanbul / optimizer 999999。
ABI 内容哈希为 `SHA256(JSON.stringify(abi))`：`6e79ecda8373ea27fceeff14d4fd6c587524bf3241cd26919048d6572164cac5`；
原始 JSON 文件字节哈希另见 `contracts/hanaswap/provenance.json`。

金额为整数 base units，deadline 为 Unix 秒，地址为占位示例。swap 输入 token、移除流动性的 LP 均需先独立 approve；
Router 使用 `Error(string)`，不是自定义 ABI error；常见错误是 `INSUFFICIENT_OUTPUT_AMOUNT`、`INSUFFICIENT_A_AMOUNT`、
`INSUFFICIENT_B_AMOUNT`、`EXPIRED`（均带 `UniswapV2Router: ` 前缀），底层 pair/token/library 还可传播错误。
`createHanaSwapProviderFixture()` 只移植提供方 `abi/mock_hanaswap.py` 的固定 swap 示例及滑点/过期拒绝，不提供 LP 模拟或定价引擎。

本包自有代码为 MIT；Router02 ABI 来源为 GPL-3.0-or-later，附其原始许可 `contracts/hanaswap/LICENSE`。

## 自检

```sh
npm ci && npm test
```

`node --test` 校验：定义与基线的调用/错误码一致、示例数据通过 schema、每个声明的错误码都有示例、
C-CORE 握手矩阵 13 项、签名按规范字节可验证、C-USAGE-LOCAL 幂等/冲突/同意/Core 状态及 Q-18 跨客户端示例与提供方 eventId/nonce 向量、C-IDENTITY 握手矩阵 14 项与错误表/schema 一致、wire 无 `created`、未知 id/未绑定语义；
C-CHAIN 声明/schema 来源哈希、合成 DTO 与缺失事实读口、分发面声明逐字哈希/错误码/例子字段集与读夹具；C-HANASWAP 完整 ABI/hash、swap/add/remove 编解码与固定模拟错误；
C-CATALOG 提供方来源哈希、schema/示例/错误覆盖、稳定身份/分页、授权拒绝、owner 注入拒绝、宿主事务提交/回滚和重复认领拒绝；
C-UOW 同连接提交/回滚/释放、host 与模块的事务所有权、缺 context/executor 错误、SQL 故障边界和 pool.query 非固定连接；
`tsc` 校验共享 SQL 类型、UnitOfWork 泛型回调及旧 C-IDENTITY 类型兼容、六个工厂类型（含分发适配器 options/返回/错误码）、readonly 发行事实、用户钱包 signer 排除、ABI 参数及四个 catalog 服务签名。

## 发布

改动随提供方卡合入 `main`，在 `package.json` 升版本并打 `v{version}` tag（新增合约或可选字段为 minor；破坏性变更为 major）。

## 依赖

| 名称 | 版本 | 协议 | 来源 | 用途 |
|---|---|---|---|---|
| ajv | ^8.20.0 | MIT | https://github.com/ajv-validator/ajv | 开发依赖：测试里按 JSON Schema 2020-12 校验示例数据 |
| typescript | ^5.9.3 | Apache-2.0 | https://github.com/microsoft/TypeScript | 开发依赖：校验 `.d.ts` |
| viem | 2.54.2（peer `^2.54.2`，可选） | MIT | https://github.com/wevm/viem | C-IDENTITY 夹具的钱包 challenge/bind：SIWE 消息（`viem/siwe`）与 EIP-191 验签；版本同提供方锁定 |
| hanamesh-server | 0.3.1 / `b63fb8c` | 未声明（同项目提供方） | https://github.com/yzsnstotz/hanamesh-server | C-UOW 已有事务端口及固定 pg 连接用法来源；不引入运行时依赖 |
| @hanamesh/server-identity | 0.3.2 / `9378af2` | UNLICENSED | https://github.com/yzsnstotz/hanamesh-server-identity | 共享 SqlConnection/SqlPool 与模块事务所有权来源；不引入运行时依赖 |
| @hanamesh/server-custody | 0.2.0 / `c91a0fc` | UNLICENSED | https://github.com/yzsnstotz/hanamesh-server-custody | 必需 host context 检查和既有 500 错误码来源；不引入运行时依赖 |
| @hanamesh/server-usage | 0.3.1-rc.1 / `5ff545a` | UNLICENSED | https://github.com/yzsnstotz/hanamesh-server-usage | C-USAGE 来源（J2S3-SUSAGE-01 `70c480e`；Q-33 维护端口 J2S3-SUSAGE-02 `5ff545a`）；声明逐字提取、维护作业逻辑移植到 FIXTURE；不引入运行时依赖 |
| @hanamesh/server-registry | 0.2.1 / `5dcb5ee` | UNLICENSED（提供方 package.json 声明） | https://github.com/yzsnstotz/hanamesh-server-registry | 同项目 C-CATALOG 提供方合约来源，按本卡同步 DTO、schema、错误码及 profile 夹具；不添加运行时依赖 |
| @hanamesh/server-chain | 0.3.0 / `dd0b142`（tag `v0.3.0`） | 未声明（提供方 package.json 无 license 字段） | https://github.com/yzsnstotz/hanamesh-server-chain/tree/v0.3.0 | C-CHAIN 分发面声明逐字来源与 FIXTURE 例子原字节；不引入运行时依赖 |
| Uniswap V2 periphery | ed24991304291297c3b4a52818d02f46a17aa9a2 | GPL-3.0-or-later | https://github.com/Uniswap/v2-periphery | contracts 提供的完整 Router02 ABI 与原始许可；不引入运行时依赖 |

C-CHAIN 类型引用 viem 的公开 SDK 类型；类型消费方需安装兼容 viem。签名来源提供方锁定 viem 2.56.9；本包现有开发版本 2.54.2 的类型自检也通过。C-HANASWAP JSON/离线模拟不加载 viem。

运行时无必需依赖（只用 Node 内置 `node:crypto`、`node:fs`）；`viem` 是可选 peer，只有 C-IDENTITY 夹具的钱包两步会加载它。

## C-CONTRACTS-ABI 发行冻结工件（v0.7.0）

入口 `@hanamesh/api-contracts/contracts-abi` 导出 `HANA_LAUNCHER_ABI`、`LAUNCH_FEE_ABI`、
`HANA_TOKEN_ABI` 与相应 `*_FROZEN`、`CONTRACTS_ABI_MANIFEST`、`CONTRACTS_ABI_FROZEN_MANIFEST`。
直接 JSON 入口：`/contracts-abi/HanaLauncher.json`、`/contracts-abi/LaunchFee.json`；
`/contracts-abi/frozen/{HanaLauncher,LaunchFee,HanaToken,manifest}.json`；
`/contracts-abi/{launch-manifest,launch-example,provenance}.json`。
HanaToken ABI 从冻结工件原样读取；所有提供方文件逐字节保留，摘要见 provenance 和 frozen manifest。
来源：J4S2-CTR-08 最终提交 `fdfc672d81af286e8f118ccab29eb2a5386ba5ca`。
冻结版本 `J4S2 OZ v0.2.0`，证据仅为 SOURCE_BUILD；不代表真链、部署或广播。
三个 OZ 工件取代提供方旧 P19 同名模板，本发布没有纳入旧模板。
核对已部署代码时将 immutableReferences 指定的每个字节区间清零，再比较 runtimeTemplate。
ABI 自定义错误及事件完整保留，金额使用整数 base units。
`createContractsAbiContractExamples()` 返回提供方 FIXTURE 示例；`contracts/contracts-abi/mock_launch.py`
是原样提供方最小模拟，仅支持示例签名、不执行 ECDSA、RPC 或转账。
本次只包含发行；领取/Bond 工件由后续提供方卡增加。

来源许可：HanaLauncher / LaunchFee / HanaToken · J4S2 OZ v0.2.0 · MIT（源码 SPDX）·
https://github.com/yzsnstotz/hanamesh-contracts · 发行 ABI/冻结工件；
OpenZeppelin Contracts · v5.3.0 / e4f70216d759d8e6a64144a9e1f7bbeed78e7079 · MIT ·
https://github.com/OpenZeppelin/openzeppelin-contracts · 提供方冻结构建底座；无新增运行时依赖。

## J3.S3 提供方合约（v0.8.0）

[C-CLAIM](contracts/claim/README.md) 记录 Q-21：start 单次 claimed、同账号 claiming 复用/claimed 幂等、onClaimed只一次、跨账号409、none403/不可用503、保留verify与失败/重试/回滚例子。
[C-INDEXER-CATALOG](contracts/indexer-catalog/README.md) 记录 Q-22：实际wire/基线映射、分页、错误通道、去重/来源回链与独立运行器供给/关闭。两者复用已发布 C-CATALOG/C-UOW；服务端 Fastify 类型使用可选peer，JS示例无需导入 Fastify。
提供方未提供独立JSON Schema；本卡发布其实际DTO声明与类型/语义自检，不添加未实现校验规则。所有夹具明确为FIXTURE，不证明真实Registry组合、SQL/GitHub/并发或产品验收。

## C-CONTRACTS-ABI 完整发行与领取冻结集合（v0.11.0）

Q-28 提供 [CTR-09 完整五件入口](contracts/contracts-abi/frozen/oz-ctr09/README.md)：
`@hanamesh/api-contracts/contracts-abi/frozen/oz-ctr09`，包含同一固定提交的
HanaLauncher、LaunchFee、HanaToken、Distributor、ReservedDistributor 与原 manifest/provenance。
新增 `/contracts-abi/Distributor.json`、`/contracts-abi/ReservedDistributor.json` 完整 ABI 入口。
CTR-09 的前三件 immutable 编号/文件 SHA 已刷新；Chain 使用新五件集合时须整套切换，
不能混合 v0.7.0 三件旧 SHA。既有 v0.7.0 路径、类型和文件字节全部保留。
SOURCE_BUILD 继承提供方；本包只验证 PACKAGE/FIXTURE，真实领取 producer 留给 CHAIN-02。

## C-USAGE 宿主维护作业端口 Q-33（v0.14.0）

跟随 J2S3-SUSAGE-02 main `5ff545a`（提供方未打 tag；运行时源码与 schema 与 `70c480e` 逐字节相同，只命名了既有类型）。
`@hanamesh/api-contracts/usage` 只加不改：`rollupAndPurge(now: Date, context?: WriteContext)` 端口、`RollupAndPurgeResult`、
`UsageServiceOptions`/`UsageModuleOptions`/`OnEventsAccepted`/`EligibilityReaderOptions` 等配置注入类型，`USAGE_MAINTENANCE_DEFINITION`
（received_at 截止、retentionDays 0..90 缺省 90、两种事务模式与 durability、锁、权限/RLS、错误触发条件、关闭顺序），
以及独立的 `createUsageMaintenanceFixture`/`createUsageMaintenanceExamples`。原三个 HTTP 调用、`UsageEventService`、原夹具及其
「无日汇总/无宿主事务」声明不变。产品工厂 `createUsageModule` 仍由实现包提供。均为 FIXTURE，不是真实库或宿主作业验收。

## C-USAGE-LOCAL Q-18 跨客户端同事实投递（v0.12.0）

跟随 J1S4-USAGE-02 main `6f724fc`。`RecordInput.occurredAt` 由可选（缺省 now）改为**必填**原事实时间，缺省返回既有
`INVALID_RECORD_INPUT`；这是收窄，消费方升级前须让来源提供原始时间。UUIDv5 公式与冲突语义不变。
新增 `USAGE_LOCAL_DELIVERY_RULES`、`usageRecordEventNonce`、夹具 `uploadEvents()` 与 `createUsageLocalCrossClientExamples`
（重复事实、不同操作、不同设备、时间不一致冲突、缺时间）。事件级 nonce 与 HTTP 请求 nonce 的区别及证据范围见
[C-USAGE-LOCAL 说明](contracts/usage-local/README.md)。均为 FIXTURE，不是双客户端或服务端验收。

## C-POINTS Q-50 宿主注入与受益人校验（v0.16.0）

J4S3-APIC-18 仅跟随提供方 J4S3-CUST-05 main `c93e7a6efa0d080f0b481b8d4f2577fe78cbd33a`。
新增 `BeneficiaryViewChecker` / `BeneficiaryViewExpected` / `BeneficiaryValidationPort`，保持同步失败规则 ID 数组及原异常边界。
模块配置既有类型保留，补发 `CustodyServiceDeps` / `CustodyStore` / `SnapshotServiceDeps` / `ConfirmedLaunchSource` 和具名设置/策略声明。
[说明](contracts/points/README.md) 包含来源、11 项规则、设置错误和边界；两份 JSON 为固定 provider 样例原字节。
独立最小 FIXTURE 只转发显式注入 checker；产品校验函数、工厂和分配算法仍由提供方供应。证据限 PACKAGE/FIXTURE。

## C-SEMANTIC D-20 宿主公开端口（v0.18.0）

J3S1-APIC-19 跟随正式 J3S1-SEM-01 main/tag `6756523` / `v0.2.0`。
入口 `@hanamesh/api-contracts/semantic`；完整模块配置、五个服务调用、HTTP 与 embedding/decision
具名配置仅供应公开类型签名，产品工厂由部署清单加载。
[消费说明](contracts/semantic/README.md) 及固定提供方文档/来源清单公开原错误边界与最小 FIXTURE；
不含生产算法。既有 C-UOW 与所有合约保持。证据限 PACKAGE/FIXTURE。

## C-SEMANTIC Q61/Q67/Q81（v0.19.0）

只跟随 J3S1-SEM-02 已测试合 main `7930d7729d2fbaae4f096cea481d29a4c8068132`，旧 v0.18.0 调用/类型/JSON/FIXTURE 保持。
新增 server-only 当前行 embedding 事实、完整具名配置、独立录制 FIXTURE 和公开类型工厂签名；公开新增面一次 minor。
[说明](contracts/semantic/README.md)、[事实语义](contracts/semantic/EMBEDDING-FACTS.md)、[配置与错误](contracts/semantic/CONFIGURATION.md)
和 [新来源](contracts/semantic/current-provenance.json) 明确 all/exact、分页、空/故障、当前 MIN 非永久历史及宿主 C-CATALOG 集合分母。
证据仅 PACKAGE/FIXTURE，不代表 REAL_HOST/UI/MODEL 或 owner ACCEPTED。

`./chain/quote-v2` carries the new `release-quote-v2` provider declarations, frozen ABI revision2.0.0 and source metadata. Import runtime factories from `@hanamesh/server-chain/quote-v2`; this contracts package exports only `QUOTE_V2_CONTRACT` at runtime. The explicit chain subpath uses the optional viem peer. Its facts distinguish `migrationState: 'open' | 'pending' | 'completed'`; a successful closing receipt may remain pending. Quote selection and virtual starting reserve are per issuance, while wrappedNative is deployment metadata. Launch fee is signed native `launchFeeWei`, sent by the payer wallet.

Quote-v2 gas follows [Uniswap/interface v4.0.0 calculateGasMargin](https://github.com/Uniswap/interface/blob/e9148b30c9aff44613003b83daacc83d24b157f0/src/utils/calculateGasMargin.ts): estimate once with viem and attach fixed20% headroom. `calculateQuoteV2GasMargin` is a pure bigint helper declaration; the unpublished custom `prepareQuoteV2Migration` is removed. API0.20.1 replaces the prior0.20.0 candidate.

Hana目录来源与Profile类型直接消费`@hanamesh/server-registry/contracts`，服务类型消费`/server-contracts`，提供方fixture消费`/contract/fixtures`。本包不再提供catalog入口或来源列表副本。使用有关类型/fixture的开发核对先安装冻结的Registry正常包；未使用这些类型的运行消费者无需装配Registry。

## 10-31 边界核对的正常提供方输入

类型与fixture核对用已核SHA的Registry0.3.34正常包：锁定依赖安装后，以`npm install --no-save --package-lock=false --ignore-scripts --strict-peer-deps <Registry正常tgz>`提供可选公开peer，再跑原`npm test`；不把tgz放进本仓或引用相邻源码。
