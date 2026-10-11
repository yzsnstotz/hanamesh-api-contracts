# @hanamesh/api-contracts

HanaMesh 模块间 API 合约的唯一来源：类型、错误码、示例数据、最小模拟实现和一致性自检。
只跟着提供方卡改；模块之间只经这里交互，不互相 import。

## 安装（按 git tag 取已发布版本）

```json
"@hanamesh/api-contracts": "git+https://github.com/yzsnstotz/hanamesh-api-contracts.git#v0.6.0"
```

## 合约

| 合约 | 入口 | 提供方 → 使用方 | 来源 |
|---|---|---|---|
| C-CORE | `@hanamesh/api-contracts/core`（schema：`/core/schema.json`；来源：`/core/provenance.json`） | core → usage, desktop | v1 定义/schema/独立 fixture 仍来自 hanamesh-core main `0fa85ef`，原样搬入（仅改相对路径）；共享身份语义跟随 J1S4-CORE-02 main `572d853` 的 `docs/API.md`、`docs/CORE_CONTRACT.md` 与已校验归档 REPORT |
| C-USAGE-LOCAL | `@hanamesh/api-contracts/usage-local`（schema：`/usage-local/schema.json`） | usage → app-host | hanamesh-usage main `7517d76`：`src/host/contracts.d.ts`、`src/host/record.js`、`src/host/transport.js` |
| C-IDENTITY | `@hanamesh/api-contracts/identity`（schema：`/identity/schema.json`） | server-identity → core, web-market, server-usage/custody/claim/registry/host | hanamesh-server-identity origin/main `ffe1ae5`（与 J2S1-IDENT-01 核验的 `f0cb96c` 在类型/schema/路由/服务源码上逐字节相同）：`contract/hanamesh-server-identity.v1.schema.json` 原样搬入；`src/contracts.ts`、`src/server-contracts.ts`、`src/contract.ts`、`src/core/errors.ts`、`src/contract-fixtures.ts` 移植为 JS |
| C-CHAIN | `@hanamesh/api-contracts/chain`；`/chain/confirmed-launch.schema.json`、`/chain/user-paid-claim.schema.json` | server-chain → server-host | J4S2-CHAIN-01 origin/main `f30464b`：`index.d.ts` 中五个工厂及其依赖声明逐字提取，两个 schema 原样搬入；`/chain/provenance.json` 记录源码与声明哈希 |
| C-HANASWAP | `@hanamesh/api-contracts/hanaswap`；`/hanaswap/UniswapV2Router02.json` | contracts → server-chain | J4S2-CTR-01 origin/main `c9e9809`：`abi/UniswapV2Router02.json`、`manifest.json`、`example.json` 原样搬入，GPL-3.0-or-later 来源与许可保留 |
| C-UOW | `@hanamesh/api-contracts/uow`（来源：`/uow/provenance.json`） | server-host → server-usage, server-custody, server-claim, server-identity, server-registry | J3S1-HOST-01 既有事务行为：host origin/main `b63fb8c` 的 `src/unit-of-work.ts`；共享 SQL 类型按 identity origin/main `9378af2` 的 `src/server-contracts.ts` 增补 |
| C-CATALOG | `@hanamesh/api-contracts/catalog`（schema：`/catalog/schema.json`；来源：`/catalog/provenance.json`） | server-registry → core, web-market, server-indexer, server-claim, server-host | J3S4-REG-01 origin/main `5dcb5ee`：profile DTO/四个服务端口声明提取、profile schema 原样搬入；错误码、HTTP 语义和夹具按提供方源码同步 |

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
C-CORE 握手矩阵 13 项、签名按规范字节可验证、C-USAGE-LOCAL 幂等/冲突/同意/Core 状态、C-IDENTITY 握手矩阵 14 项与错误表/schema 一致、wire 无 `created`、未知 id/未绑定语义；
C-CHAIN 声明/schema 来源哈希、合成 DTO 与缺失事实读口；C-HANASWAP 完整 ABI/hash、swap/add/remove 编解码与固定模拟错误；
C-CATALOG 提供方来源哈希、schema/示例/错误覆盖、稳定身份/分页、授权拒绝、owner 注入拒绝、宿主事务提交/回滚和重复认领拒绝；
C-UOW 同连接提交/回滚/释放、host 与模块的事务所有权、缺 context/executor 错误、SQL 故障边界和 pool.query 非固定连接；
`tsc` 校验共享 SQL 类型、UnitOfWork 泛型回调及旧 C-IDENTITY 类型兼容、五个工厂类型、readonly 发行事实、用户钱包 signer 排除、ABI 参数及四个 catalog 服务签名。

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
| @hanamesh/server-registry | 0.2.1 / `5dcb5ee` | UNLICENSED（提供方 package.json 声明） | https://github.com/yzsnstotz/hanamesh-server-registry | 同项目 C-CATALOG 提供方合约来源，按本卡同步 DTO、schema、错误码及 profile 夹具；不添加运行时依赖 |
| Uniswap V2 periphery | ed24991304291297c3b4a52818d02f46a17aa9a2 | GPL-3.0-or-later | https://github.com/Uniswap/v2-periphery | contracts 提供的完整 Router02 ABI 与原始许可；不引入运行时依赖 |

C-CHAIN 类型引用 viem 的公开 SDK 类型；类型消费方需安装兼容 viem。签名来源提供方锁定 viem 2.56.9；本包现有开发版本 2.54.2 的类型自检也通过。C-HANASWAP JSON/离线模拟不加载 viem。

运行时无必需依赖（只用 Node 内置 `node:crypto`、`node:fs`）；`viem` 是可选 peer，只有 C-IDENTITY 夹具的钱包两步会加载它。
