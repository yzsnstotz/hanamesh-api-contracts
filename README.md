# @hanamesh/api-contracts

HanaMesh 模块间 API 合约的唯一来源：类型、错误码、示例数据、最小模拟实现和一致性自检。
只跟着提供方卡改；模块之间只经这里交互，不互相 import。

## 安装（按 git tag 取已发布版本）

```json
"@hanamesh/api-contracts": "git+https://github.com/yzsnstotz/hanamesh-api-contracts.git#v0.1.0"
```

## 合约

| 合约 | 入口 | 提供方 → 使用方 | 来源 |
|---|---|---|---|
| C-CORE | `@hanamesh/api-contracts/core`（schema：`/core/schema.json`） | core → usage, desktop | hanamesh-core main `0fa85ef`：`lib/contract.js`、`lib/contract-fixtures.js`、`contract/hanamesh-core.v1.schema.json` 原样搬入（仅改相对路径） |
| C-USAGE-LOCAL | `@hanamesh/api-contracts/usage-local`（schema：`/usage-local/schema.json`） | usage → app-host | hanamesh-usage main `7517d76`：`src/host/contracts.d.ts`、`src/host/record.js`、`src/host/transport.js` |

每个合约导出：`*_CONTRACT_DEFINITION`（调用、返回、错误码、错误通道、`implementationErrors` 与说明）、
JSON Schema、`create*ProviderFixture`（带 `FIXTURE` 标签的内存模拟提供方，不是产品实现）和 `create*ContractExamples`（示例数据）。
`errors` 是基线声明的错误码；`implementationErrors` 是当前提供方实际还会返回的码；两者不一致的地方写在 `note` 里。

## 自检

```sh
npm ci && npm test
```

`node --test` 校验：定义与基线的调用/错误码一致、示例数据通过 schema、每个声明的错误码都有示例、
C-CORE 握手矩阵 13 项、签名按规范字节可验证、C-USAGE-LOCAL 幂等/冲突/同意/Core 状态；`tsc` 校验类型声明。

## 发布

改动随提供方卡合入 `main`，在 `package.json` 升版本并打 `v{version}` tag（新增合约或可选字段为 minor；破坏性变更为 major）。

## 依赖

| 名称 | 版本 | 协议 | 来源 | 用途 |
|---|---|---|---|---|
| ajv | ^8.20.0 | MIT | https://github.com/ajv-validator/ajv | 开发依赖：测试里按 JSON Schema 2020-12 校验示例数据 |
| typescript | ^5.9.3 | Apache-2.0 | https://github.com/microsoft/TypeScript | 开发依赖：校验 `.d.ts` |

运行时无依赖（只用 Node 内置 `node:crypto`、`node:fs`）。
