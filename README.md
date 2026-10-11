# @hanamesh/api-contracts

HanaMesh 模块间 API 合约的唯一来源：类型、错误码、示例数据、最小模拟实现和一致性自检。
只跟着提供方卡改；模块之间只经这里交互，不互相 import。

## 安装（按 git tag 取已发布版本）

```json
"@hanamesh/api-contracts": "git+https://github.com/yzsnstotz/hanamesh-api-contracts.git#v0.2.0"
```

## 合约

| 合约 | 入口 | 提供方 → 使用方 | 来源 |
|---|---|---|---|
| C-CORE | `@hanamesh/api-contracts/core`（schema：`/core/schema.json`） | core → usage, desktop | hanamesh-core main `0fa85ef`：`lib/contract.js`、`lib/contract-fixtures.js`、`contract/hanamesh-core.v1.schema.json` 原样搬入（仅改相对路径） |
| C-USAGE-LOCAL | `@hanamesh/api-contracts/usage-local`（schema：`/usage-local/schema.json`） | usage → app-host | hanamesh-usage main `7517d76`：`src/host/contracts.d.ts`、`src/host/record.js`、`src/host/transport.js` |
| C-IDENTITY | `@hanamesh/api-contracts/identity`（schema：`/identity/schema.json`） | server-identity → core, web-market, server-usage/custody/claim/registry/host | hanamesh-server-identity origin/main `ffe1ae5`（与 J2S1-IDENT-01 核验的 `f0cb96c` 在类型/schema/路由/服务源码上逐字节相同）：`contract/hanamesh-server-identity.v1.schema.json` 原样搬入；`src/contracts.ts`、`src/server-contracts.ts`、`src/contract.ts`、`src/core/errors.ts`、`src/contract-fixtures.ts` 移植为 JS |

每个合约导出：`*_CONTRACT_DEFINITION`（调用、返回、错误码、错误通道、`implementationErrors` 与说明）、
JSON Schema、`create*ProviderFixture`（带 `FIXTURE` 标签的内存模拟提供方，不是产品实现）和 `create*ContractExamples`（示例数据）。
`errors` 是基线声明的错误码；`implementationErrors` 是当前提供方实际还会返回的码；两者不一致的地方写在 `note` 里。

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

## 自检

```sh
npm ci && npm test
```

`node --test` 校验：定义与基线的调用/错误码一致、示例数据通过 schema、每个声明的错误码都有示例、
C-CORE 握手矩阵 13 项、签名按规范字节可验证、C-USAGE-LOCAL 幂等/冲突/同意/Core 状态、C-IDENTITY 握手矩阵 14 项与错误表/schema 一致、wire 无 `created`、未知 id/未绑定语义；`tsc` 校验类型声明。

## 发布

改动随提供方卡合入 `main`，在 `package.json` 升版本并打 `v{version}` tag（新增合约或可选字段为 minor；破坏性变更为 major）。

## 依赖

| 名称 | 版本 | 协议 | 来源 | 用途 |
|---|---|---|---|---|
| ajv | ^8.20.0 | MIT | https://github.com/ajv-validator/ajv | 开发依赖：测试里按 JSON Schema 2020-12 校验示例数据 |
| typescript | ^5.9.3 | Apache-2.0 | https://github.com/microsoft/TypeScript | 开发依赖：校验 `.d.ts` |
| viem | 2.54.2（peer `^2.54.2`，可选） | MIT | https://github.com/wevm/viem | C-IDENTITY 夹具的钱包 challenge/bind：SIWE 消息（`viem/siwe`）与 EIP-191 验签；版本同提供方锁定 |

运行时无必需依赖（只用 Node 内置 `node:crypto`、`node:fs`）；`viem` 是可选 peer，只有 C-IDENTITY 夹具的钱包两步会加载它。
