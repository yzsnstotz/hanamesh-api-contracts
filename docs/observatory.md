# 观测台只读数据契约（OB1 候选）

公开子路径：`@hanamesh/api-contracts/ops/observatory`。导出五类 DTO、模块贡献 DTO，及 draft-07 `OBSERVATORY_SCHEMA` / `OBSERVATORY_CONTRIBUTION_SCHEMA`。本包只声明结构，不拥有统计 SQL、任务清单、权限、缓存、作业或写操作。本观测契约沿正式 v0.26.0 基点保留；当前包候选为 **0.30.0**，沿用发现/localized-v2并新增本人发行读口，不改变观测接口。本候选尚未合入/tag/发布，也未成为 Host 现行依赖。

依据：owner 2026-11-19 通过、按协议费更正后的 ops-v3；OB1 派单与 `questions/OB1-plan.md`。设计区块为收入、开支、人数、健康、关键参数。

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

测试包含 Node test 的正反例、Ajv 8.20.0 严格 schema 编译和 TypeScript 判别联合约束。红测先提交，故意验证未实现子路径缺失；最终发布仍需完整门、独审、正式合入/tag与发布，候选不等于已采用。

- [JSON Schema draft-07](https://json-schema.org/draft-07) 的 oneOf/required/additionalProperties 表达可得性互斥与封闭 DTO。
- [TypeScript discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions) 表达 pending 禁止值与 available 必须值。
- [PostgreSQL 17 date_trunc](https://www.postgresql.org/docs/17/functions-datetime.html) 的显式 UTC 分桶；[Mixpanel DAU/WAU](https://mixpanel.com/blog/daily-active-users/) 的窗口内活跃用户去重定义。

自造：五类指标、模块 source 与 availability 的业务 DTO 结构；没有可直接替代 HanaMesh 数据归属和会计分类的第三方协议。未新造读查询、权限或调度框架。

## 编排11-19更正：协议手续费（feeTo，0.05%）

收入科目采用 **协议手续费（feeTo，0.05%）**，替换设计稿中的“LP手续费/结构性为0”。HanaSwap为自部署Uniswap V2 fork：迁池LP铸给零地址，不会阻止Pair的`_mintFee`向Factory的`feeTo`另铸协议LP。按编排确认，0.3%的1/6展示为0.05%；只读接口不设置开关或签交易，是否开启由owner另定。

`ObservatoryIncome.protocolFees` 承载协议LP持仓页；`ObservatoryParameter.protocolFee` 承载真实Factory开关与修改权限。`ObservatoryProtocolFeeSettings` 必含factory、feeTo、feeToSetter、platformWallet、enabled、platformIsRecipient、rateBps=5和实际network/区块。feeToSetter是链上“谁能改”的实际地址，不推测它就是Safe/owner；feeTo零地址表示新费关闭，已有LP仍正常读取。没有实现/读失败时原metric仍pending，不能回到“结构性零收入”。

`ObservatoryProtocolFeePosition` 区分lpBalance（已持有）、totalSupply（链上总供给）、unmintedProtocolLp（下一次mint/burn才可能铸出的协议LP）和withdrawalSupply（铸费后的估算供给）；share是已持有LP占该供给的整数分子/分母。withdrawable严格两项，分别为两种底层资产的最小单位数量；网络、精度与区块保留，不自造美元价格。所有数值同一确认区块；pool页只覆盖明确选中的最多64个池（沿现有只读RPC批量容量），scope固定explicit-pool-page，不冒充全平台总计。

估值由Chain拥有：V2以reserves/kLast计算下一次mint/burn的待铸费LP；已持有LP提取量按Pair实际token余额×已持有LP/铸费后的总供给向下取整。未铸费LP不并入lpBalance；feeTo不是平台地址时也不把待铸费LP说成平台已持有。当前持仓/底层资产估值不是已实现现金，balanceOf本身也不是累计协议铸币来源的事件账。若以后显示累计已赚，需归属模块的事件归因读模型。

依据：[Uniswap费用说明](https://developers.uniswap.org/docs/get-started/concepts/fees)；HanaSwap冻结源码`core/contracts/UniswapV2Factory.sol`的feeTo/feeToSetter与`UniswapV2Pair.sol`的_mintFee、burn；估值对照periphery `UniswapV2LiquidityMathLibrary.computeLiquidityValue`，提取底层采用Pair.burn实际余额口径。来源、可得性与模块权限沿本页原规则，不能由Host复制该公式或扫描32k池目录。

## Server composition registration (0.26.0)

`ObservatoryReadPort` carries a module-owned `declaration` plus an optional read-only `read(context)`. Context has server-authenticated principal/cookie and UTC request cutoff `at`; it is not a client principal override. A declaration contains only pending metrics (or manual values still null); it declares stable IDs, sections, source ports and definitions. Host rejects duplicate metric IDs or aggregate capacity beyond the response schema. Each read must return the same IDs/sections/module/source port/definition; only value, availability, reason and source watermark can change. This prevents a failed provider from removing its cards or replacing another module's facts. An absent reader retains the declared pending state. Providers must enforce stricter resource policy before reading (for example AI owner), implement bounded reads, and perform no refresh, cache write or paid execution on this path.

Host composes the supplied list generically; module-specific metric/task/permission registries remain with providers. HTTP adapter is `GET /hm/v1/ops/observatory` at the website gateway (`/v1/ops/observatory` within Host), with existing Identity authentication plus ops-admin authorization, no request query/body fields, no-store responses and source-local degradation. Request cutoff is not a common database snapshot and never substitutes for an unknown source watermark.

## N9 Host-owned job result history

`ObservatoryHealth.jobHistory` exposes actual registered jobs for one Host instance. Each job has its own source/availability, public declaration, real last-ever success/failure timestamps, latest completed result, explicit failure window, coverage start and at most100 recent finalized runs (default20). Result recordedAt is the Host observation/completion time; persistedAt is the database write time, and raw terminal report receipt times are retained separately. queued/started/progress are not successful runs; skipped is separate and never implies paused. A mixed skipped+ok invocation remains one finalized run. A reported failure plus a throw is one failure.

No history means pending/unknown with null timestamps/count/window, not a green registration heartbeat. failureWindow is clipped to the real uninterrupted coverage start, including new worker registration or an acknowledged write gap, and never pretends to cover the prior90days. lastSuccessAt/lastFailureAt retain last-ever meaning independently of the window or recent list. source.module is host; moduleId/jobName identify business ownership. AI-restricted result facts keep the existing owner gate in addition to the Host administrator gate. Only public static code/reason fields are persisted; no exception, stack, actor, prompt, environment or connection data.

`job.activity` optionally projects the existing Host liveness snapshot (queued/running, heartbeat/progress and its own asOf), separately from persisted completion history. Progress never increments failure/success, refreshes lastSuccessAt or replaces the result watermark. A matching Host history-write failure makes the history contribution pending; it is not relabeled a module failure.

## Chain0.43.0 composition

Parameter.platformSafe carries actual Safe address, owner count and threshold at the confirmed network block, block hash and evidence. It contains no owner list or invented health judgment. Spending.gasReceipts carries an explicit known-transaction page (at most64), including pending/missing facts, actual payer/platformPaid, reverted status and exact integer wei. It is not a complete-history/daily total: amounts remains empty when only a receipt page is known; owning-module aggregate contributions remain pending. External-payer receipts remain factual and are not platform expenditure. Existing feeTo/protocolFees fields retain explicit-pool-page and separate held/unminted LP. All source watermarks remain Chain block times. No new UI, scan, rate, FX or accounting aggregation.

N9 的 `healthIntervalMs` 沿实际公开声明；只有 cron 而未声明健康间隔的作业返回 null，并保留原 cron/timezone，不能推测间隔或据此变绿。作业原始身份允许下划线（如 AI 的 `search_miss_weekly`）。

## ops-v3稳定id与N10类型化投影（R429）

全部33项的权威映射、聚合子id、wire区块/value结构/来源及pending缺口见[ops-v3指标映射](observatory-ops-v3.md)与公开`metrics.ops-v3.json`。模块声明其贡献，Host只组合；不能把这份设计映射变成Host硬编码名单。扩展id继续开放。旧测试中的`plugins.users30d`等是泛型扩展fixture，不是设计id的别名；产品卡片按映射采用`ppl.30d`等精确id。

`hl.ai`使用`ObservatoryAiPendingCountMetric`，value为封闭`ObservatoryAiPendingCountValue{pendingCount:number}`，不是通用失败/健康统计。它将AI0.7.0 `AiPendingCountSnapshot`投影为`{id:'hl.ai',source:snapshot.source,availability:snapshot.availability,value:{pendingCount:snapshot.pendingCount}}`；保留模块的全账期全局计数和真实PG语句水位，不从当前review列表取length。来源固定为AI公开`readPendingCount`，调用必须经过`createAiOpsReader`的既有管理员AND AI owner双guard；本包不计算权限、不复制owner名单、不运行reader。

数量是非负安全整数，available的0表示确实没有未决计划；没有配置、无owner或来源失败时是pending+reason且没有value，不能伪造0。此指标不接受manual、不接受generic health/failures/reason中的文本数字，不根据pendingCount自行设置健康、失败或暂停。未知来源水位仍null，Host generatedAt不替代它。其他提供方的开放health id和N9结构保持原契约；新增专用schema分支不放宽原additionalProperties约束。
