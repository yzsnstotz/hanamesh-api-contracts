# C-INDEXER-CATALOG · J3S3-IDX-01

来源：server-indexer origin/main `a5b47da8ee081ae25834e94aa8ff510478a0dae7`。正式安装 tag `v0.8.0`。完整 DTO 与来源字段保留提供方声明；HanaProfileDTO/RegistryProfilePort 直接引用已发布 C-CATALOG，SqlPool/UnitOfWork/WriteContext 引用 C-UOW（两者已有 v0.5.0 发布），不 import Registry 实现。

| 实际 HTTP | 输入 | 返回 / 差异 |
|---|---|---|
| GET /v1/indexer/items | after?、limit?（默认20，1..200）、updatedSince?（有效 RFC3339） | {items:IndexedHanaDTO[],next:string\|null}；基线数组对应 items，额外分页 envelope/cursor |
| GET /v1/indexer/hanas/:hanaId | hanaId | IndexedHanaDTO；未知 404 INDEXER_NOT_FOUND |
| GET /v1/indexer/runs | limit?（默认20，1..200） | {items:IndexRunDTO[]} |
| POST /v1/indexer/runs | {source:'awesome'\|'1024store'\|'hanamesh'} | RunResult；基线 sourceId 对应实际 source，sourceId 请求 400；POST 没有 runId/startedAt/finishedAt/running，GET runs 提供持久化 IndexRunDTO |

IndexedHanaDTO 继承 C-CATALOG 身份字段 hanaId/sourceId/sourceRef/displayName/kind/githubRepo/homepage/indexedAt/ownerPrincipalId，增加 npmPackageName、summary{en,zh}、latestVersion、license、categories、keywords、publisher{name,url}|null、repoUrl、repoSubdirectory、updatedAt、sourceLinks。SourceLinkDTO 是 sourceId/sourceRef/sourceUrl/firstSeenAt/lastSeenAt。不存在额外原始凭据/来源 rawHash wire 字段。

RunResult 包含 source、status:ok|failed、fetched/created/updated/unchanged/failed、可缺省 error:string；IndexRunDTO 另有 runId/startedAt/finishedAt，允许 running，error:string|null。status:ok 的持久化 run 可以带 NORMALIZATION_REJECTED:<count>；POST 摘要不带该可选 error。这不是每条归一化输入都成功的承诺。

匿名 GET；POST policy(request,requestedSource) 先于来源有效性/存在性检查，认证/授权归宿主。常规错误 wire 为 `{error:{code,message:code}}`。INDEXER_ERRORS 是提供方已发布的本地目录及 service status；不穷举注入端口异常。HTTP 将 Registry 404 映射 INDEXER_NOT_FOUND、400 映射 INDEXER_INVALID_REQUEST，其他未知异常 INDEXER_INTERNAL 500。POST 的执行失败返回 RunResult（不是 envelope），除去重碰撞409外为502。INDEXER_CONTENT_SOURCE_UNKNOWN 在服务端是500，run wire 是502。run lease finish 自身失败可直接走 HTTP500，不能保证持久化失败记录。INDEXER_INTERRUPTED 用于恢复后的持久化 run，不是直接 HTTP拒绝码。

items 先从 Registry 分页取得最多 limit 个 profile，再查目录并按 updatedSince 过滤；cursor 来自 Registry 页，所以可有少量甚至空 items 配合非空 next。after 是 string，不承诺额外 UUID 校验。100条一批，前批已提交、后批失败时不回滚前批；本批 profile/catalog/source-link 共用 context.executor，抓取完整完成后才进入业务 UOW。损坏/未知 content_hash 拒绝当前批，不补造来源、不暴露原 hash。

去重输入与三来源回链见 `createIndexerContractExamples().dedupe`：同仓库 gh:<owner>/<repo> 小写为一 Hana（无仓时才用 npm:<name>）。首次来源的 Registry (sourceId,sourceRef) 永久保留；内容优先级 hanamesh > awesome > 1024store，回链保留三来源。低优先重放只刷新回链并计 unchanged。稳定来源仓库重命名可找回原 Hana，目标已属于另一 Hana 时 INDEXER_DEDUPE_COLLISION，不隐式 merge/delete。示例是已实现语义的合成输入/输出，夹具没有复制去重引擎。

## 独立运行器注入与生命周期

本包导出已有 `IndexerModuleOptions`、`IndexerComposition`、`IndexerCompositionRequest`、`IndexerCompositionFactory`、`IndexerRunner` 类型，运行时 createIndexerRunner 仍由提供方导出；本包不提供产品工厂。Fastify类型端口使用可选 peer fastify ^5.12.3，使用这些服务端类型时安装该依赖；纯 DTO/JS 例子无 Fastify runtime import。

部署清单明确模块绝对路径或 file URL；CLI `--composition-module` / `INDEXER_COMPOSITION_MODULE` 读取唯一具名 `createIndexerComposition`，没有默认模块/自动 fixture。factory 接收 {databaseUrl,purpose:'index-once'|'serve'|'migrate'}，同步或异步返回 IndexerComposition：

```ts
import type {IndexerComposition, IndexerCompositionFactory} from '@hanamesh/api-contracts/indexer-catalog';
// 宿主自己的资源工厂；以下只说明供给签名，未声称 HOST-01 已实现。
declare function createHostResources(request: Parameters<IndexerCompositionFactory>[0]): Promise<IndexerComposition>;
export const createIndexerComposition: IndexerCompositionFactory = async request => {
  return createHostResources(request);
};
// 返回对象必须含：pool(SqlPool)、registry(RegistryProfilePort)、unitOfWork、actor、
// sources(三来源的显式 Partial Record)、policy(request,source)、migrate、close；
// 可选 now/runStaleAfterMs/runHeartbeatIntervalMs/diagnostic。
// pool/Registry/UOW 共用数据库；host 负责授权、迁移顺序和 runtime grants。
```

既有提供方 API 的启动/关闭用法：

```ts
// createIndexerRunner 从提供方包取得；供给类型只从合约包取得。
import {createIndexerRunner} from '@hanamesh/server-indexer';
const ports = await createIndexerComposition({databaseUrl, purpose:'index-once'});
// runner 参数验证抛错时由调用者关闭已返回的供给。
let runner;
try { runner = createIndexerRunner(ports); }
catch (error) { await ports.close(); throw error; }
try { await runner.start(); await runner.run('awesome'); }
finally { await runner.close(); }
```

runner.start 恢复 stale runs；run('all') 顺序 1024store/awesome/hanamesh，缺适配器先抛 INDEXER_SOURCE_DISABLED:<name>，run 本身不自动关闭，调用者 finally 关闭。serve(app,listen) 恢复/注册/监听；start/serve 失败自动 close。migrate 只委托宿主，不执行 start；CLI finally 关闭。runner.close 至多调用宿主 close 一次，先关闭已注册 Fastify，失败仍可见。factory 返回前的部分资源由 factory 自己清理；执行中的 run 应结束后再关闭。

缺 port/method 点名 Error `INDEXER_COMPOSITION_<PORT>_REQUIRED`；来源键/adapter不符 `INDEXER_COMPOSITION_SOURCE_INVALID:<name>`；缺具名工厂 `INDEXER_COMPOSITION_FACTORY_REQUIRED:createIndexerComposition`。配置还可抛 INDEXER_DATABASE_URL_REQUIRED / INDEXER_COMPOSITION_MODULE_REQUIRED；加载模块保留原异常。这些是启动 Error.message，不编造 HTTP status/envelope。

```sh
node scripts/index-once.mjs --source=awesome --db="$DATABASE_URL" --composition-module="$INDEXER_COMPOSITION_MODULE"
node scripts/serve.mjs --db="$DATABASE_URL" --port=34081 --composition-module="$INDEXER_COMPOSITION_MODULE"
node scripts/migrate-dev.mjs --db="$DATABASE_URL" --composition-module="$INDEXER_COMPOSITION_MODULE"
```

脚本位于提供方包。serve 的 SIGINT/SIGTERM 关闭 Fastify再关闭供给。真实 Registry+PG factory/migrator/完整独立运行器仍 DEFERRED(J3S1-HOST-01)。Registry fixture/seeded port只是 FIXTURE，不是生产组合或 REAL_HOST；本卡不宣称 owner ACCEPTED。

## Q55 · J3S3-IDX-02 / J3S3-APIC-20 · v0.17.0

正式合约安装：`git+https://github.com/yzsnstotz/hanamesh-api-contracts.git#v0.17.0`，公开入口 `@hanamesh/api-contracts/indexer-catalog`。
提供方固定正式 main `f2a089ae2981324abf432aa73a1546c89693d817`；代码 tag `v0.2.0` 解引用 `ab47919137ad7e930bb1661cc3c5f494bff3642c`。两者实现/公开 dist 相同，main 只追加 AGENTS.md 清理。新来源与抽取边界见 `/indexer-catalog/read-provenance.json`；原 provenance 保留原提供方基线。

新增 `IndexedHanaDTO.contentHash?: string` 为 **readonly**，可选仅用于旧 DTO 构造与旧 IndexerService/FIXTURE 兼容。新增 `IndexedHanaWithContentHashDTO` 的成员为 required string；`IndexerReadService extends IndexerService` 的 listItems/getItem 成功结果使用强类型。提供方 createIndexerService/buildIndexerService、createIndexerModule.services 返回该强保证服务；产品工厂由提供方包供应，合约包无运行时工厂。

| 面 | 成功 | 无效 catalog hash |
|---|---|---|
| IndexerReadService.listItems(query?) | Promise<{items: readonly IndexedHanaWithContentHashDTO[], next: string\|null}> | 拒绝整个 Promise，不跳过坏条目 |
| IndexerReadService.getItem(hanaId) | Promise<IndexedHanaWithContentHashDTO> | 拒绝 Promise |
| GET /v1/indexer/items | 同 list 的分页 envelope，成功 item 必有 contentHash | HTTP 500 `{error:{code:'INDEXER_CONTENT_SOURCE_UNKNOWN',message:'INDEXER_CONTENT_SOURCE_UNKNOWN'}}` |
| GET /v1/indexer/hanas/:hanaId | 同 get 的 DTO，成功必有 contentHash | 相同 HTTP 500 envelope |

字段原样来自**该次返回的胜出 catalog row** 的 `content_hash`，读取不计算、不写入、不缓存。既有格式是 `1024store|awesome|hanamesh` 加冒号、64位小写 SHA256 十六进制公开 metadata 摘要；不是文件/源码/README 摘要。`NormalizedHanaInput.source.rawHash` 是写入输入，`source_links.raw_hash` 是回链记录，二者均不能替代读取字段。SourceLinkDTO 保持旧字段；profile.sourceId/sourceRef 是首次 Registry 身份，可能与 hash 的胜出内容来源不同。

缺失/undefined、null、非字符串、空/损坏/未知来源 hash 由 service 抛提供方 `IndexerError`（name='IndexerError'，code='INDEXER_CONTENT_SOURCE_UNKNOWN'，statusCode=500，message=`INDEXER_CONTENT_SOURCE_UNKNOWN hanaId=<id>`）。实际 PostgresRepository 映射会先 String(row.content_hash)，如缺失/null 成为 'undefined'/'null' 后仍被拒绝。只检查既有格式，不在读时重新验证摘要与 metadata 的一致性。诊断由宿主可选 sink 接收 source='catalog'、同 code、Hana id，不含原 hash；sink 自身异常按提供方既有实现吞掉后仍抛读取错误。合约不导出 IndexerError 构造器；消费者按 code/statusCode 识别，不把 FIXTURE 的普通 Error 当提供方同一构造器。底层 Registry/SQL 异常仍可能传播；HTTP 仍保留原 Registry400/404映射与未知 INDEXER_INTERNAL500。

内容优先级仍为 hanamesh > awesome > 1024store。胜出 metadata 变化更新 hash 与 updatedAt；同内容重放不改二者，只刷新来源链接并计 unchanged；低优先来源也保留回链并计 unchanged。首次 Registry identity 保留。读取没有额外内容/快照协议。

分页先取得最多 limit 个 Registry profile（内部每页最多100），再取 catalog 并过滤 `catalog.updated_at > updatedSince::timestamptz`，严格 `>`，不是字符串字典序或 `>=`。cursor 来自 Registry 页；items 可空而 next 非空，须继续到 next=null。不存在 catalog 的 profile 在 list 被过滤，get 是 INDEXER_NOT_FOUND404；有 catalog 但无效 hash 则对**已通过增量过滤的返回行**拒绝整次读取。未进入当前页/被 updatedSince 排除的行不在该次校验内。limit 原默认20、1..200；HTTP 检验 RFC3339，直接 service 将 updatedSince 传给 repository/PG，不声明 service 单独提供同样的 RFC3339 校验。不承诺跨服务一致快照。

### 全字段与尚未消费调用核对

SEM01 SourceRow 的 hanaId/sourceId/sourceRef/kind/githubRepo/homepage 来自继承的 HanaProfileDTO；name→displayName；npmPackageName/license/categories/keywords/repoUrl/repoSubdirectory/updatedAt 来自 IndexedHanaDTO；summaryEn/summaryZh→summary.en/.zh；contentHash→本轮读取字段。17项完整覆盖，已供应字段不重做。cachedReadme 属 Semantic 自有 source_documents.body；`updatedAt > since OR 本地未同步` 的本地筛选/补扫归 Semantic，不能只传 updatedSince 而漏掉旧未同步记录。

RegistryCatalogPort.getHanaProfile/listHanaProfiles 与 IndexerService.listItems/getItem 已发布；强读取声明现新增 IndexerReadService。既有 runner/composition 的 policy、共享 pool/UOW、migration/close 仍见上节，不改生命周期。SEM01/HOST01 未消费的 createSemanticModule/plugin/services、syncProfiles/runEmbeddingJob/search/recommend/feedback、Embedding/Decision providers 配置与释放仍待 SEM→J3S1-APIC-19→HOST01 按序供应，本卡不发布不存在的 Semantic 面或复制宿主逻辑。

### PACKAGE / FIXTURE

旧 INDEXER_EXAMPLES、createIndexerContractExamples/createIndexerProviderFixture 保持原字节和 hashless 输入接受范围。
新 `createIndexerContentHashExamples()` 生成独立副本：固定 provider sample hash、首次1024store身份而胜出hanamesh内容、空页仍有 next、五类坏存储的 service/HTTP 错误。胜出例是合成 metadata 相同的多来源结果，不宣称执行了对端事务。
`createIndexerContentHashReadFixture({pages?,item?,failure?})` 只返回显式预置页/条目或抛预置 code/statusCode/message 的普通 Error；after 用来选预置页。未预置 cursor/id 是 FIXTURE 配置错误；limit/updatedSince 不计算，坏 hash 不自动验证，错误由 failure 明确给出。它只提供 Pick<IndexerReadService,'listItems'|'getItem'>，不冒充完整产品服务、生产算法、SQL、增量过滤或生命周期。实际 hash/优先级/HTTP/增量错误的 SOURCE/FIXTURE 审计在本卡运行目录，未进入包。
