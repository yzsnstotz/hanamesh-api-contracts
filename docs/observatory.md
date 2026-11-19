# 观测台只读数据契约（OB1 候选）

公开子路径：`@hanamesh/api-contracts/ops/observatory`。导出五类 DTO、模块贡献 DTO，及 draft-07 `OBSERVATORY_SCHEMA` / `OBSERVATORY_CONTRIBUTION_SCHEMA`。本包只声明结构，不拥有统计 SQL、任务清单、权限、缓存、作业或写操作。本候选未分配版本，未成为 Host 现行依赖。

依据：owner 2026-11-19 通过的 ops-v2；OB1 派单与 `questions/OB1-plan.md`。设计区块为收入、开支、人数、健康、关键参数。

## 可得性与来源

每个 metric 必须有稳定 `id` 与 `source`：`module`、公开 `port`、`definition`、`asOf`。`asOf` 是提供方事实截止水位，不是 Host 发起请求的时刻；未获取到水位为 null。Host 的 `generatedAt` 只描述组合响应时间。

- `available` 必须带 `value`。真实 0 正常保留。
- `pending` 必须带具名原因码，禁止携带 `value`，不能造 0、空数组或绿色健康冒充读数。
- `manual` 带手工登记值；未登记是 null。编排录入账单，DTO 不提供用户写入口。

管理员身份在资源端验证；AI 保留管理员 AND AI owner，不能由组合层绕过。模块失败只影响该模块声明的指标；不要把任意 Error.message、SQL、连接串、主体列表、审核输入或秘密参数写入 `reason`/公开文本。schema 禁止所有未声明字段，但不替代提供方的脱敏投影与权限检查。

## 口径与精度

- 时间为 UTC、RFC3339 的 Z 格式；窗口 `[from,to)`，提供方说明自然日、自然周或滚动窗口。部分日/发布滞后保留真实 asOf，不补造历史。
- 金额是最小单位整数字符串，附 currency、decimals；链上金额必须带 chainId、testnet/mainnet 和区块。法币 network=null。不同币种不相加，不在 Host 转换汇率；浮点不能承载链上整数。
- 收入 `accounting` 显式区分 revenue、custodial、asset。owner 认可的 Hana 专户 0.4% 为 custodial；平台储备为 asset。不能合并成平台收入。LP 的经济规则由 Chain 提供方解释，本契约不写一个永久零常量。
- 开支 `funding` 区分 cash、credit、chain；实际金额 `amounts` 与 `reserved`、`unknown` 分开。OpenAI 赠送额度不能计为现金开支，预算占用不等于已花。
- `people.unit` 区分人数、账号、设备、事件、插件、帖子、agent 和钱包。总人数由模块按 Identity canonical 去重，不能相加渠道分段或 DAU 得出 WAU。`breakdown` 可能重叠，`previousCount` 是相同口径的前窗口事实；比率保留分子分母，零分母 value=null。
- DAU/WAU 活跃动作遵循 ops-v2 的插件 use；自然周起点、未绑定设备是否能算“人”的口径见 OB1-plan，仍待 owner 追认，未写为计分规则。现有 Custody 30天数据使用原发布窗口，不擅改成自然月。
- `health` 保留 unknown；未知失败数、暂停状态、最近成功时间均可为 null。`attention` 是提供方给出的 owner/operations/none/unknown，不由 Host 猜阈值。失败次数需带窗口，不能把某页列表解释成全局失败数。
- 参数仅含公开值、单位、谁能改、当前运行/待重启/默认/待实现状态、人话含义与影响。没有 write URL、凭据或执行动作；默认值不能冒充线上运行值。

## 有界响应与模块贡献

模块自己导出 `ObservatoryContribution`，包含自身模块标识和五组指标；Host 只组合实际装配的贡献，不维护模块、指标或任务名单，不跨模块查表。提供方负责只读 SQL 聚合、日期/资产分页和真实规模性能；贡献不能在读取时发布读模型、补账、刷新外部身份、生成 AI 内容或发送交易。

容量是响应工程边界，不是业务规则：每区块最多128项（已确认设计33项指标+23个参数留出余量），每序列最多90桶（沿既有运营90天历史），每项最多32种资产/分段；长文本2048字符、说明原因512字符。超过容量必须由提供方明确分页或报缺项，不能静默截断。这些容量值随计划提请编排确认；不修改旧接口窗口，不限制真实用户数量。字符串与数组同时有界；接线验收仍须报告实际行数、UTF-8字节、32k目录及真实用户规模p95，不能以 schema 测试代替查询性能。生产返回不得携带演示数据。

本契约不选 HTTP 代理/认证桥部署方案。Host 原生 API 与 Web `/hm` 代理的接线需在 Host/Web 现行边界实施；Edge 社区、目录同步没有现成 Host 读口，不能伪装已接入。

## 验证与成熟依据

测试包含 Node test 的正反例、Ajv 8.20.0 严格 schema 编译和 TypeScript 判别联合约束。红测先提交，故意验证未实现子路径缺失；最终发布仍需完整门、独审、编排分配版本与正式合入，候选不等于已采用。

- [JSON Schema draft-07](https://json-schema.org/draft-07) 的 oneOf/required/additionalProperties 表达可得性互斥与封闭 DTO。
- [TypeScript discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions) 表达 pending 禁止值与 available 必须值。
- [PostgreSQL 17 date_trunc](https://www.postgresql.org/docs/17/functions-datetime.html) 的显式 UTC 分桶；[Mixpanel DAU/WAU](https://mixpanel.com/blog/daily-active-users/) 的窗口内活跃用户去重定义。

自造：五类指标、模块 source 与 availability 的业务 DTO 结构；没有可直接替代 HanaMesh 数据归属和会计分类的第三方协议。未新造读查询、权限或调度框架。
