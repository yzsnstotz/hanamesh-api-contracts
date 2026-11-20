# 本人发行读契约 · IR1 / 0.29.0

公开入口 `@hanamesh/api-contracts/issuer/read` 与 `/issuer/read/schema.json`。上游基线为 I18NC 0.28.0 候选 b52b4325；本件未宣称其已合入。DTO和JSON Schema只描述公开结果，鉴权由资源模块实现，Host仅组合公开端口。所有金额、sold/SALES和Unix秒为十进制整数字符串；issuedAt为同一原事件时间的UTC表示。未知数据不造0；事实来源无法验证时返回具名503，明确无记录才返回空页。

| 提供模块 | 公开读方法 / HTTP | 输入与结果 |
|---|---|---|
| Identity 0.11.0 | wallets.listOwnAttachedAddresses(actor,context?) / GET /v1/identity/me/wallets/attached-addresses | 已认证规范本人；OwnAttachedAddresses；当前attached的EVM地址≤10、按地址排序；不返回proof或detached历史；资源端校验account/scope/deployment |
| Registry 0.4.12 | readIssuedHanaProfiles({deploymentId,hanaKeys},context?) | IssuedHanaProfiles；最多50个唯一键，保持输入次序，每个键恰一条，缺映射status:not-found且两个名称字段null；只读自己表 |
| Indexer 0.5.45 | listOwnIssuedTokens(credentials,{deploymentId,limit?,cursor?}) / GET /v1/indexer/me/issued-tokens | OwnIssuedTokensPage；Cookie本人、当前钱包集合匹配binding.issuer；limit默认20最大50；未知/重复参数拒绝；GET no-store；Origin须可信 |

Indexer读取已提交规范market_members/binding/issued和同head market_facts，数据在Chain验证后入库。按(原发行blockTimestamp,lowercase token address)降序稳定分页；游标绑定规范principal、钱包version/地址集合、deployment、limit及原head/hash，且每次仍重新鉴权。畸形游标400、跨本人403、钱包或head变化409，来源故障503；不隐式重试。游标不包含Cookie、proof、签名或私有身份明文。不接受浏览器自报issuer/principal。重组移除或head移动时拒绝旧页；不拿旧head和当前数据混成快照。

本人集合按当前attached地址，包含主/次钱包且不按当前主钱包缩减，不使用持仓或Custody frozen.principalId替代发行钱包。Identity端口接受同一只读executor，认证、规范账号、钱包版本及Indexer/Registry页读在调用方同一只读事务中。其他源不支持executor时不得仿造共享快照。

响应覆盖完整链身份、token/quote真实元数据、发行交易/时间、实际sold/SALES、phase、earlyReleaseAllowed、releaseStartedAt/source与migratedAt。phase:inactive保持原事实；“已迁池”和“释放中”可同时成立；列表事实不能代替即时链操作资格。Hana名称由Registry公开有界读口按当页键补齐，缺映射保留发行行和具名not-found；不从hash反推UUID或伪造“管理”目标。

奖励暂为 `source-required/ISSUER_REWARDS_BOUNDED_SOURCE_REQUIRED`，本单不复用Custody全局扫描、不生成奖励金额/状态；后续另单补有界权益读口。没有全量total字段，items.length仅本页数量，前端不得显示为全量发行数。

边界：每地址索引seek最多limit+1个候选（最多10×51），SQL合并后最多51行，输出最多50项；每项≤16384 UTF-8字节，响应≤1048576字节，cursor≤2048字节。超上界具名拒绝，不静默截断。≤200次发行是性能样本而非产品上限；验收1万发行、单人200、整口p95≤300ms，Linux隔离PG实测，保留EXPLAIN实际行数/loops/bytes。

采用PostgreSQL17唯一排序与B-tree索引seek，依据[LIMIT](https://www.postgresql.org/docs/17/queries-limit.html)、[ORDER BY索引](https://www.postgresql.org/docs/17/indexes-ordering.html)。字段、预算和错误语义为HanaMesh派单合同，不冒称标准自带业务规则。Host不写跨schema SQL、不复制鉴权、游标或释放状态逻辑。无兼容字段/路由或奖励兜底。
