# C-CONTRACTS-ABI 完整五件（api-contracts v0.11.0）

固定提供方卡 J4S3-CTR-09，提交 `2ca2fb07b8b94804ac5c8b336d26dfb9f195253a`。
五件 JSON 和 `manifest.json` 均以 `git show <commit>:abi/frozen/<file>` 取得原始字节。
`provenance.json` 记录来源仓、卡、提交、原路径与文件 SHA256（path 从包根起算）。
冻结标签仍为 `J4S2 OZ v0.2.0`，compiler/OZ/settings/metadata 全部保持来源值。

正式安装：`git+https://github.com/yzsnstotz/hanamesh-api-contracts.git#v0.11.0`。
运行时和类型入口：`@hanamesh/api-contracts/contracts-abi/frozen/oz-ctr09`。
该路径下直接 JSON 入口：`{HanaLauncher,LaunchFee,HanaToken,Distributor,ReservedDistributor,manifest,provenance,distributor-manifest,distributor-example}.json`。
两个独立 ABI JSON 入口：`/contracts-abi/Distributor.json` 与 `/contracts-abi/ReservedDistributor.json`。

```js
import {
  CONTRACTS_ABI_FROZEN as frozenContracts,
  CONTRACTS_ABI_FROZEN_MANIFEST as frozenManifest,
  CONTRACTS_ABI_PROVENANCE as provenance,
} from '@hanamesh/api-contracts/contracts-abi/frozen/oz-ctr09';

// Chain07 的唯一冻结输入：同一个固定提交的完整五件及其原 manifest。
const frozenInput = {frozenContracts, frozenManifest, provenance};
// frozenInput.frozenContracts 包含 HanaLauncher / LaunchFee / HanaToken /
// Distributor / ReservedDistributor。提供给 Chain 自身的核验逻辑。
```

CTR-09 修复导出器缓存 AST ID 混用，因此前三件的 immutable 编号与文件 SHA256 已刷新。
它们的 ABI、creation/runtime、metadata 和实际 immutable 偏移保持不变。
应整套使用上述输入，不能把旧 `/contracts-abi/frozen` 三件或旧 SHA 与本 manifest 混合。
旧 `/contracts-abi` JS/类型、原三件、原 manifest/provenance/launch-example 全部保留原样；原入口未重定向。
每个 ABI 常量为完整 readonly 字面量，支持 viem 类型推导。五个 `*_FROZEN` 常量、
`CONTRACTS_ABI_FROZEN`、`CONTRACTS_ABI_FROZEN_MANIFEST`、`CONTRACTS_ABI_PROVENANCE` 是独立新集合。

Distributor 的 constructor 为 `(address signer_)`；ReservedDistributor 为 `(address signer_, address treasury_)`。
部署数据模型是冻结 creationBytecode 后追加相应 ABI 编码参数；本包只做离线编码测试。
验证 runtime 时先核对 runtimeBytes，再将 immutableReferences 中全部区间归零（包括 OZ EIP712 缓存域），
对结果计算 keccak256，与 runtimeTemplateKeccak 比较。无须在本包重编译提供方。

证据：SOURCE_BUILD 继承提供方 CTR-09 的构建和确定性本地测试；本卡新增 PACKAGE 原字节/入口验证，
及 FIXTURE 离线构造编码和合成 runtime 归零测试。`createDistributorContractExamples()` 返回提供方原示例，
`distributor-example.json` 和 `mock_distributor.py` 是提供方 FIXTURE，金额为整数 base units。
没有把这些例子当作部署或真实链验证。领取 producer 行为由 CHAIN-02 验证。
不包含 Bond，不部署、不广播、不读取凭据，不声明 REAL_CHAIN 或 owner ACCEPTED。

来源与许可：HanaMesh contracts 冻结五件 · J4S2 OZ v0.2.0 · MIT（提供方源码 SPDX）·
https://github.com/yzsnstotz/hanamesh-contracts · ABI/冻结工件；
OpenZeppelin Contracts · v5.3.0 / e4f70216d759d8e6a64144a9e1f7bbeed78e7079 · MIT ·
https://github.com/OpenZeppelin/openzeppelin-contracts · 提供方构建底座。
本卡无新增依赖；api-contracts 既有开发依赖及许可见包根 README。
