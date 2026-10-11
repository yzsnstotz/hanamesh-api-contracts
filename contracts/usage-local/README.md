# C-USAGE-LOCAL · Q-18 跨客户端同事实投递（J1S4-APIC-13，v0.12.0）

提供方：hanamesh-usage J1S4-USAGE-02，main `6f724fced6048539cc2e62d549b769091232449a`（Usage 0.2.0-rc.22）：
`src/host/record.js`、`src/core/identity.ts`（`eventIdForSeat`、`eventNonceForSeat`）、`src/host/contracts.d.ts`、
`docs/contracts/usage-local-q18.md`、`test/fixtures/usage-local-q18.mjs`。本合约只跟随该提供方，不改冻结的 UUIDv5 与冲突语义。

## 唯一的形状变化：`occurredAt` 必填

| 版本 | `RecordInput.occurredAt` |
|---|---|
| ≤ v0.11.0 | 可选，缺省为 record 时刻 now |
| v0.12.0 | **必填**，原事实的 UTC 毫秒 ISO 时间（`Date#toISOString`），过去 90 天至未来 5 分钟；缺省或非字符串返回既有 `INVALID_RECORD_INPUT` |

只收窄、不扩大输入接受范围：其余字段、结果、错误码集合、health 形状不变。
提供方先检查同意（无同意 `withheld`），再查设备（`DEVICE_UNAVAILABLE`），然后才查时间。
消费方（app-host）升级到本 tag 前必须让每个来源提供原事实时间；不能用接收时刻或 record 时刻代填。

## 输入保证（同一真实事实）

| 字段 | 同一事实的每次投递（任何客户端、任何重送） |
|---|---|
| `sourcePlugin` | 相同，来源稳定包名 |
| `idempotencyKey` | 相同，来源真实事实的稳定键，例：命令 `command:<原commandId>:succeeded`；页面为本次真实呈现的稳定凭据摘要 |
| `occurredAt` | 相同，事实源给出的原始时间 |
| `hanaRef`、`action`、`sourceHanaRef`、`targetRef`、`receipt` | 相同 |

两次独立执行/打开是**不同事实**，用不同键，即使同页面、同时间也不得合并。
来源给不出稳定键或原始时间就是输入缺口：返回 `INVALID_RECORD_INPUT`，不用客户端名或接收时间猜。

## 稳定事件与冲突

- `eventId = UUIDv5(USAGE_EVENT_NAMESPACE, JSON.stringify([deviceId, sourcePlugin, idempotencyKey]))`，未改。
- 同一 OS 用户同一共享根（C-CORE 共享身份）下，两个独立缓冲对同一事实得到同 `eventId`、同事件 nonce、同 C-USAGE 摘要：
  服务端首次 accepted，第二次 duplicate，贡献计 1。
- 不同设备或不同键 → 不同 `eventId`，各自 accepted。
- 同键任一内容不同（action、occurredAt、hanaRef、归因、receipt）：同一缓冲内 `EVENT_IDENTITY_CONFLICT`；
  跨独立缓冲时各自本地 recorded，服务端对后到者给 `USAGE_EVENT_CONFLICT`（C-USAGE 判定顺序：同 id 同摘要 duplicate，同 id 不同摘要 conflict）。不合并。
- 服务端去重受其原始记录保留期与撤回限制，不承诺永久去重。

## 两种 nonce

| | 事件级 nonce | HTTP 请求 nonce |
|---|---|---|
| 位置 | 事件 payload `nonce`，进入 C-USAGE 摘要与六键事件签名 | 请求头 `x-hm-nonce` 及时间戳，进入 HTTP 请求签名 |
| 生成 | `"n" + base64url(SHA256(UTF-8 JSON.stringify(["hanamesh-usage:seat-event-nonce:v1", eventId])))`；`usageRecordEventNonce(eventId)` | 每次上传请求由 `Core.signRequest` 重新生成并签名 |
| 重送/重启/丢回执 | 保留原值（与原 payload 一起重传） | 每次都新的 |
| 性质 | 唯一性 token，不要求随机；不同 eventId 不共用 | 防重放认证 |
| 改动后果 | 同 id 改 nonce → 摘要变 → `USAGE_EVENT_CONFLICT`；不同 id 复用 → `USAGE_NONCE_REUSED` | 不影响 duplicate/conflict |

## 示例与最小替身

- `createUsageLocalProviderFixture()`：缺 `occurredAt` 返回 `INVALID_RECORD_INPUT`；新增 `uploadEvents()` 返回已记录事件的未签名上传投影
  （提供方 `wireEvent` 去掉 `signature`），nonce 与提供方一致。替身不签名、不上传、不存盘。
- `createUsageLocalCrossClientExamples()`：同一合成共享设备 `USAGE_LOCAL_SHARED_DEVICE_FIXTURE` 上两个独立缓冲：
  `duplicateFact`（同摘要，accepted/duplicate）、`differentOperation`（不同键）、`differentDevice`、
  `timeMismatchConflict`（同 id 不同摘要，accepted/USAGE_EVENT_CONFLICT）、`sameBuffer`（重送 duplicate、同缓冲时间不一致 `EVENT_IDENTITY_CONFLICT`）、
  `missingOccurredAt`。`server` 一栏是用 C-USAGE `eventDigest` 与其判定顺序推出的结果，不是真实服务端调用。
- `USAGE_LOCAL_DELIVERY_RULES`（亦在 `USAGE_LOCAL_CONTRACT_DEFINITION.methods.record.delivery`）是上述规则的文字版。

测试固定了一组用提供方 `6f724fc` 的 `lib/core/identity.js` 算出的 eventId/nonce 向量。

## 证据范围

SOURCE / FIXTURE / TYPE：提供方源码与合成宿主测试、C-CORE 共享身份夹具、C-USAGE 最小替身、本包示例与 schema。
**不是** REAL_SERVER、REAL_CORE 文件系统、REAL_HOST、双客户端 UI 或 owner 验收；真实来源跨客户端投递仍是后续门。
