# ops-v3 指标 id 权威映射（映射版本 0.26.0，包候选 0.30.0）

权威结构化声明：[metrics.ops-v3.json](../contracts/ops/observatory/metrics.ops-v3.json)，公开包路径 `@hanamesh/api-contracts/ops/observatory/metrics.ops-v3.json`。以下33个根id逐一对应 owner确认的ops-v3登记表。JSON逐投影列出wire section、value类型与字段、来源模块/公开端口、缺口和可得性条件；本表只作索引，不是第二份运行注册表。

**这份映射不是Host名单。** 模块拥有并声明贡献，Host只组合实际注入端口；不能遍历此JSON创建模块、调用器、任务、权限或伪造pending来源。未声明/未接线的卡片按缺项显示pending；这份metadata中的null端口不能变成虚构的公开读口。第三方扩展id继续允许，schema不把33个根id变成全局白名单。

一个根id有多个投影时，它是展示分组，不另造根value。消费表中精确子id；`<taskId>`等变量来自提供方实际声明，不能从Host任务名单、英文标签或路径推导。设计区块与wire section分别列出：例如`hl.safe`属于健康卡，但有类型的Safe参数保留在parameters；`hl.vec`的覆盖人数/暂停事实分处people/health。`hl.ai`则有专门的health数量投影，不能塞进failures或reason。

`pending`是未获事实的默认基线。`published`只说明公开端口存在，不表示Host已经配置、鉴权或采用；实际读数成功才available。没有累计/有界读口即使明细存在也仍pending。手工账单无记录为manual/null。所有金额保持原币种/精度/网络，所有去重、并集、分组、累计都由数据拥有模块给出；Host不算汇率、不相加DAU/渠道，不把当前页替代总数。

| 设计根id | 指标 | 设计区块 | wire section / value类型 | 精确投影id / 来源 | 未获事实时 |
|---|---|---|---|---|---|
| `rev.launch` | 发币手续费 | income | income / ObservatoryIncome | `rev.launch` → custody.未供给有界端口 | pending |
| `rev.mesh` | 曲线交易费·平台0.6% | income | income / ObservatoryIncome | `rev.mesh` → registry.未供给有界端口 | pending |
| `rev.split` | 服务商结算·平台分成 | income | income / ObservatoryIncome | `rev.split` → revenue-router.未供给有界端口 | pending |
| `rev.hana` | 曲线交易费·Hana专户代管0.4% | income | income / ObservatoryIncome | `rev.hana` → registry.未供给有界端口 | pending |
| `rev.protocolFee` | HanaSwap协议费0.05% | income | income / ObservatoryIncome | `rev.protocolFee` → chain.readPositions | pending |
| `rev.reserve` | 平台储备代币·资产 | income | income / ObservatoryIncome | `rev.reserve` → registry.未供给有界端口 | pending |
| `rev.fiat` | 法币收入 | income | income / ObservatoryIncome | `rev.fiat` → 未实现模块.未供给有界端口 | pending |
| `exp.ai` | OpenAI本月花费及硬顶 | spending | spending / ObservatorySpending; parameters / ObservatoryParameter | `exp.ai` → ai.budgetSnapshot/usageSummary; `exp.ai.limit` → ai.budgetSnapshot | pending |
| `exp.ai.use` | OpenAI按用途拆分 | spending | spending / ObservatorySpending | `exp.ai.use.<providerCategoryId>` → ai.未供给有界端口 | pending |
| `exp.server` | 服务器与第三方服务账单 | spending | spending / ObservatorySpending | `exp.server.<recordId>` → host.readManualCosts | manual |
| `exp.gas` | 平台地址支付的gas | spending | spending / ObservatorySpending | `exp.gas` → chain.未供给有界端口; `exp.gas.receipts` → chain.readPlatformGasReceipts | pending |
| `ppl.reg` | 注册账号 | people | people / ObservatoryPeople | `ppl.reg` → identity.未供给有界端口 | pending |
| `ppl.30d` | 30天用过插件的人 | people | people / ObservatoryPeople | `ppl.30d` → custody.readScopedPopularity; `ppl.30d.<channelId>` → custody.readScopedPopularity | pending |
| `ppl.dau` | 插件日活与自然周活 | people | people / ObservatoryPeople | `ppl.dau.day` → custody.readActivePeopleStats; `ppl.dau.week` → custody.readActivePeopleStats | pending |
| `ppl.dev` | 登记设备与未绑定设备 | people | people / ObservatoryPeople | `ppl.dev.total` → identity.未供给有界端口; `ppl.dev.unbound` → identity.未供给有界端口 | pending |
| `svc.install` | 插件安装次数 | people | people / ObservatoryPeople | `svc.install` → usage.readMetrics | pending |
| `svc.install.p` | 近7天插件安装人数 | people | people / ObservatoryPeople | `svc.install.p` → custody.readActivePeopleStats | pending |
| `svc.uses` | 近7天插件使用次数与前期对比 | people | people / ObservatoryPeople | `svc.uses` → custody.readScopedPopularity | pending |
| `svc.search` | 搜索次数与无结果率 | people | people / ObservatoryPeople | `svc.search.keyword` → host.readSearchAnalytics; `svc.search.semantic` → host.readSearchAnalytics | pending |
| `svc.ai` | AI展示与点击次数 | people | people / ObservatoryPeople | `svc.ai.display.<taskId>` → ai.usageSummary; `svc.ai.click.<taskId>` → ai.usageSummary | pending |
| `svc.issue` | 已发币插件数 | people | people / ObservatoryPeople | `svc.issue` → registry.未供给有界端口 | pending |
| `svc.issue.p` | 发币人数与交易人数 | people | people / ObservatoryPeople | `svc.issue.p.issuers` → registry.未供给有界端口; `svc.issue.p.traders` → registry.未供给有界端口 | pending |
| `svc.points` | 积分与成功空投领取 | people | people / ObservatoryPeople | `svc.points.positive` → custody.readPointsStats; `svc.points.claimants` → custody.readPointsStats; `svc.points.claims` → custody.readPointsStats | pending |
| `svc.comm` | 社区帖子、作者与今日帖子 | people | people / ObservatoryPeople | `svc.comm.posts` → community-site.GET /hm/community-site/stats; `svc.comm.authors` → community-site.GET /hm/community-site/stats; `svc.comm.today` → community-site.GET /hm/community-site/stats | pending |
| `svc.claim` | 作者认领率 | people | people / ObservatoryPeople | `svc.claim` → registry.未供给有界端口 | pending |
| `svc.agent` | 注册agent与已认领agent | people | people / ObservatoryPeople | `svc.agent.total` → identity.未供给有界端口; `svc.agent.claimed` → identity.未供给有界端口 | pending |
| `hl.ai` | AI全账期待批计划 | health | health / ObservatoryAiPendingCountValue | `hl.ai` → ai.readPendingCount | pending |
| `hl.self` | AI自检暂停 | health | health / ObservatoryHealth | `hl.self` → ai.selfCheckSnapshot | pending |
| `hl.vec` | 语义两代覆盖与暂停 | health | people / ObservatoryPeople; health / ObservatoryHealth | `hl.vec.coverage.<generationId>` → host.SemanticGenerationRuntime.readObservatory; `hl.vec.pause.<generationId>` → host.SemanticGenerationRuntime.readObservatory | pending |
| `hl.sync` | 目录同步最近跳过 | health | people / ObservatoryPeople | `hl.sync.lastSkipped` → catalog-sync.GET /hm/v1/ops/catalog-sync | pending |
| `hl.idx` | 来源摄取健康 | health | health / ObservatoryHealth | `hl.idx.<providerSourceId>` → indexer.未供给有界端口 | pending |
| `hl.safe` | 平台Safe签名门限 | health | parameters / ObservatoryParameter | `hl.safe` → chain.readPlatformSafeStats | pending |
| `hl.all` | 实际注册作业结果历史 | health | health / ObservatoryHealth | `hl.all` → host.readJobResultHistory | pending |

## 聚合字段与子项的读取规则

JSON的每个`projections[].fields`是该value的结构说明，类型定义是`index.d.ts`，响应与贡献schema保持封闭：

- `rev.*`：`ObservatoryIncome{accounting,amounts,window?,series?,protocolFees?}`；代管、资产与收入分开。`rev.protocolFee`的LP页是持仓/未铸/可提取资产，不称累计现金收入。
- `exp.ai`的actual/reserved/unknown分别是`amounts/reserved/unknown`；硬顶单列`exp.ai.limit`参数。全局/设计五类用途聚合尚缺模块声明时保持pending，不由Host汇总14任务。`exp.gas.receipts`只是显式hash辅助页，不能把根`exp.gas`的全平台日账单变成available。
- `ppl.dau.day/week`：各自`unit=people,count,window,series`，本周count必须是模块独立union，不能sum(day)。`svc.install.p`是**7个完整UTC日**的独立安装人数并集，查询`action=install`；不是90天或累计装过人数。不同时间/渠道的匿名活跃设备仍是devices扩展项，不替代`ppl.dev`的全部登记/未绑定设备。
- `ppl.dev.total/unbound`、`svc.issue.p.issuers/traders`、`svc.points.positive/claimants/claims`、`svc.comm.posts/authors/today`、`svc.agent.total/claimed`分别按JSON列出的unit/count/window给出；不能将混合单位塞进breakdown，不能由金额/钱包/凭证推人数或次数。没有原始事实的项pending。
- `svc.search.keyword/semantic`各自保留搜索次数与无结果比率分子/分母；`svc.ai.display/click.<taskId>`只读模块给出的事件次数。`ppl.30d`是独立总数，`ppl.30d.<channelId>`是可重叠渠道数，不能相加。
- `hl.all.value.jobHistory.jobs[]`给实际注册instance/module/job的last-ever成功/失败、独立失败窗口、最近N、coverage和activity。它不是模块名单或全站绿色总分。`hl.self.<taskId>`只投影模块暂停；`hl.idx.<providerSourceId>`没有有界健康供给前pending，不用一页runs推全站成功。`hl.sync.lastSkipped`是最新轮事件数，不是累计失败数。

## 对应示例（FIXTURE，非默认运营数据）

真实0且来源可证明的AI全局待批：
```json
{"id":"hl.ai","availability":"available","source":{"module":"ai","port":"readPendingCount","definition":"All persisted status=pending reviews across all months; PostgreSQL statement snapshot.","asOf":"2026-11-19T00:00:00.000Z"},"value":{"pendingCount":0}}
```
管理员缺AI owner权限时，没有数量：
```json
{"id":"hl.ai","availability":"pending","reason":"AI_OWNER_REQUIRED","source":{"module":"ai","port":"readPendingCount","definition":"All persisted status=pending reviews across all months; PostgreSQL statement snapshot.","asOf":null}}
```
渠道独立总量和自然周投影分别使用自己的id/来源/availability；以下值只是fixture：
```json
{"id":"ppl.30d","availability":"available","source":{"module":"custody","port":"readScopedPopularity","definition":"Plugin-scope users30d; channel totals independently deduplicated.","asOf":"2026-11-19T00:00:00.000Z"},"value":{"unit":"people","count":0,"series":[]}}
```
```json
{"id":"ppl.dau.week","availability":"pending","reason":"CUSTODY_ACTIVE_PEOPLE_DATE_NOT_MATERIALIZED_OR_PARTIAL_BOUNDARY","source":{"module":"custody","port":"readActivePeopleStats","definition":"UTC Monday-start independent canonical use union; real provider coverage required.","asOf":null}}
```
未登记账单的手工记录（recordId由可信配置声明；不生成示例账单）：
```json
{"id":"exp.server.fixture-record","availability":"manual","source":{"module":"host","port":"readManualCosts","definition":"Manually recorded invoice; absent value is not zero expense.","asOf":null},"value":null}
```

以上例子是序列化形状，不是模块安装、权限授予、数据回填或已完成Host接线的证明。
