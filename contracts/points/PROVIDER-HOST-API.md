# C-POINTS 提供方宿主组合 API · J4S3-CUST-05 / Q-50

来源：main `c7e05e51224cc1447515675d82c19312091f11ad`，保留既有行为。本页一次列明积分、认领、设备并账、P19 发行、P20 分发/权益和钱包组合所需本模块公开面，只描述端口、工厂签名和边界。未读取或运行宿主实现，本次是 **SOURCE / FIXTURE**，不是 REAL_HOST。

消费的已发布合约仍是 `@hanamesh/api-contracts` Git tag **v0.5.0**（锁定提交 `786a847652e5c66f2e264dd80129ee4b64aa316d`）：`/identity` 的 IdentityServices、SessionCredentials、DeviceAuthRequest，以及 `/uow` 的 WriteContext、UnitOfWork、SqlExecutor、SqlResult。该版本没有 `/points` 导出。新增提供方端口等待 **J4S3-APIC-18 从本卡正式 main 提取发布**；不能称为已发布共享合约。公开声明、定义和 FIXTURE 是提取入口，产品工厂、CustodyError 和校验实现仍由本模块提供。

## 确有缺失与保留面

| 公开面 | 基线状态 | 本次补齐 |
| --- | --- | --- |
| checkBeneficiaryView | 根入口已有同步函数，expected 内联 | BeneficiaryViewExpected、BeneficiaryViewChecker、BeneficiaryValidationPort、发布定义；函数体保留 |
| BeneficiaryEntitlementView 及关联 entry 类型 | 根入口及 server-contracts 已有 | 不重建 DTO，补供发布的 `/contract` 关联类型导出 |
| 模块配置与服务/存储注入 | CustodyModuleOptions 已有；CustodyServiceDeps/CustodyStore 未从根入口导出 | 重导出现有类型 |
| 独立 snapshot 工厂依赖 | 完整内联入参已存在 | 相同结构命名 SnapshotServiceDeps 并导出 |
| SnapshotService/策略/设置/Signer/Chain/Summary | 类型与实现已存在 | 不重建，只列实际签名和错误、补独立 FIXTURE |

`@hanamesh/server-custody` 根入口提供产品函数、类型、CustodyError；`/contracts` 是 DTO 声明，`/server-contracts` 是服务/基础设施端口声明，`/migrations` 提供 getCustodyMigrations，`/dev` 提供开发页工厂。`/contract` 提供发布定义、DTO/服务/快照类型及 FIXTURE，不提供产品工厂或校验算法副本。

## 受益人校验端口

```ts
interface BeneficiaryViewExpected {
  readonly requestId: string; readonly hanaId: string;
  readonly token: `0x${string}`; readonly batchId: `0x${string}`;
  readonly principalId: string;
}
type BeneficiaryViewChecker = (
  view: BeneficiaryEntitlementView, expected: BeneficiaryViewExpected,
) => string[];
interface BeneficiaryValidationPort {readonly checkBeneficiaryView: BeneficiaryViewChecker}
```

这些类型从根入口及 `/contract` 导出。函数从根入口导出：

```ts
import {checkBeneficiaryView} from '@hanamesh/server-custody';
import type {BeneficiaryValidationPort} from '@hanamesh/server-custody';
const port: BeneficiaryValidationPort = {checkBeneficiaryView};
```

同步返回**去重的失败规则 ID 数组**，`[]` 表示当前校验通过。保留 string[]，不改 boolean，不删校验或丢弃未来失败 ID。宿主须给独立可信 expected，不能用收到的 view 自证；requestId/hanaId/principalId 精确相等，比较 token/batchId 时只把 expected 转小写，view 保持提供方的小写编码。

BeneficiaryEntitlementView 原结构包含 schema、requestId/snapshotId/hanaId/principalId、chainId/token/hanaKey/batchId、policy、entitlements、ordinary、reserved、wallet、provenance。BeneficiaryEntitlement 只含 entitlementId/kind/status/route/account/walletBindingId；BeneficiaryOrdinaryEntry/BeneficiaryReservedEntry 含累计金额、leaf、proof、claimable。普通权益是同一冻结钱包累计 leaf，不拆造每项 entitlement 金额；pending 预留权益为零地址且不可领。

| 失败 ID | 实码规则 |
| --- | --- |
| SCHEMA | schema 为 hanamesh-beneficiary-entitlements-v1；失败立即仅返回此项 |
| CONTEXT | 五项 expected 与 view 匹配 |
| POLICY_LABEL | testOnly 等于 mode 是否为 test-only |
| ONE_WALLET | bound entitlement 最多一个不同 account，ordinary.entries 最多一项 |
| NO_PER_ENTITLEMENT_AMOUNT | entitlement 对象键恰好为原六项；缺项或多项都失败 |
| PENDING_ZERO_ACCOUNT | pending 的 route=reserved 且 account=零地址 |
| BOUND_ACCOUNT | 非 pending 的 route=ordinary 且 account 非零 |
| ISOLATION | 普通非零 account 属于视图 entitlement；预留 entitlementId 对应 pending entitlement |
| CLAIMABLE | 普通 claimable=true；预留 claimable 等于 account 是否非零 |
| LEAF | 普通 `(hanaKey,token,account,cumulativeAmount)` / 预留 `(batchId,token,entitlementId,account,cumulativeAmount)` 按原 P20 ABI 编码双哈希，与 leaf 相同 |
| PROOF | 排序哈希折叠 proof，等于对应 ordinary/reserved root |

多项失败按首次出现顺序返回，同一 ID 只出现一次。普通/预留 leaf 和 proof 均校验。它不验证 RPC、当前付款/余额/领取状态或全部 schema 字段；snapshotId、chainId、contract、nonce、opening 等不在其完整验证范围。实际提供方读口另保留权限、冻结钱包归属唯一性与当前 binding 对应校验；校验通过不代表链上领取成功。

**异常边界不变**：顶层 null/错误 schema 返回 `['SCHEMA']`。正确 schema 下缺 expected/嵌套字段可能抛 TypeError，金额/proof 无法转 BigInt 可能抛 SyntaxError，非法 ABI 值可能抛 viem 错误。函数接受类型化 view，不是任意 JSON 的总 schema 验证器；不吞异常、不转换 boolean、不制造成功回退。规则失败不是 CustodyError。

## 模块工厂、配置和服务注入

```ts
createCustodyModule(options: CustodyModuleOptions): CustodyModule
createCustodyStore(pool: SqlPool): CustodyStore
createCustodyService(deps: CustodyServiceDeps): CustodyService
createCustodyPlugin(service: CustodyService, origins: readonly string[], snapshots?: SnapshotService): FastifyPluginAsync
createSnapshotService(deps: SnapshotServiceDeps): SnapshotService
```

CustodyModuleOptions 必需 pool/identity/points/unitOfWork/executor/signer/allowedOrigins；可选 snapshots/claimSummaryProvider/withdrawEnabled/voucherTtlMs/outboxMaxAttempts/now/randomUUID。CustodyModule 返回 service/plugin、可选 snapshots、close():Promise<void>；close 不关闭调用方 pool，省略 snapshots 不构造快照服务。

CustodyIdentityPort 是 `Pick<IdentityServices,'authenticate'|'principalLinks'> & Partial<Pick<IdentityServices,'deviceAuth'>>`。principalLinks 仍要 bindDevice/resolveCanonical/listDevices；deviceAuth 存在时须含 authenticateDevice/getDevicePublicKey。SqlPool 继承已发布 SqlExecutor 并提供 connect():Promise<SqlConnection>，connection 提供 release():void。

CustodyServiceDeps 必需 store/identity/points/unitOfWork/executor/signer/withdrawEnabled/voucherTtlMs/outboxMaxAttempts/now/randomUUID，仅 claimSummaryProvider 可选。SnapshotServiceDeps 必需 pool/identity/unitOfWork/ports/now/randomUUID。所有设置由宿主显式配置，本页不建立金额、比例、奖励或网络默认值。

PointsPolicy 所有项必填：install/open/use/claimBonus/unboundCap 为积分值，useDailyMax 为计数，creatorMirrorBps 为基点。已有 normalizePointsPolicy(policy:PointsPolicy) 保留。工厂、错误类和校验逻辑由本模块拥有，宿主调用，不复制到宿主或共享包。

| CustodyService | 实际参数顺序 → 返回值 |
| --- | --- |
| recordUsagePoints | `(context:WriteContext,event:UsagePointsEvent) → Promise<UsagePointsResult>` |
| recordClaimCredit | `(event:{principalId:string;hanaId:string;claimId:string},context:WriteContext) → Promise<ClaimPointsResult>` |
| onDeviceBound | `(context:WriteContext,deviceId:string,principalId:string) → Promise<DeviceBoundResult>` |
| onClaimed | `(context:WriteContext,hanaId:string,principalId:string,sourceRef?:string) → Promise<ClaimPointsResult>` |
| getOwnPoints | `(credentials:SessionCredentials,device?:DeviceAuthRequest) → Promise<OwnPointsDTO>` |
| getHanaPoints | `(hanaId:string) → Promise<HanaPointsDTO>` |
| listOwnLedger | `(credentials,after?:string,limit?:number) → Promise<readonly OwnLedgerEntryDTO[]>` |
| listOwnPendingEvents | `(credentials,device?:DeviceAuthRequest,after?:string,limit?:number) → Promise<readonly PendingPointsEventDTO[]>` |
| listOwnBalances/listOwnIntents | `(credentials) → Promise<readonly BalanceDTO[]> / Promise<readonly IntentDTO[]>` |
| getHanaClaimSummary | `(hanaId:string) → Promise<HanaClaimSummaryDTO>` |
| issueWithdrawVoucher | `(credentials,input:{address:string;asset:string;amount:string;nonce?:string},context?:WriteContext) → Promise<WithdrawVoucher>` |
| verifyVoucher/verifyVoucherByNonce | `(voucher:WithdrawVoucher) / (nonce:string) → Promise<VoucherVerification>` |
| voidExpiredVouchers | `(now:Date,context?:WriteContext) → Promise<readonly string[]>` |
| runOutboxOnce | `(now:Date) → Promise<OutboxRunResult>` |
| getSigner | `() → {keyId:string;algorithm:'ed25519';publicKey:string}` |

上表 credentials 均为 SessionCredentials。跨模块写钩子要求合法宿主 WriteContext.executor.query；缺项抛 CUSTODY_HOST_TRANSACTION_REQUIRED，同一宿主事务用同一 executor。append-only ledger、幂等、回滚、claim/提现/outbox/HTTP 原语义与断言保留。

## SnapshotService、P19/P20 与钱包

| SnapshotService | 实际签名 |
| --- | --- |
| readSettings | `():SnapshotSettingsView`（宿主/管理员） |
| admit/readOwn | `(credentials:SessionCredentials,requestId:string):Promise<LaunchSnapshot>` |
| readForHost | `(requestId:string,context:WriteContext):Promise<LaunchSnapshot \| null>` |
| acknowledgeForHost | `(requestId:string,context:WriteContext):Promise<LaunchSnapshot>` |
| recordOpening | `(credentials:SessionCredentials,input:{requestId:string;transactionHash:Hex}):Promise<LaunchSnapshot>` |
| readEntitlements | `(credentials:SessionCredentials,requestId:string):Promise<BeneficiaryEntitlementView>` |
| listBeneficiarySnapshots | `(credentials:SessionCredentials):Promise<BeneficiarySnapshotDiscovery>` |
| readDistributionAcknowledgement | `(credentials:SessionCredentials,requestId:string):Promise<BeneficiaryDistributionAcknowledgement>` |

readOwn 是发行人权限。受益人读口由认证 canonical principal 和持久化冻结持有人关系决定，只读。readForHost/acknowledgeForHost 要宿主 context；后者从供给方读取分发结果，不接受调用者自报 receipt。分发回执不是用户领取回执或当前余额证明。

SnapshotPorts 必需 mode/settings/admissions/wallets/openings；allocation/confirmations 可选，相关写入口仍须配置：

```ts
admissions.getConfirmedLaunch(input:{requestId:string},context:WriteContext):Promise<ConfirmedLaunch|null>
wallets.getBinding(input:{principalId:string;chainId:number},context:WriteContext):Promise<WalletFact|null>
openings.getConfirmedOpening(input:{requestId:string;transactionHash:Hex},context:WriteContext):Promise<ReservedOpening|null>
confirmations.getResult(input:{requestId:string;snapshotId:string;outboxIntentId:string},context:WriteContext):Promise<DistributionConfirmation|null>

createConfirmedLaunchAdmissions(options:{mode:SnapshotPorts['mode'];expectedChainId:number;producer:ConfirmedLaunchSource}):SnapshotPorts['admissions']
ConfirmedLaunchSource.getConfirmedLaunch(input:{requestId:string}):Promise<ConfirmedLaunch|null>
```

ConfirmedLaunchSource producer 没有 context 入参，admissions 端口接受 context，这是已有适配器签名。它不制造 confirmedAt/receipt，拒绝含旧 rootValidUntil 的发行事实，源缺项错误保留 need 并转 CUSTODY_UNAVAILABLE。mode/expectedChainId 要显式提供。ConfirmedLaunch 无 rootValidUntil，FrozenLaunch 才含 Custody 在切点生成的该字段。

WalletFact 是 `{principalId,chainId,address,boundAt,source:'eoa-message-signature',deploymentId}`；已发布 Identity WalletBindingDTO 则有 proofMethod='siwe-eoa'，结构不同。宿主须适配真实已验证事实，不能仅用类型断言制造绑定证明。当前 binding 不改写冻结 leaf。

```ts
createProductionAllocationPolicy(settings?:ProductionAllocationSettings):ProductionAllocationPolicy
AllocationPolicyPort.allocate(input:{readonly launch:ConfirmedLaunch;readonly pMilli:string;readonly rMilli:string;readonly dMilli:string;readonly holders:readonly SnapshotHolder[]},context:WriteContext):Promise<PolicyAllocation>
AllocationPolicyPort.readSettings?():readonly SnapshotSetting[]
ProductionAllocationPolicy.readSettings():readonly SnapshotSetting[]
```

ProductionAllocationSettings.allocationRemainderRule 可选声明，但非零合格积分的生产 cut 实际必需。AllocationRemainderRule 为 `{source:string;allocate:AllocationPolicyPort['allocate']}`。PolicyAllocation 必需 source/mode/amounts（entitlementId/amount）/platformDust/reservedDust，金额为 token base units 十进制字符串。已有 PRODUCTION_ALLOCATION_POLICY 回读既有规则/来源；此处不重建配方或选择默认分配。

| 缺项 | 阶段与原有结果 |
| --- | --- |
| rootAuthorizationValiditySeconds 缺失/非正安全整数秒 | 快照工厂即抛 503 CUSTODY_ALLOCATION_POLICY_REQUIRED，need.input='rootAuthorizationValiditySeconds'；不启动事务 |
| allocationRemainderRule 缺失 | 工厂可构造，readSettings value=null；非零积分生产分配抛同一 503，need.input='allocationRemainderRule' |
| rule.source/rule.allocate 非法 | 分配工厂抛同一 503，分别点名 allocationRemainderRule.source / allocationRemainderRule.allocate |
| allocation 整体或 source/mode/amounts/platformDust/reservedDust 缺失 | admission 校验抛同一 503，need.input 点名实际缺项，两个 dust 分开报告 |
| 金额集合、预算或协议对应无效 | 保留 CUSTODY_ALLOCATION_INVALID，不都转换为缺项错误 |

SnapshotSettingsView 为 `{schema:'hanamesh-custody-snapshot-settings-v1',settings:readonly SnapshotSetting[]}`，每项 name/value/unit/required/default/scope/consequence，default=null。snapshots.readSettings 回读构造时捕获的设置与策略提供的设置；策略省略 readSettings 时不会凭空加入 remainder 项。validity 是根授权提交期限，不是权益领取窗口。缺项拒绝前不写 ledger/outbox/snapshot（事务控制或 SELECT 可已发生）。详细语义沿用 [SNAPSHOTS.md](SNAPSHOTS.md)。

## VoucherSigner、ChainExecutor、ClaimSummaryProvider

```ts
interface VoucherSigner {
  readonly keyId:string; readonly publicKey:string;
  sign(voucher:UnsignedWithdrawVoucher):string;
  verify(voucher:WithdrawVoucher):boolean;
}
createEd25519VoucherSigner(input:{privateKeyPkcs8Base64url:string;keyId:string}):VoucherSigner
canonicalVoucherPayload(voucher:UnsignedWithdrawVoucher):Buffer
interface ChainExecutor {
  submit(intent:ChainIntent):Promise<{chainRef:string}>;
  confirm(chainRef:string):Promise<{status:'pending'|'confirmed'|'failed';reason?:string}>;
}
// ChainIntent: {id:string;kind:'sponsored-launch'|'withdraw'|'points-distribution';payload:Readonly<Record<string,unknown>>}
interface ClaimSummaryProvider {
  read?(hanaId:string):Promise<{hanaId:string;assets:readonly {asset:string;claimable:string;claimed:string;unclaimed:string}[]}>;
  readOwner?(hanaId:string):Promise<{principalId:string}|null>;
}
```

sign/verify 是同步完整 voucher 签名/验证；publicKey 是 SPKI DER base64url，私钥输入是 PKCS8 DER base64url。这是提现 Ed25519 signer，不能当 P20 EIP-712 根授权 signer。ChainExecutor 不替代 SnapshotPorts.confirmations。这里只交付可编程 FakeChainExecutor（succeedAfter/failWith/hang），链执行 **NOT_CONNECTED**。Summary.read/readOwner 独立可选；缺 read 返回 NOT_CONNECTED + 空 assets，readOwner 只供归属读取；非法摘要保留 CUSTODY_SUMMARY_INVALID，不从账本造链金额。

## 确定性示例与独立最小 FIXTURE

`/contract` 导出 createBeneficiaryValidationFixture():Promise<BeneficiaryValidationFixture>，独立使用提供方 buildSnapshotDistribution、SnapshotService.readEntitlements、原 checkBeneficiaryView，组合已发布 C-UOW 夹具和最小 Identity/钱包模拟。无宿主、数据库、RPC；固定合成值构造持久化快照样本，**不是 admission/付款/资金证明**。返回 label/port/ordinary/reserved/snapshot/service/queries；ordinary/reserved 各含 view/expected。port 直接注入 `{checkBeneficiaryView}`，不复制算法。

完整确定性输出在 `examples/beneficiary-validation-examples.json`。同一钱包合并 principal/initiator，pending 预留 entry 不可领，两类均返回 []。既有 pointsContractExamples、snapshotSettingsExamples、createAllocationRemainderRuleFixture(source,allocate) 及 JSON 保留；可编程规则要求调用方显式给全部输出。test/beneficiary-port-types.ts 核验配置、服务/存储、快照、策略、summary、signer、chain 与已发布 Identity/UOW 类型兼容。

```ts
import {createBeneficiaryValidationFixture} from '@hanamesh/server-custody/contract';
const fixture = await createBeneficiaryValidationFixture();
const failedRules = fixture.port.checkBeneficiaryView(fixture.ordinary.view, fixture.ordinary.expected);
```

pnpm test 覆盖实际提供方普通/预留正确视图、全部旧失败 ID、五项 expected 串用、金额/leaf/proof 篡改、原异常边界。pnpm run test:contract 增加独立端口 FIXTURE，保留原积分/HTTP/宿主 executor/claim/snapshot 套件。全部证据限 SOURCE/FIXTURE；本卡无新 REAL_DB、REAL_API、REAL_HOST、SIGKILL 证明，不广播、不部署。
