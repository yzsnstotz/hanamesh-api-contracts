# 本人发行读契约 · IR1 / 0.29.0

公开入口 `@hanamesh/api-contracts/issuer/read` 与 `/issuer/read/schema.json`。上游基线为正式 v0.28.0 / afc62900，本候选已在其上变基。DTO和JSON Schema只描述公开结果，鉴权由资源模块实现，Host仅组合公开端口。所有金额、sold/SALES和Unix秒为十进制整数字符串；issuedAt为同一原事件时间的UTC表示。未知数据不造0；事实来源无法验证时返回具名503，明确无记录才返回空页。

| 提供模块 | 公开读方法 / HTTP | 输入与结果 |
|---|---|---|
| Identity 0.11.0 | attachedWallets.listOwnAddresses(actor,context?) / GET /v1/identity/me/wallets/attached-addresses | 已认证规范本人；OwnAttachedAddresses；当前attached的EVM地址≤10、按地址排序；不返回proof或detached历史；资源端校验account/scope/deployment |
| Registry 0.4.12 | readIssuedHanaProfiles({deploymentId,hanaKeys},context?) | IssuedHanaProfiles；最多50个唯一键，保持输入次序，每个键恰一条，缺映射status:not-found且两个名称字段null；只读自己表 |
| Indexer 0.5.46 | listOwnIssuedTokens(credentials,{deploymentId,limit?,cursor?}) / GET /v1/indexer/me/issued-tokens | OwnIssuedTokensPage；Cookie本人、当前钱包集合匹配binding.issuer；limit默认20最大50；未知/重复参数拒绝；GET no-store；Origin须可信 |

Indexer读取已提交规范market_members/binding/issued和同head market_facts，数据在Chain验证后入库。按(原发行blockTimestamp,lowercase token address)降序稳定分页；游标绑定规范principal、钱包version/地址集合、deployment、limit及原head/hash，且每次仍重新鉴权。畸形游标400、跨本人403、钱包或head变化409，来源故障503；不隐式重试。游标不包含Cookie、proof、签名或私有身份明文。不接受浏览器自报issuer/principal。重组移除或head移动时拒绝旧页；不拿旧head和当前数据混成快照。

本人集合按当前attached地址，包含主/次钱包且不按当前主钱包缩减，不使用持仓或Custody frozen.principalId替代发行钱包。Identity另向服务端提供 attachedWallets.readOwnScope(actor,context?)，返回{principalId,wallets:OwnAttachedAddresses}；principalId仅供服务器绑定游标，不进入HTTP钱包响应或游标明文。该方法用自身有界SQL解析规范本人，不调用会枚举关联设备的通用resolveCanonical。Identity端口接受同一只读executor，认证、规范账号、钱包版本及Indexer/Registry页读在调用方同一只读事务中。其他源不支持executor时不得仿造共享快照。

响应覆盖完整链身份、token/quote真实元数据、发行交易/时间、实际sold/SALES、phase、earlyReleaseAllowed、releaseStartedAt/source与migratedAt。phase:inactive保持原事实；“已迁池”和“释放中”可同时成立；列表事实不能代替即时链操作资格。Hana名称由Registry公开有界读口按当页键补齐，缺映射保留发行行和具名not-found；不从hash反推UUID或伪造“管理”目标。

奖励暂为 `source-required/ISSUER_REWARDS_BOUNDED_SOURCE_REQUIRED`，本单不复用Custody全局扫描、不生成奖励金额/状态；后续另单补有界权益读口。没有全量total字段，items.length仅本页数量，前端不得显示为全量发行数。

边界：每地址索引seek最多limit+1个候选（最多10×51），SQL合并后最多51行，输出最多50项；每项≤16384 UTF-8字节，响应≤1048576字节，cursor≤2048字节。超上界具名拒绝，不静默截断。≤200次发行是性能样本而非产品上限；验收1万发行、单人200、整口p95≤300ms，Linux隔离PG实测，保留EXPLAIN实际行数/loops/bytes。

采用PostgreSQL17唯一排序与B-tree索引seek，依据[LIMIT](https://www.postgresql.org/docs/17/queries-limit.html)、[ORDER BY索引](https://www.postgresql.org/docs/17/indexes-ordering.html)。字段、预算和错误语义为HanaMesh派单合同，不冒称标准自带业务规则。Host不写跨schema SQL、不复制鉴权、游标或释放状态逻辑。无兼容字段/路由或奖励兜底。

## 错误响应与服务端映射（R461 F01）

`ISSUER_READ_ERRORS` 是以下原生端口的 code→statusCode 表；`schema.json` 提供 indexerError/attachedAddressesError 两种 HTTP body、indexerHttpFailure/attachedAddressesHttpFailure 状态与 body 的校验对，以及 profilesFailure/configurationFailure 服务端拒绝形状。HTTP实际 body 为 `{error:{code,message}}`，statusCode来自HTTP响应状态，不在body里重复；组合校验对仅供消费者验证。message为模块公开安全文案，不是数据库或SDK原始错误，也不应作为分支判定依据。

| 原生端口 | 实际 code | 状态/抛错 statusCode | 原因与处理 |
|---|---|---|---|
| indexer | `AUTH_REQUIRED` | 401 | 缺Cookie、无效/过期会话或非本模块签发actor；重新登录 |
| indexer | `AUTH_FORBIDDEN` | 403 | 非活动本人、部署或scope不匹配；拒绝访问 |
| indexer | `INDEXER_ISSUER_INPUT_INVALID` | 400 | 参数、limit或调用方选择主体等输入无效 |
| indexer | `INDEXER_ISSUER_CURSOR_INVALID` | 400 | 游标编码/形状或deployment/limit不匹配；重新读首页 |
| indexer | `INDEXER_ISSUER_CURSOR_FORBIDDEN` | 403 | 游标不属于当前规范本人；拒绝访问 |
| indexer | `INDEXER_ISSUER_WALLETS_CHANGED` | 409 | 当前钱包版本/集合变化；重新读首页 |
| indexer | `INDEXER_ISSUER_ORIGIN_REJECTED` | 403 | 请求Origin不在模块白名单 |
| indexer | `INDEXER_MARKET_HEAD_CHANGED` | 409 | 发行分页head/hash变化；重新读首页 |
| indexer | `INDEXER_ISSUED_NOT_READY` | 409 | 部署尚无已提交市场索引head；保持未就绪状态 |
| indexer | `INDEXER_ISSUED_SOURCE_REQUIRED` | 503 | 部署未配置规范市场来源 |
| indexer | `INDEXER_ISSUED_SOURCE_INVALID` | 503 | 借用市场head或规范快照结构/来源不一致 |
| indexer | `INDEXER_ISSUER_SOURCE_INVALID` | 503 | 本人地址、发行/facts、排序/边界或名称公开投影不可信 |
| indexer | `INDEXER_ISSUER_SOURCE_UNAVAILABLE` | 503 | 连接、认证/地址/名称依赖或未知异常；返回安全来源故障 |
| indexer | `INDEXER_ISSUER_RESPONSE_TOO_LARGE` | 503 | 单项/整页/cursor字节上界超限，不截断伪装成功 |
| identity | `AUTH_REQUIRED` | 401 | 缺Cookie、无效/过期会话或非本模块签发actor；重新登录 |
| identity | `AUTH_FORBIDDEN` | 403 | 非活动本人、部署或scope不匹配；拒绝访问 |
| identity | `IDENTITY_INPUT_INVALID` | 400 | 不接受查询参数、非法Cookie/context/主体输入；服务端抛400 |
| identity | `AUTH_UNAVAILABLE` | 503 | 存储/会话SDK失败、缺服务、当前地址/版本或规范主体结果无效 |
| identity | `IDENTITY_NOT_READY` | 503 | 模块未就绪或已关闭 |
| registry | `REGISTRY_INPUT_INVALID` | 400 | deployment、键重复/格式/数量或context无效 |
| registry | `REGISTRY_UNAVAILABLE` | 503 | SQL失败、结果数/顺序或名称投影不可信 |
| configuration | `INDEXER_ISSUER_CONFIG_INVALID` | 500 | 发行服务或HTTP工厂缺必要端口/合法Origins |
| configuration | `INDEXER_ISSUED_CONFIG_INVALID` | 500 | 市场索引工厂来源配置无效 |
| configuration | `REGISTRY_CONFIG_INVALID` | 500 | 名称reader工厂缺合法pool |

Identity的GET共享parser将框架400/413/415都投影为`IDENTITY_INPUT_INVALID`并保留原HTTP状态；它们不是三个服务错误码。GET不调用修改操作的Origin拒绝规则，不把`IDENTITY_ORIGIN_REJECTED`或钱包绑定写错误列为attached reader业务错误。服务端`readOwnScope/listOwnAddresses`抛`IdentityError`，`code/statusCode/message`与identity表一致；配置中的assertActor先检查actor品牌、时效和就绪，再检查deployment/self scope。

Registry新增口只有公开服务方法，没有新增HTTP路由；其输入/依赖失败抛`RegistryError`的`code/statusCode/message`，故profilesFailure不伪造HTTP返回格式。配置500在工厂构造时抛出，不是列表的正常错误body；配置错误不可当作not-found或空成功。

Indexer发行HTTP用`IndexerError`的statusCode，body的message实际等于code；未知HTTP异常转`INDEXER_ISSUER_SOURCE_UNAVAILABLE/503`。服务组合只透传Identity的`AUTH_REQUIRED/401`及`AUTH_FORBIDDEN/403`，其他Identity错误（包括AUTH_UNAVAILABLE、IDENTITY_NOT_READY、IDENTITY_INPUT_INVALID）与Registry的两种服务错误均转`INDEXER_ISSUER_SOURCE_UNAVAILABLE/503`；不会在发行HTTP直接透出Registry/Identity内部code。自身`readMarketHead`的`INDEXER_ISSUED_SOURCE_REQUIRED/503`、`INDEXER_ISSUED_NOT_READY/409`及规范快照`INDEXER_ISSUED_SOURCE_INVALID/503`作为IndexerError保留。钱包/head变化需用户重新开始分页，模块不自动重试；来源故障不能显示为空页。该表对应固定原生实现，不为任意自定义adapter承诺任意字符串code。

`ISSUER_REWARDS_BOUNDED_SOURCE_REQUIRED`只在成功页rewards内表达来源待接入，不属于上述错误响应或HTTP失败码。
