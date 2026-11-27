# Host ops 页面声明契约（DS2 §8 / OB1 候选）

本候选将 `@hanamesh/api-contracts/host/ops-manifest` 改为 schemaVersion **2**，由编排 11-19 追加授权。本 v2 观测声明沿正式 v0.26.0 基点保留，当前包候选版本为 **0.30.0**，尚未正式发布；Host/Web/各模块尚未采用本候选，不表示现行端点已切换。升级必须协调提供方与消费方，候选只接受 v2，不接受 paths-only v1 形状或推断回退。

## GET /v1/host/ops-manifest

公开只读端点，无认证、Cookie、写副作用或秘密；`Cache-Control: no-store`。v2 成功 200 JSON：

```json
{
  "schemaVersion": 2,
  "paths": ["/ops/provider-ui", "/ops/provider-ui/page.js"],
  "pages": [{
    "id": "provider.dashboard",
    "moduleId": "provider",
    "href": "/ops/provider-ui",
    "titleKey": "ops.provider.title",
    "descriptionKey": "ops.provider.description",
    "group": { "id": "provider.operations", "labelKey": "ops.provider.group", "order": 30 },
    "order": 10,
    "permission": { "policyId": "provider.ops.read" },
    "kind": "page"
  }]
}
```

以上名称仅为契约示例，不是 Host 内置模块/分组/权限名单。类型导出为 `OpsManifest`、`OpsPageContribution`、`OpsPageGroup`、`OpsPagePermission`。运行时只导出 `OPS_MANIFEST_SCHEMA` 与 `OPS_PAGE_CONTRIBUTION_SCHEMA`，没有权限计算或菜单生成器。两个 schema 均可通过公开 `.json` 子路径单独导入。

独立的认证文本、访问、路由和快照形状见 [观测台伴随契约](ops-companions.md)。

## 模块自己声明，Host 组合，Web 渲染

- 每个拥有页面的模块导出自己的 `OpsPageContribution`。`group`、`order`、`permission` 及其嵌套字段全部必填，无默认值。Host 自有页面也走相同声明；Host 不按模块名或路径复制分组、排序、权限细则或页面清单。
- `id` 是跨模块唯一的稳定页面 ID；`moduleId` 是提供方声明的归属；`kind:'page'` 明确这是导航页面。`href` 为当前 Host 协议下精确、未加 `/hm` 的 `/ops/*` 页面路径；JS/CSS 等资源只进入 `paths`，不能作为资源类型混入 `pages`。不能从文件扩展名猜哪些路由是页面。
- `titleKey`、`descriptionKey` 和 `group.labelKey` 引用模块自己的三语文本目录。Host/消费方按模块声明接收文案，不发明模块名→标题映射；本 DTO 没有伪造已经存在的文本目录传输端口。
- `group.id` 是组标识，`group.order` 是组之间的顺序，页面 `order` 是组内顺序。顺序为安全整数，schema 不把模块/组名称枚举成白名单，也不替缺失字段填值。
- `permission.policyId` 只引用模块自己的公开策略，不是授权结果，不能携带 `canManage`、主体名单或权限授予。管理员 AND AI owner、Indexer 允许主体、社区 admin 等规则仍归所属模块。公开 manifest 不包含当前 actor 的访问状态、账务/审核数据或秘密；导航元数据永远不能替代页面与 API 每次的资源端鉴权。
- Host 只组合实际装配的贡献。Web 只按 `group/order` 和模块文案渲染，不从路径猜权限，不把设计稿示例菜单常量复制进产品。认证后的访问投影要由模块实际检查（DS2 所述 `readOpsAccess(actor)`）；本补充没有自行定义其端点、Edge 认证桥或 shell/body 协议。

## paths 与代理安全边界

`paths` 保留原有精确 GET 代理允许集职责，包括页面和公共资源；Host 用 Fastify `onRoute` 收集实际注册路径。`pages` 是模块给的导航声明，不能代替 `paths` 给 Web 扩大代理权限。Host 必须核对页面确实对应其已注册 GET 页面；不能因为一条 metadata 就允许代理任意 API。

路径仍只接受 `/ops/` 下由非点号起始的字母、数字、下划线、连字符、点号组成的非空路径段，每段不得是 `.`/`..`；不含参数、通配、转义、查询、尾斜杠或非 ops 路径。`paths` 排序去重，至多512条，每条至多256字符；`pages` 也至多512条，metadata 各字符串非空且至多256字符。容量沿原 manifest 路径边界；组合响应整体仍须不超过256 KiB UTF-8，不静默截断。

Web GET `/hm/ops/*` 按固定 HM_SERVER_ORIGIN 读取声明，匿名、`redirect: manual`、沿原代理10秒期限；不重试、不回退静态/旧清单、不跨请求缓存。严格验证完整 v2 JSON；无效、超容量、非200、跳转、网络错误均失败关闭。只有 incoming pathname 精确出现在 `paths` 才能去掉 `/hm` 代理；未知 ops 返回404，非GET不读取manifest、不代理。query、Identity Cookie、网站 Origin marker、CSP、Content-Type、no-store 与提供方状态沿原边界传递，manifest读取本身不转发用户 Cookie/Authorization/任意请求头。

## Schema 与装配检查各自能保证什么

JSON Schema 验证结构、必填、类型、原路径语法、容量、完整重复对象及额外字段；**不会验证跨模块语义**。Host 采用时仍必须具名拒绝重复页面ID/href、冲突组声明/顺序、未知policy引用、未注册页面，以及文案键在三语目录中缺失。不能把schema通过当成这些检查已实现，不能静默丢项或回填硬编码默认值。

Edge 自有 community/site/catalog-sync 的贡献注册桥、Web自有路由边界、访问投影和统一页面shell仍需对应实现单，不在本契约补充里猜部署方式、改原页面路径、剥HTML、iframe嵌入或降低CSP。原页面功能与资源鉴权必须保留。

## 依据与采用

字段结构直接采用 DS2 §8 的 `OpsPageContribution`，由编排本轮要求优先补入；模块归属遵守 owner 反复要求的“模块自己声明/导出，Host只组合”。结构验证沿用已有 Ajv8.20.0 + [JSON Schema draft-07](https://json-schema.org/draft-07/draft-handrews-json-schema-validation-01)；[Fastify onRoute](https://fastify.dev/docs/latest/Reference/Hooks/#onroute) 的运行时路径收集职责保留。无新增运行依赖。

自造：本产品页面声明与模块策略引用的业务DTO；没有可代替HanaMesh模块归属的通用第三方菜单协议。未新造权限系统、页面名单、RPC或导航框架。

采用顺序由编排统筹：观测 v2 沿正式 v0.26.0 基点的既有提供方/消费方协调安排，发现与本人发行读契约随本 0.30.0 包候选另行验收；各模块填声明，Host验证并组合v2，Web按v2严格消费。未切换的现行Host/Web继续使用其原有固定包；不能把本候选0.30.0 tarball冒充已正式发布或已被采用。
