# HanaMesh Decision Policy

1. DecisionProvider 只能看到本次检索结果前 `SEMANTIC_TOPK_DECISION` 个候选，默认 20；不得访问或请求全库。
2. 只能选择输入候选中的 Capability ID。
3. `metadata.available=false`、与请求 runtime 或 OS 不兼容的候选不得成为推荐。
4. 价格、market cap、token 或其他金融字段不得进入排序与决策输入。
5. 总置信度低于 `SEMANTIC_MIN_CONFIDENCE`（默认 0.35）时返回 `noMatch:true`，不是错误。
6. Provider 输出只有通过 schema、Capability ID、policy 三重校验后才能进入公开响应。
