# 观测台伴随契约

Train 3 的 API Contracts 0.31.0 增补两个可独立导入的出口。公开 manifest v2 继续由 `@hanamesh/api-contracts/host/ops-manifest` 提供，保留原三键和每页九字段。伴随契约随认证后的组合读取使用。

## 文本、访问和路由

从 `@hanamesh/api-contracts/host/ops-manifest/companions` 导入类型、schema 和 `OPS_COMPANION_LIMITS`。三个 schema 也按对应的 `texts.schema.json`、`access.schema.json`、`routes.schema.json` 子路径发布。

| DTO | 字段与用途 |
|---|---|
| `OpsTextPage` | `items` 每项含 `pageId` 和 `texts`。每条文本以 `key` 新增一组非空的 `zh/en/ja`。同页至多三键，以覆盖页面标题、描述与组标签。多个字段引用同一键时，发布该键一次。字段值按纯文本展示。 |
| `OpsAccessPage` | `items` 每项含 `pageId, actionId, scope, policyRevision, status, reason`。 `actionId=null` 代表该页的读权限。同一页的操作使用模块动作 ID 和作用域。 `allowed` 必须携带策略版本，其原因是 null。 `denied` 也须有策略版本，并携带稳定的原因码。 `unavailable` 须有原因码，失去策略供给时允许版本为 null。 |
| `OpsRoutePage` | `web-route` 声明实际可导航的 `href`。 `host-html` 同时给出 Host 的精确 GET `hostPath` 与浏览器确切的同源 `href`。路径分别按 `/ops/…` 和 `/hm/ops/…` 的精确段语法验证。 |

每份响应含独立的 `schema` 标识、配置 `revision`、`items`、`nextAfter`、`complete`、`missing`。三种伴随读以同一部署的同配置版本拼装，排序先按 `pageId`。访问结果的同页元素再按动作与 scope 稳定排序。页最多 200 项。Host 和 Web 必须在解析前对实际 UTF-8 响应执行 256 KiB 限制，并在超限时给出失败状态。生产方受同一序列化尺寸限制。公开 manifest 另有每项集合 512 的原上限与同一响应字节上限。

`nextAfter=null` 结束当前快照的分页。 `complete` 说明整个请求范围是否由具名供应方完整覆盖。完整响应的 `missing` 为空，缺口用至少一个代码表示。读取方必须拒绝过期游标或混用配置版本，并将游标和 actor、scope、过滤、排序及快照版本绑定。

拥有者和组合方以实际注册对象做跨数据集校验。页面 ID、原页面 href、文字键、组顺序应唯一且一致，策略 ID 应可解析，文本必须覆盖 manifest 所引用的键。Host HTML 的上游 `hostPath` 还应在已注册 GET 路径及代理清单内，其 `href` 必须对应实际代理绑定。Web 路由应存在于已装配入口。任何失配导致对应供应不可用。JSON Schema 验证结构与边界，模块和部署组合提供这些运行时事实。

`OpsAccessReadPort<Actor>` 描述受信的服务端 actor 投影。服务调用由 Host 装配及模块授权，页面 read allowed 后仍按资源重新鉴权，写操作还需同 actor、scope、策略和配置版本的成功管理读。认证后的响应使用私有不可缓存边界。Edge producer 摘要和委托入口仍需实际发布输入与批准，不在浏览器 DTO 携带会话、主体或权限凭据。

## 完整性与结算快照

从 `@hanamesh/api-contracts/ops/observatory/snapshots` 导入 `OpsCoverageSnapshot`、`OpsSettlementSnapshot` 及其 schema。两份 JSON schema 可分别按 `coverage.schema.json` 和 `settlement.schema.json` 子路径导入。

- 两者以 `source` 标示模块、端口和定义。 `scope` 明确部署及 module-owned `scopeId`，结算使用 `providerId`。 `requestedWindow`、`coveredWindow` 是 UTC 左闭右开的窗口。各端口校验实际日历和窗口顺序，并按其合同判断允许的跨度、已请求范围和已覆盖范围。统计默认窗口不超过 90 天，整账期按既有最长 92 天约束。
- `snapshotId`、`revision` 和源 `asOf` 标识已发布快照，缺发布时可为 null。完整或可续读的页必须具有窗口和全部快照定位字段。末页不能证明来源完整。拥有者用 `missing` 表示留存缺口、缺分片、源未装配、未发布或迟到撤回等实际原因。链上事实还提供同一部署范围内的 `chainAnchor`，包含 chainId、十进制区块高度、区块哈希、确认数及重组核验水位。来源判断实际水位有效性。
- `OpsSettlementSnapshot` 是 Usage 到 Router 的整账期元数据。 `acceptanceRevision` 绑定接受和撤回规则，完整快照要求提供该版本及整个 provider 账期的 `expectedRows`。合法完整空集需要有来源的零记录证明。各页按稳定行标识排序，复核归属、时间、快照、覆盖和总行数。Router 仅从受信供应取得行数据。旧单 Hana receipts 合同继续原样。此元数据不接受浏览器提供的 receipts，也不给提交结算的权限。

## 校验与采用

Wire schema 沿用现役 Ajv 8.20 的 JSON Schema draft-07。时间为本契约选定的 RFC 3339 UTC 子集，跨进程 JSON 采用 UTF-8。上述配置版本、三语关联规则、代理绑定、coverage 和结算字段来自 B2-K 与 Ops V3 的 HanaMesh 特定要求。 [JSON Schema draft-07](https://json-schema.org/draft-07/draft-handrews-json-schema-validation-01) · [RFC 3339 §5.6](https://www.rfc-editor.org/rfc/rfc3339#section-5.6) · [RFC 8259 §8.1](https://www.rfc-editor.org/rfc/rfc8259#section-8.1)

Host、Web 和模块采用此版本时要实际联合验证。需固定提供方声明与 Edge 摘要／委托、注册校验、两端 wire 验证、同快照跨页以及操作原地失败关闭。旧保留路由和旧 schema 独立使用，通过同一列车切换 manifest v2 消费。
