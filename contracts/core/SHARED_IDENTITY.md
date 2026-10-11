# C-CORE 共享签名身份（Q-18 · J1S4-APIC-12）

本页是对既有 C-CORE v1 的语义细化，跟随提供方 J1S4-CORE-02：
`hanamesh-core` main `572d8532e2caf22b2474c1dd67453764867bdf0a` 的
`docs/API.md`「本机共享设备身份」与 `docs/CORE_CONTRACT.md`。
来源、归档 REPORT 校验信息见 [provenance.json](./provenance.json)。
包版本为 `@hanamesh/api-contracts` **0.6.0**，wire `protocolVersion: '1'` 不变。
方法、参数、返回字段、握手顺序、错误码集合与签名 canonical 都不变。
现有 `definition.*`、schema 与独立 provider fixture 保持原样；本页补充就绪条件，
包括 schema 中「available right after apply」说明的共享身份不可用例外。

## 身份范围和配置

同一 OS 用户、解析到同一共享根的 DSH 与 HanaMesh 客户端，通过
`getDeviceId()`、`getPublicKey()`、`sign(bytes)` 和 `signRequest(input)` 使用同一共享签名身份。
两个客户端仍有独立的 storage-domain；同意状态等本地状态不是共享签名身份的一部分。
这不表示不同 OS 用户或配置了不同根的客户端也会共享。

共享文件为 `<root>/identity/device.json`，目录权限 0700，文件权限 0600。
根的优先级为：插件配置 `sharedIdentityDir`（绝对路径）→ 环境变量
`HANAMESH_SHARED_HOME`（绝对路径）→ `~/.hanamesh-shared`。
默认根不在任何客户端自己的 home（`~/.dsh` 或 `~/.hanamesh`）内。
设置段显示实际路径；两边路径不同就不能依据“同一 OS 用户”推定身份相同。
产品入口 `dsh.mjs` 接入共享存储；直接调用未传入共享存储的 `local-only` 是测试替身路径。
共享存储格式与配置属于 Core 提供方，不是新增的 C-CORE 参数或消费方写入口；
消费方不得读取私钥、PKCS8 或直接写共享文件。

## 首次创建、采用和冲突

提供方先用 `wx` 写临时文件，再用 `link(2)` 占用最终名；已有最终文件不能被覆盖。
并发首次启动以先成功写入的共享文件为准，其他进程读回同一赢家。
这项文件/进程原子性由 Core 实现，下面的内存 FIXTURE 只模拟先写者获胜的结果。

| 共享身份 | 本客户端身份 | 提供方 `identity.source` | 行为 |
|---|---|---|---|
| 已有 | 相同 | `existing` | 使用共享身份，本地不变 |
| 已有 | 无 | `adopted` | 使用共享身份，写本客户端 `device` 镜像 |
| 已有 | 不同 | `conflict` | 共享身份胜出，保留被替换身份；旧注册复位 |
| 无 | 已有旧身份 | `migrated` | 旧身份原样成为共享身份 |
| 无 | 无 | `created` | 新建一次共享身份，写本地镜像 |

冲突时原身份（含私钥）仅由提供方在本客户端私有 `replacedDevices[]` 中保留，
不会暴露到 C-CORE 服务；`registration` 复位为 `unregistered`，随后按正常流程注册共享身份。
被替换身份在服务端仍是一台独立设备，它的待绑定分不会自动转入共享身份。
设置段显示被替换的设备 id 与这一边界。没有新增身份轮换或设备合并 API，
消费方不能把冲突处理解释为轮换、合并、余额迁移或服务端旧设备撤销。

## 失败关闭和恢复

共享文件不可读/不可写时，提供方诊断 `identity.reason` 为
`CORE_DEVICE_STORE_UNAVAILABLE`，`detail` 包含 errno；损坏时为 `CORE_DEVICE_CORRUPT`
（JSON 解析失败、字段缺失、密钥/公钥/deviceId 不一致）。
这些是提供方已有诊断，**不新增到 C-CORE 方法错误码集合**。

解析失败时不静默新建、不覆盖共享文件、不修改本客户端存储，不注册、不签名。
`getDeviceId`、`getPublicKey`、`sign`、`signRequest`、`getSession` 均以既有
`CORE_NOT_READY`（503）失败；不能回退到旧本地密钥继续签名。
兼容握手 `present` 只检查版本和方法形状，不证明共享身份已就绪。
`getConsent` 与 `getServerOrigin` 不因此变成身份就绪检查；离线 origin 的 `null` 仍不是错误。

诊断通过 Core 已有 `GET state` 与设置段呈现：`identity.status='failed'`，附原因和路径；
`GET state` 仍返回 200，其设备 id、公钥、session 为 `null`。
这个宿主状态投影不改变 C-CORE `SessionSnapshot` 的字段和非空 `deviceId` 形状：
服务的 `getSession()` 在此情况下抛 `CORE_NOT_READY`。
用户修复或主动移走问题文件后，通过既有「重新读取设备身份」动作（`POST refresh`）重新解析，
无需重启；问题未修复则继续失败关闭。
修复为有效的原共享文件后恢复原身份；主动移走后按上表重新解析，可能由已有本地身份迁入或新建。
这不是静默替换授权，也不提供新的轮换接口。`refresh` 属于已有宿主动作，不加入 C-CORE 服务方法。

## 消费入口和 FIXTURE 示例

按已发布 git tag 消费，入口仍是 `@hanamesh/api-contracts/core`：

```json
"@hanamesh/api-contracts": "git+https://github.com/yzsnstotz/hanamesh-api-contracts.git#v0.6.0"
```

新增导出 `createCoreSharedIdentityFixture()` 与 `createCoreSharedIdentityExamples()`。
两者均带 `CORE_FIXTURE_LABEL`；不导入产品模块，不接触 home、共享文件、真实凭据或服务器。
每个共享 fixture 代表一个已解析的共同根，创建的 provider 有独立服务对象和同意状态，
共享签名句柄只在内存保留。`existingIdentity` 只能传测试身份。
`identity()`、`refresh()`、`setFailure()`、`repair()` 全是 FIXTURE 控制，不是产品 API。

```js
import {
  createCoreSharedIdentityFixture, coreCanonicalRequest, verifyCoreSignature,
} from '@hanamesh/api-contracts/core';

const shared = createCoreSharedIdentityFixture(); // FIXTURE：同一已解析根
const dsh = shared.createProvider({ initialConsent: 'granted' });
const desktop = shared.createProvider({ initialConsent: 'withheld' });
console.assert(dsh.service !== desktop.service);
console.assert(dsh.service.getDeviceId() === desktop.service.getDeviceId());
console.assert(dsh.service.getPublicKey() === desktop.service.getPublicKey());
const input = { method: 'POST', path: '/v1/usage/events', body: new TextEncoder().encode('[]') };
console.assert(verifyCoreSignature(desktop.service.getPublicKey(), input.body, dsh.service.sign(input.body)));
const headers = await desktop.service.signRequest(input);
console.assert(verifyCoreSignature(dsh.service.getPublicKey(),
  coreCanonicalRequest(input, headers['x-hm-timestamp'], headers['x-hm-nonce']),
  Buffer.from(headers['x-hm-signature'], 'base64url')));

shared.setFailure('CORE_DEVICE_CORRUPT'); // FIXTURE：让下一次解析失败
const failed = shared.createProvider();
try { await failed.service.signRequest(input); }
catch (error) { console.assert(error.code === 'CORE_NOT_READY' && error.status === 503); }
shared.repair(); // FIXTURE：恢复原共享身份，不替换密钥
await failed.refresh();
console.assert(failed.service.getPublicKey() === dsh.service.getPublicKey());
```

`npm test` 覆盖独立 provider 共用身份、双向可验签、schema、先写者获胜、旧身份迁入、采用/冲突、
失败关闭及 refresh 恢复。并发用同进程 Promise 竞争，仅为 **FIXTURE** 语义检查，
不声称验证 `link(2)`、权限、跨进程竞争或两个真实客户端安装路径。
真实文件并发与权限检查的提供方证据在归档 REPORT；本卡不重新运行提供方测试，
也不将该报告的测试结果当作本卡产品验收。
