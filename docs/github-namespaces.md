# 本人 GitHub namespaces（CLP1 候选）

Identity 0.12.0、api-contracts 0.31.0 的候选接口；当前Identity开发基线按编排批准为v0.10.0，必须在IR1 0.11.0和ID12 0.11.1 tag后变基补证，再独审/merge train。不是已合入/已部署声明。

`GET /v1/identity/me/github/namespaces`，本人账号Cookie鉴权，不接受query参数，也不接受设备签名代替账号会话。HTTP沿Identity protocol2，成功及错误均no-store/no-cache/nosniff。可选进程内服务 `githubNamespaces.readOwn(actor)` 要求本实例未过期账号actor；不新增跨主体查询、scope或登录方法。

返回 `{login:string|null,orgs:[{login,avatarUrl}],checkedAt,truncated:boolean}`。组织仅来自当前token可见的state=active且role=admin的成员关系。未绑定GitHub：login=null、orgs=[]、truncated=false；已绑定名下没有可见管理员组织：login非空、orgs=[]。checkedAt是本次快照或条件验证完成的UTC时间；TTL命中不改这个时间。

**没有是否授权字段，也没有unknown占位。** active/admin不代表OAuth app获组织批准；不保证列全被组织策略隐藏的组织。页面保留设计已有「少了某个组织？去GitHub授权」链接。普通403/404或缺条目不推断逐组织批准状态。此结果只用于展示，Claim继续实时核验仓库归属，不使用此缓存作授权证明。

Identity内部复用现有GitHub账号lookup，每次命中缓存前也读取当前绑定。GET /user的稳定数字ID须和绑定相符；login可改名，不拿来当身份键。token只用于内部请求头；缓存key包含principalId与数字ID/token的SHA256摘要，不保存原token到缓存或DTO，不记录上游响应体/URL/异常详情。进程内单实例缓存，关闭即清空，未新增PG表或迁移。异步刷新返回前再次核actor与绑定，解绑/换token中途不返回旧结果。

执行上限：每页100成员关系，最多10页，即最多1000成员关系（普通成员/待处理条目也消耗页限额）；最多1000返回组织，按首次出现去重、不另造排序。达到页上限且上游还有next时truncated=true，不把截断当完整，也不补伪总数。冷读最多11次GitHub GET（user一次+组织10页），串行无自动重试。每个上游body最多1MiB；单项login最多100字符、avatarUrl最多2048字符且HTTPS。最多32账号快照和32在途刷新，缓存对象只留归一化公开展示字段、ETag/next，不留GitHub原始资料；技术边界服务于派单的有界读取/内存目标，不增加认领资格规则。

60秒短TTL，缓存命中0次GitHub GET；TTL后按**相同URL、同账号/同授权上下文**携ETag/If-None-Match。304复用该页原表示并合并本次提供的ETag/Link，缺省头沿原缓存；200替换该页；部分页失败不提交半个快照、不返回陈旧成功。按Link遍历，拒异源、改路径、改变过滤/页大小及倒退页的next，避免带token访问任意URL。最多11个条件GET；无ETag按普通GET，不制造验证器。并发同账号刷新复用同一Promise，其他账号隔离。

错误沿既有代码：没有/失效token或GitHub401→401 GITHUB_TOKEN_INVALID；GitHub403（含受限/primary或secondary限流）、429、其他非200/304、网络/格式/字节越界→503 GITHUB_API_UNAVAILABLE，不空列表兜底。GitHub已给出的限流Retry-After/reset以及secondary限流建议在进程内抑制后续调用；不自动sleep/retry，不把限流当未授权状态。返回固定安全错误体。故障后清除旧成功表示，下个实际请求可按现有状态恢复。

依据：[用户资料与稳定ID](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/best-practices-for-creating-an-oauth-app#use-the-durable-unique-id-to-store-the-user)、[成员关系分页](https://docs.github.com/en/rest/orgs/members#list-organization-memberships-for-the-authenticated-user)、[ETag条件GET与限流建议](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api)、[OAuth scope](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)、[组织批准不可见](https://docs.github.com/en/rest/using-the-rest-api/troubleshooting-the-rest-api#404-not-found-for-an-existing-resource)。已有read:user/read:org足够，无新增scope、不要求用户为本接口重新授权。scope与组织批准是两回事，用户撤权/少授仍按失败处理。

自造：项目专用DTO和固定有界执行参数——它们把编排批准的显示需求与资源上限落到本模块。HTTP客户端使用Node24.13.1内置fetch/AbortSignal、认证沿原生Identity actor、条件请求沿GitHub官方协议；没有新依赖、通用缓存框架、授权状态推断器或兼容桥。
