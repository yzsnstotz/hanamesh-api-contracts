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
