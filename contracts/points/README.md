# C-POINTS · v0.16.0

既有发布来自提供方卡 J2S4-CUST-01，核对提交 `bee5d8219a6bdc70adbb14f72d9d637e21e29d77`。
`contracts.d.ts`、`provider.d.ts`、`snapshots/contracts.d.ts`、调用定义和错误实现从该提交提取；仅改包内类型路径、去掉 source map 注释和提供方运行夹具声明。
本包不加载 Custody 产品实现，不修改提供方行为。来源与逐文件哈希见 `provenance.json`。

```ts
import {POINTS_CONTRACT_DEFINITION, createPointsContractExamples,
  createPointsProviderFixture, CustodyError} from '@hanamesh/api-contracts/points';
import type {OwnPointsDTO, CustodyService, SnapshotService,
  WriteContext, LaunchSnapshot, BeneficiaryEntitlementView} from '@hanamesh/api-contracts/points';
```

## Q-13：绑定状态

`OwnPointsDTO.bindingStatus` 必填，只能为 `UNBOUND | BOUND`。

- `UNBOUND`：未绑定，只累计、暂不可领。签名设备主体解析到自身，Identity 没有账号或关联设备事实。
- `BOUND`：会话已验证；或签名设备主体解析为账号；或 Identity 提供 `account`/`linkedDevicePrincipalIds` 事实。只表示账号绑定，不承诺钱包绑定、领取资格或链上执行。

判定与 `pending`、积分余额、事件数量无关，每次读取重新取得 Identity 事实。Cookie 会话优先于设备认证；`me/points` 支持会话 Cookie 或 C-IDENTITY 设备签名。`me/ledger` 和 `me/balance` 当前仅用 Cookie 会话。
`createPointsContractExamples()` 同时提供未绑定零积分、已绑定零积分、未绑定累计和绑定转账后的示例。
零积分两例旧字段完全相同，状态不同。模拟端口返回显式场景，不根据积分推断绑定。

保留 `hanas`、`points`、`pending`、`breakdown`、`userPoints`、`pendingUserPoints`、`creatorReward`、`unclassified`、`totalPoints`、`subtotals` 的原单位和含义。读取的积分为 whole points（milli/1000）JSON number；三个写钩子的 `*Milli` 结果保持 milli 单位。
`points`/`totalPoints` 保留旧混合总量语义，用户积分、创作者奖励和未分类项分别展示；`pendingUserPoints` 逐来源分配和绑定后入账一致。

## HTTP 与服务端口

| HTTP | 输入与认证 | 输出/成功状态 |
|---|---|---|
| GET `/v1/custody/me/points` | Cookie 或设备签名，无 body | `OwnPointsDTO`，200 |
| GET `/v1/custody/me/ledger` | Cookie，可选 `after`/`limit` | `{items: OwnLedgerEntryDTO[]}`，200 |
| GET `/v1/custody/me/balance` | Cookie | `{balances: BalanceDTO[]}`，200 |
| GET `/v1/custody/hanas/:hanaId/summary` | `hanaId`，公开读取 | `HanaClaimSummaryDTO`，200 |
| POST `/v1/custody/launch-snapshots` | Cookie、允许的 Origin、application/json，body 严格为 `{requestId}` | `LaunchSnapshot`，201 |
| GET `/v1/custody/launch-snapshots/:requestId/entitlements` | Cookie、`requestId` | `BeneficiaryEntitlementView`，200 |

进程内调用保持提供方参数顺序：

```ts
service.recordUsagePoints(context, event); // UsagePointsEvent → UsagePointsResult
service.recordClaimCredit({principalId, hanaId, claimId}, context); // ClaimPointsResult
service.onDeviceBound(context, deviceId, principalId); // DeviceBoundResult
snapshots.admit(credentials, requestId); // LaunchSnapshot
snapshots.readEntitlements(credentials, requestId); // BeneficiaryEntitlementView
```

三写钩子使用宿主 `WriteContext.executor`；它不能序列化进请求 body。账本追加写，使用事件/认领/绑定幂等规则跟随提供方实现。
积分奖励和上限由宿主配置，本包示例数额没有默认政策含义。使用事件去重、同设备/Hana/UTC 小时计分及 upstream 同意/签名验证边界保留在提供方声明。

`CustodyErrorCode` 保留提供方全部既有错误；九个调用的主要错误集合见原样提取的 `POINTS_CONTRACT_DEFINITION.calls`，不是删除其他原有参数、权限、来源或配置检查。
`CustodyError` 保留 HTTP 状态与 `{error:{code,message,need?}}` 信封；`examples.errors` 覆盖每个调用声明错误。
例如认证失败 401，缺宿主事务 500，缺分配政策 503，支付未确认/快照或钱包冲突 409，快照不存在 404。
调用间用 `code` 匹配错误，不能假设提供方与本包有相同 `instanceof` 构造器。

## 快照与权益

发行 body 只提交 `requestId`，可信 `ConfirmedLaunch` 从宿主 admissions 端口取得；不接受浏览器自行声明的支付或权益。`LaunchSnapshot` 保留冻结发行事实、holder、分配政策、root/proof、opening、completion 与 outbox 标识。
`rootAuthorization` 来自 `acceptedAt` Unix 秒加 `rootAuthorizationValiditySeconds`。根提交有效期和领取期限是不同事实。

提供方 `points-contract-examples.json` 的旧快照漏了源码/声明必填的 `rootAuthorization`。共享 `examples.json` 保留该样例的其他冻结字段，按已有 `acceptedAt` 与 `launch.rootValidUntil` 反算显式夹具 validitySeconds 并补齐；这只是样例来源适配，未替提供方选默认值或改其行为。来源原始字节哈希与适配记录可查。

权益示例和 `entitlements.schema.json` 原样搬入，覆盖已绑定、待绑定和钱包冲突。只投影已认证主体自己的冻结权益、leaf/proof；ordinary 金额是该主体单一冻结钱包的累计 leaf，不编造逐 entitlement 金额。
零地址 pending reserved leaf 暂不可领；一账号多钱包或一钱包多账号的非法冻结输入拒绝为 `CUSTODY_WALLET_BINDING_CONFLICT`。
积分的 `bindingStatus` 与权益的 `bound/pending`、`claimable` 是不同字段，不能互相推导。

## 一致性夹具与证据范围

`createPointsProviderFixture(handlers)` 是最小可编程端口：记录调用并原样转发参数/宿主 context，缺 handler 明确报 `TypeError`。它不实现认证、奖励政策、事务持久化、proof 验证或链执行；没有隐式成功/奖励默认值。

```js
const examples = createPointsContractExamples();
const fixture = createPointsProviderFixture({
  getOwnPoints: async () => examples.unboundZero,
  recordUsagePoints: async (context, event) => examples.usage.result,
  readEntitlements: async () => examples.entitlements.pending.view
});
```

`schema.json` 只描述提供方 OwnPointsDTO 形状，无新增运行时拒绝规则。
`npm ci && npm test` 检查 Q-13/旧字段、JSON 示例/schema、写钩子参数顺序、错误信封、快照期限关系、权益 pending/隔离形状、来源哈希和独立 TypeScript 消费。
证据为 SOURCE/FIXTURE；REAL_DB、REAL_API、REAL_HOST、真实钱包/链和 owner ACCEPTED 不在本卡证据中，chain 保持 NOT_CONNECTED。

许可：HanaMesh server-custody · 0.2.0（卡片提交 bee5d82）· MIT · https://github.com/yzsnstotz/hanamesh-server-custody · 类型/错误/调用定义/示例来源。开源底座为 null，未引入新依赖。

## Q-50 · J4S3-APIC-18 增补

本次固定来源：J4S3-CUST-05 正式 main `c93e7a6efa0d080f0b481b8d4f2577fe78cbd33a`。
新增 `BeneficiaryViewExpected` / `BeneficiaryViewChecker` / `BeneficiaryValidationPort`：同步 `(view, expected) => string[]`，空数组为通过，保留任意未来失败 ID。expected 的 requestId/hanaId/token/batchId/principalId 必填且必须来自独立可信上下文。
类型均从提供方声明提取；没有运行时 `checkBeneficiaryView` 导出。实际函数由 `@hanamesh/server-custody` 根入口供应。

```ts
import {checkBeneficiaryView} from '@hanamesh/server-custody';
import type {BeneficiaryValidationPort} from '@hanamesh/api-contracts/points';
const port:BeneficiaryValidationPort = {checkBeneficiaryView};
```

失败规则为 SCHEMA、CONTEXT、POLICY_LABEL、ONE_WALLET、NO_PER_ENTITLEMENT_AMOUNT、PENDING_ZERO_ACCOUNT、BOUND_ACCOUNT、ISOLATION、CLAIMABLE、LEAF、PROOF，定义保持提供方顺序。重复 ID 去重，SCHEMA 失败立即返回。token/batchId 只将 expected 转小写。
ordinary/reserved 校验叶子及 proof；普通金额是钱包累计值，pending 预留零地址不可领。详细逐项规则和验证范围见 [提供方 API 原文](PROVIDER-HOST-API.md)。

该 checker 接受类型化 view：null/错误 schema 返回 ['SCHEMA']；正确 schema 下缺 expected/嵌套字段可抛 TypeError，非法 BigInt 可抛 SyntaxError，非法 ABI 值可抛 viem 错误。失败规则不是 CustodyError，也不被共享包转换为 boolean 或成功回退。通过不验证付款、RPC、当前余额或领取状态，且不是全部 schema 字段的运行时验证。

新增 `CustodyServiceDeps`、`CustodyStore`、`SnapshotServiceDeps`、`ConfirmedLaunchSource`、`SnapshotSetting`、`AllocationRemainderRule`、`ProductionAllocationSettings`、`ProductionAllocationPolicy`。已有 CustodyModuleOptions、CustodyService、SnapshotService、Signer、Chain、Summary、HTTP、账本、claim 和 C-UOW 导出保留。`ConfirmedLaunchSource.getConfirmedLaunch(input)` 无 context；admissions 端口的同名方法需要 WriteContext。
只供应依赖声明；createCustodyModule/createCustodyStore/createCustodyService/createSnapshotService/createProductionAllocationPolicy/createConfirmedLaunchAdmissions 等工厂由提供方拥有，不在本包导出。

具名设置沿用 provider：rootAuthorizationValiditySeconds 缺失/非正安全整数在快照构造时拒绝；allocationRemainderRule 缺失可构造，非零积分生产分配时拒绝；非法 source/allocate 在分配工厂拒绝。缺 allocation/source/mode/amounts/platformDust/reservedDust 使用 CUSTODY_ALLOCATION_POLICY_REQUIRED、503，need.input 指实际缺项；金额集合/预算/协议无效仍用 CUSTODY_ALLOCATION_INVALID。没有新错误码或默认政策。
SnapshotSetting 同时描述秒数与策略来源；readSettings 不凭空加入缺少读取端口的策略项。两个 dust 缺项分别报告。

```js
import {createBeneficiaryValidationExamples, createBeneficiaryValidationPortFixture,
  createSnapshotSettingsExamples} from '@hanamesh/api-contracts/points';
const vectors = createBeneficiaryValidationExamples();
// checker 必须显式由调用方提供：真实 provider checker 或明确测试场景。
const fixture = createBeneficiaryValidationPortFixture(checker);
const failures = fixture.port.checkBeneficiaryView(vectors.ordinary.view, vectors.ordinary.expected);
```

`beneficiary-validation-examples.json` 和 `snapshot-settings-examples.json` 从固定提交逐字复制；provider label 记录样例生成时的 SOURCE/FIXTURE，不表示本包执行了其算法。共享 helper 每次读出独立副本。最小 FIXTURE 仅注入并直接暴露同步 checker，缺 checker 抛 TypeError，原样保留失败数组与异常。它不实施校验、认证、持久化、分配、付款或链执行；旧 createPointsProviderFixture 接受范围保持不变。

`validation-provenance.json` 记录新 SHA、原始 blob 哈希、适配和发布字节；`provenance.json` 保留前次来源，并标明本次覆盖项由增补清单追溯。提供方 API 原文是固定 SHA 的归档说明，其中“等待发布”与 factory/fixture 的描述属于提供方，不能理解为共享包导出。
PACKAGE/FIXTURE 核验包括所有 exports、TS 正负例、确定性样例、显式 checker 转发及错误原样传播；固定 provider checker 的真实规则/异常向量另留运行目录证据。无 REAL_HOST、REAL_API、REAL_DB、资金/钱包/链或 owner ACCEPTED 证明。

许可：HanaMesh server-custody · 0.2.0 / c93e7a6e · MIT · https://github.com/yzsnstotz/hanamesh-server-custody · 公开声明/定义/文档/确定性示例。未新增依赖、开源底座或合约项目。
