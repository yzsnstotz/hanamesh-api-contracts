# Provider 契约

## EmbeddingProvider

公开接口：`embedDocument(texts)`、`embedQuery(texts)`；返回 `vectors`、`model` 与 token 数。默认 Voyage 配置：

- 文档：`voyage-4-large`，`input_type=document`。
- 查询：`voyage-4-lite`，`input_type=query`。
- 两者都固定 `output_dimension=1024`、`output_dtype=float`，4 系列向量空间兼容。
- 单批最多 128 条，15 秒超时；429/5xx 从 250 ms 开始指数退避，最多 3 次重试。
- key 只从宿主传入 `SEMANTIC_VOYAGE_API_KEY`；模块不记录请求 headers、body、query 原文或 key。

STUB 使用文本 sha256 扩展为确定性 1024 维单位向量；仅用于测试与用户明确接受的无 key 环境，不等于 REAL_VOYAGE。

官方来源：[Embeddings](https://docs.voyageai.com/docs/embeddings)、[Pricing](https://docs.voyageai.com/docs/pricing)。2026-09-20 读取时，4 系列默认 1024 维；`voyage-4-large` / `voyage-4-lite` 公开价分别为 $0.12 / $0.02 每百万 tokens，账号免费额度以控制台为准。

2026-09-20 当前项目面板显示 `voyage-4-large` 与 `voyage-4-lite` 各为 10,000 TPM / 3 RPM。REAL_VOYAGE 因此从公开 awesome 目录选择 100 个最短的完整归一化 profile（未截字段），文档批实际 5600 tokens；限流是账号/项目配置，不能硬编码为产品默认。

## 成本估算（G-06）

仅作量级估算：12,140 条 × 600 tokens/条 = 7.284M 文档 tokens；按公开价毛成本约 `$0.87408`，若账号仍有足够免费 tokens 则控制台实付可能为 `$0`。每次 100-token query 的 embedding 毛成本约 `$0.000002`。

2026-09-20 的 20 条 REAL_JEV 运行共有 133,818 input tokens、16,648 output tokens；按 TypeSafe 当前公开的 `$0.042 / 1M input tokens`，input 毛成本约 `$0.00562036`。output 计价未在本次读取的公开页明确，因此不猜测总价。用户未给成本或质量阈值，只报数，阈值待定。

## DecisionProvider

`JevDecisionProvider` 按 TypeSafe System One 官方契约实现：

- `POST https://api.typesafe.ai/v1/systemone`，`Authorization: Bearer <server-only key>`，`Content-Type: application/json`。
- model 固定为 `jev-latest`；请求为 `{state, model, questions}`，其中 `selection` 是闭集 `choice` question。
- `criteria` 只包含本次 Top-K 的 `objectId`，并额外加入 `__no_match__`；默认最多 20，provider 自身也拒绝越界数组。
- `state` 只含原始任务、context、constraints、policy 与候选安全摘要；不含价格、market cap 或 token 字段。
- 响应只接受 `answers.selection.{type,choice,probabilities,confidence}` 与 `usage.{input_tokens,output_tokens}`；choice 必须属于本次候选或 `__no_match__`，概率键必须与闭集完全一致。
- 429/529 从 250 ms 开始指数退避并尊重 `retry-after`，默认最多 3 次；15 秒单次请求超时。
- JEV 结果之后仍必须经过服务端 schema / Capability ID / policy 三重校验；小于 0.35 的置信度转为 noMatch。

STUB 按检索分排序；`FallbackDecisionProvider` 存在但默认关闭。key 只从宿主的 `SEMANTIC_JEV_API_KEY` 传入，不进入客户端、日志或包。

官方来源：[API reference](https://docs.typesafe.ai/api)、[JavaScript SDK / request shape](https://docs.typesafe.ai/sdk/javascript)、[Choice questions](https://docs.typesafe.ai/questions/choice)、[Models](https://docs.typesafe.ai/models)。

REAL_JEV（2026-09-20）：以公开 awesome 目录中的 20 个真实能力作为每次闭集候选，对基准前 20 条逐条调用；18/20 命中，1 条置信度 0.33 经校验成为 noMatch，1 条选择相邻 Mermaid 能力；p50 958 ms、p95 2492 ms。质量阈值待定。
