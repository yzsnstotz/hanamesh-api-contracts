# API-O5 · 语义检索与决策

版本：`@hanamesh/server-semantic 0.2.0`。本文件冻结路线 §2.3b 的语义，只追加 `metadata.available/os` 与身份、限流说明。

所有请求使用 `Content-Type: application/json` 并携带宿主 `allowedOrigins` 允许的 `Origin`。所有响应带 `x-hanamesh-semantic-mode: real|stub`、`x-request-id`、`cache-control: no-store`。限流身份优先级为已认证账号 principal > `x-hanamesh-device-id` > 客户端 IP，默认每分钟 30 次；超限返回 429 与 `retry-after: 60`。

## POST /v1/capabilities/search

请求：`{query,type?,context?,constraints?,topK?,telemetry?}`。`query` 1–500 字符；`type` 当前只接受 `dsh_plugin`；`topK` 1–200，默认 50。`context` 与 `constraints` 字段见 `schemas/search.request.json`。

响应：`{candidates,retrieval,requestId}`。Candidate 保持路线草案字段，并追加 `metadata.available?: boolean`、`metadata.os?: string[]`。本路由永不调用 DecisionProvider。

## POST /v1/capabilities/recommend

请求与 search 相同，追加 `more?: 0..20`。服务端只把检索候选前 `SEMANTIC_TOPK_DECISION` 个（默认 20）交给 DecisionProvider；输出经 schema、候选 ID、policy 三重校验。

响应：`{recommendation:{primary,alternatives,noMatch,confidence},candidates,meta:{requestId,latencyMs,providers}}`。`noMatch` 是 200 正常响应。

## POST /v1/capabilities/feedback

请求：`{requestId:uuid,objectId:uuid,action:'select'|'install'|'open'|'dismiss'}`；响应 `{ok:true}`。只存这两个 ID、动作、服务端生成的 id/时间，不存内容。

## 错误

统一 `{error:{code,message}}`：`SEMANTIC_INPUT_INVALID` 400、`SEMANTIC_RATE_LIMITED` 429、`SEMANTIC_PROVIDER_UNAVAILABLE` 503、`SEMANTIC_DECISION_REJECTED` 502。`SEMANTIC_NO_MATCH` 不作为错误返回。

## 模块与作业端口

`createSemanticModule`、`syncProfiles`、`runEmbeddingJob`、provider 注入与全部具名配置、只读来源映射、C-UOW 桥接、错误通道、资源生命周期及确定性最小 FIXTURE 详见 [MODULE.md](MODULE.md)。这次只替换跨表来源读取，HTTP 及模型默认保持。
