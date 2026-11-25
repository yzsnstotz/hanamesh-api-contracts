# 本人发行账户 / 0.30.0

`@hanamesh/api-contracts/issuer/account` 公开本人冻结权益和Host组合DTO、严格JSON Schema及错误状态目录。保留同一未发布列车的catalog/query、github-namespaces、identity/email能力；包统一版本按编排11-25裁定为0.30.0，不能采用源候选曾写的0.32.0当正式版本。

Custody owns GET `/v1/custody/me/issuer-rewards`，只读冻结principal权益；server-only bulk `readOwnIssuerEntitlements` ≤50 Hana UUID+requestKey输入。冻金额 `amount` 为launch initiator role，`entitlementAmount` 为冻结整项分配，都是精确base-unit字符串；不是可领、已领、当前余额或发币成功证明。不调用会结算/释放的resolveForHost。只返回白名单，不返回principal/cut/rights/proof。

Host owns GET `/v1/host/me/issued-tokens`，组合Indexer本人当前钱包有界发行页、Registry名称、Custody冻结bulk。Host不写业务SQL、不复制资金规则，必须核Hana/requestKey及所有作用域关系。组合页schema `hanamesh-own-issued-account-v1`，有真实 `totalIssued`、原稳定游标/快照/发行事实，每条附reward。未拥有的冻结权益为not-owned；未映射Hana为具名HOST_ISSUER_PROFILE_REQUIRED，不虚构管理ID或填奖励0。来源故障保持错误，不能伪装空页。Chain释放状态仍来自同作用域公开事实，不能从冻结金额推导。

资源页≤50，bulk≤50，游标≤2048字符且运行口按UTF-8字节再检查，HTTP最终≤1MiB；metadata/int/scope严格沿用issuer/read约束。scope/金额间对应由资源与Host运行时验证，JSON Schema不冒充跨端口鉴权或链上判断。

错误码及HTTP状态由 `ISSUER_ACCOUNT_ERRORS` 公布并逐条测试，Indexer原 `ISSUER_READ_ERRORS.indexer` 可以透传；code与status相关联，未知code/SQL cause/额外私有字段不合法。Custody READ错误可有 `{input,scope:'custody-read-model'}` need；Host的具名错误只含code/message。401未鉴权、403错误origin/游标principal、400输入/游标格式、503真实来源缺失/无效/超界，与真实提供方实现一致。未注册的未来错误不凭空放行。

旧rewards.source-required成功占位直接删除；现行页必须带totalIssued，缺失/负数/小数/string/fake-zero失败路径均有负例。原金额、privacy、分页上界和所有native错误断言保留。类型与schema通过正常包导出，消费者不得深import。
