# Host ops manifest（WX25）

## GET /v1/host/ops-manifest

公开只读端点，无认证、无 Cookie、副作用或秘密；`Cache-Control: no-store`。
成功 200 JSON：`{ "schemaVersion": 1, "paths": ["/ops/ai", "/ops/ai/page.js"] }`。
`paths` 是当前 Host 实际注册的精确 GET ops 页面及公共资源，排序去重。
Host 在 ops 入口安装 Fastify onRoute hook，早于模块注册；模块路由注册就是声明，
不复制模块页面/资源清单。仅接受 `/ops/` 下由非点号起始的字母、数字、下划线、连字符、点号组成的非空路径段，
每段不得是 `.`/`..`；不含参数、通配、转义、查询、尾斜杠或非 ops 路径。
至多 512 条，每条至多 256 字符；不合规的路由不进入声明，超过容量启动失败。
manifest 不是权限授予，页面/API 的提供方鉴权、Origin、CAS 和错误码保持原样。

## Web 消费边界

Web 只对 GET `/hm/ops/*` 查询固定 HM_SERVER_ORIGIN 的此端点，匿名请求，
`redirect: manual`，沿用代理 10 秒期限；无重试、无旧清单回退、无跨请求缓存。
严格验证完整 JSON、schemaVersion、数组唯一性、数量和路径语法；任一不合法则整个声明无效，返回 503 UPSTREAM_UNAVAILABLE。
响应体最多 256 KiB；非200、跳转、网络错误或无效JSON同样失败关闭。
只有精确出现在 paths 中的 incoming pathname 才可去掉 `/hm` 代理。
未知 ops 返回404，非 GET ops 不读取 manifest、不代理，非 ops 仍由原路由边界处理。
query、Identity Cookie、网站 Origin marker、CSP、Content-Type、no-store 与提供方状态照原传递。
清单不含秘密；读取清单不转发用户 Cookie、Authorization 或任意请求头。

## 依据与版本

采用 [Fastify 5 onRoute](https://fastify.dev/docs/latest/Reference/Hooks/#onroute) 注册事件和
[Hono 4 路由](https://hono.dev/docs/api/routing) 后的精确匹配守卫。
JSON 形状按 [JSON Schema draft-07](https://json-schema.org/draft-07/draft-handrews-json-schema-validation-01) 声明。
端点 DTO 是本产品的公开协议；选择 HTTP 运行时声明，让 Host 增页无需 Web 发版或静态契约清单同步。
本单不占发布版本，合入时由编排分配 Host/contracts/Web 版本。先部署提供方再部署消费方。
