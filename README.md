# Refund Protection Hook

`X Layer Mainnet` · `Uniswap v4 Hook` · `afterSwap` · `Refund Protection` · `22 Tests Passing`

[English](#english) | [简体中文](#简体中文)

## Hackathon Submission Quick Links / 黑客松提交快速入口

> Judges can use this section as the 30-second proof map: project links, live X Layer deployment, PoolId, and the key onchain transactions are all here.

| Item | Link |
|---|---|
| GitHub Repository | [github.com/sidney061212-ai/refund-protection-hook](https://github.com/sidney061212-ai/refund-protection-hook) |
| Demo Video | [X post video](https://x.com/changsidne/status/2059598710171160976) |
| Full Chinese Explanation Post | [X explanation thread](https://x.com/changsidne/status/2059600372616909013) |
| Project X Account | [@changsidne](https://x.com/changsidne) |
| Deployment Details | [DEPLOYMENTS.md](./DEPLOYMENTS.md) |
| Test Report | [TEST_REPORT.md](./TEST_REPORT.md) |
| Hackathon Submission Summary | [HACKATHON_SUBMISSION.md](./HACKATHON_SUBMISSION.md) |

### Mainnet Proof Snapshot

- Network: `X Layer Mainnet`
- Chain ID: `196`
- Explorer: [OKLink X Layer](https://www.oklink.com/xlayer)
- Official Uniswap v4 PoolManager: [`0x360e68faccca8ca495c1b759fd9eee466db9fb32`](https://www.oklink.com/xlayer/address/0x360e68faccca8ca495c1b759fd9eee466db9fb32)
- Hook Adapter: [`0x467E54D02588c0aeCdC09AaC448913dF2E038040`](https://www.oklink.com/xlayer/address/0x467E54D02588c0aeCdC09AaC448913dF2E038040)
- Core Contract: [`0x20610fFe1600aa4eB30a14dB5A5D7E8345d65330`](https://www.oklink.com/xlayer/address/0x20610fFe1600aa4eB30a14dB5A5D7E8345d65330)
- PoolId: `0xbd34d3fb81a600f242fd70efac60d1cb1925b83c154e9e77d37a997fcad3e6b2`

| Proof | Transaction Hash |
|---|---|
| Pool initialized | [`0xf71b64fd1ed407c5cc3962664df23c1849942ba898a4435c6f8035153204cf42`](https://www.oklink.com/xlayer/tx/0xf71b64fd1ed407c5cc3962664df23c1849942ba898a4435c6f8035153204cf42) |
| Add small v4 liquidity | [`0xf8f554cd4fcd58bd5f8d05ab7ad4b261a2f77d66cf9ff6be52137cc4241ffc7a`](https://www.oklink.com/xlayer/tx/0xf8f554cd4fcd58bd5f8d05ab7ad4b261a2f77d66cf9ff6be52137cc4241ffc7a) |
| Protected v4 swap | [`0x804f1ad299c6c82111ac79a6941eed24db1314878bff8bef738299a6ad3b446e`](https://www.oklink.com/xlayer/tx/0x804f1ad299c6c82111ac79a6941eed24db1314878bff8bef738299a6ad3b446e) |
| Refund order `#1` | [`0xb1dbae1cb20d7364ab8bb1092d08975b8bcb05e3b522d1e63ea4a0c9789ed93b`](https://www.oklink.com/xlayer/tx/0xb1dbae1cb20d7364ab8bb1092d08975b8bcb05e3b522d1e63ea4a0c9789ed93b) |

## English

### What is Refund Protection Hook?

Refund Protection Hook is a Uniswap v4 `afterSwap` hook for safer token launches on X Layer. It lets buyers opt into capped 24-hour refund protection when swapping stablecoins for newly launched tokens. Buyers pay a premium to reserve a temporary refund right. The vault locks bounded coverage. If the buyer refunds within the window, they return the purchased tokens and receive a partial stablecoin refund after fees. If they do not refund, the order finalizes and the reserved coverage is released.

This gives launch buyers a clear downside rule at the moment of swap, instead of relying on vague social promises from a project team or LP. It also gives projects a way to signal confidence: if they believe in the launch, they can offer bounded protection, collect a share of premiums, and earn a share of penalties when buyers refund.

This is not unlimited principal protection. It is optional, capped, time-limited, and onchain verifiable.

### Why it matters

- Early buyers fear being dumped on immediately.
- Launch pools often rely on vague social promises.
- LPs can withdraw liquidity, which increases buyer anxiety.
- Projects need early users, but users need explicit downside terms.
- This hook turns launch trust into an onchain rule.

### Core Flow

1. Project creates/configures a protected TOKEN / stablecoin pool.
2. Buyer swaps stablecoin for the new token.
3. Buyer optionally passes `hookData` to opt into refund protection.
4. Uniswap v4 PoolManager calls the `afterSwap` hook.
5. The hook adapter records the actual swap result into the core contract.
6. The buyer pays a premium.
7. The vault locks capped coverage.
8. During the protection window, the buyer can return the purchased token and receive a partial stablecoin refund after fees.
9. If the buyer does not refund, the order can be finalized and coverage is released.

### Architecture

| Component | Role |
|---|---|
| `RefundProtectionHook` | Core state machine. Records protected orders, quotes premiums, handles refund/finalize. |
| `RefundInsuranceVault` | Holds reserves, locks exposure, pays refunds, distributes fees. |
| `UniswapV4RefundProtectionAdapter` | Real Uniswap v4 `BaseHook` adapter. Enables `afterSwap` and forwards opted-in buys to the core. |
| `UniswapV4DemoHelper` | Mainnet demo helper for adding small demo liquidity and executing protected v4 swap evidence. |
| `MockUSDC` / `MockTOKEN` | Demo tokens used for live X Layer mainnet proof. |

### Live X Layer Mainnet Deployment

- Network: `X Layer Mainnet`
- Chain ID: `196`
- Explorer: [https://www.oklink.com/xlayer](https://www.oklink.com/xlayer)
- Official Uniswap v4 PoolManager: [`0x360e68faccca8ca495c1b759fd9eee466db9fb32`](https://www.oklink.com/xlayer/address/0x360e68faccca8ca495c1b759fd9eee466db9fb32)

The contracts are deployed on X Layer mainnet and linked with onchain transaction proof.

| Contract | Address | Explorer |
|---|---|---|
| `MockUSDC` | [`0xaB1Af2cfcdF92b8e0d5F11c3Ae03566409a1c448`](https://www.oklink.com/xlayer/address/0xaB1Af2cfcdF92b8e0d5F11c3Ae03566409a1c448) | [OKLink](https://www.oklink.com/xlayer/address/0xaB1Af2cfcdF92b8e0d5F11c3Ae03566409a1c448) |
| `MockTOKEN` | [`0x8d83D745f0Bddf0a96a0ebbaA14082f252faAdc1`](https://www.oklink.com/xlayer/address/0x8d83D745f0Bddf0a96a0ebbaA14082f252faAdc1) | [OKLink](https://www.oklink.com/xlayer/address/0x8d83D745f0Bddf0a96a0ebbaA14082f252faAdc1) |
| `RefundInsuranceVault` | [`0xee08015700a1F61c9406bF8aD6DB1Bd28B0790B8`](https://www.oklink.com/xlayer/address/0xee08015700a1F61c9406bF8aD6DB1Bd28B0790B8) | [OKLink](https://www.oklink.com/xlayer/address/0xee08015700a1F61c9406bF8aD6DB1Bd28B0790B8) |
| `RefundProtectionHook core` | [`0x20610fFe1600aa4eB30a14dB5A5D7E8345d65330`](https://www.oklink.com/xlayer/address/0x20610fFe1600aa4eB30a14dB5A5D7E8345d65330) | [OKLink](https://www.oklink.com/xlayer/address/0x20610fFe1600aa4eB30a14dB5A5D7E8345d65330) |
| `UniswapV4RefundProtectionAdapter` | [`0x467E54D02588c0aeCdC09AaC448913dF2E038040`](https://www.oklink.com/xlayer/address/0x467E54D02588c0aeCdC09AaC448913dF2E038040) | [OKLink](https://www.oklink.com/xlayer/address/0x467E54D02588c0aeCdC09AaC448913dF2E038040) |
| `UniswapV4DemoHelper` | [`0xD04FA31A81DEb525bCC7c1575373205519D1AdA6`](https://www.oklink.com/xlayer/address/0xD04FA31A81DEb525bCC7c1575373205519D1AdA6) | [OKLink](https://www.oklink.com/xlayer/address/0xD04FA31A81DEb525bCC7c1575373205519D1AdA6) |

### Pool Proof

PoolId:

```text
0xbd34d3fb81a600f242fd70efac60d1cb1925b83c154e9e77d37a997fcad3e6b2
```

PoolKey:

```json
{
  "currency0": "0x8d83d745f0bddf0a96a0ebbaa14082f252faadc1",
  "currency1": "0xab1af2cfcdf92b8e0d5f11c3ae03566409a1c448",
  "fee": 3000,
  "tickSpacing": 60,
  "hooks": "0x467E54D02588c0aeCdC09AaC448913dF2E038040"
}
```

### Key Onchain Transactions

| Proof | Transaction Hash | Explorer |
|---|---|---|
| Pool initialized | [`0xf71b64fd1ed407c5cc3962664df23c1849942ba898a4435c6f8035153204cf42`](https://www.oklink.com/xlayer/tx/0xf71b64fd1ed407c5cc3962664df23c1849942ba898a4435c6f8035153204cf42) | [OKLink](https://www.oklink.com/xlayer/tx/0xf71b64fd1ed407c5cc3962664df23c1849942ba898a4435c6f8035153204cf42) |
| Add small v4 liquidity | [`0xf8f554cd4fcd58bd5f8d05ab7ad4b261a2f77d66cf9ff6be52137cc4241ffc7a`](https://www.oklink.com/xlayer/tx/0xf8f554cd4fcd58bd5f8d05ab7ad4b261a2f77d66cf9ff6be52137cc4241ffc7a) | [OKLink](https://www.oklink.com/xlayer/tx/0xf8f554cd4fcd58bd5f8d05ab7ad4b261a2f77d66cf9ff6be52137cc4241ffc7a) |
| Protected v4 swap | [`0x804f1ad299c6c82111ac79a6941eed24db1314878bff8bef738299a6ad3b446e`](https://www.oklink.com/xlayer/tx/0x804f1ad299c6c82111ac79a6941eed24db1314878bff8bef738299a6ad3b446e) | [OKLink](https://www.oklink.com/xlayer/tx/0x804f1ad299c6c82111ac79a6941eed24db1314878bff8bef738299a6ad3b446e) |
| Refund order `#1` | [`0xb1dbae1cb20d7364ab8bb1092d08975b8bcb05e3b522d1e63ea4a0c9789ed93b`](https://www.oklink.com/xlayer/tx/0xb1dbae1cb20d7364ab8bb1092d08975b8bcb05e3b522d1e63ea4a0c9789ed93b) | [OKLink](https://www.oklink.com/xlayer/tx/0xb1dbae1cb20d7364ab8bb1092d08975b8bcb05e3b522d1e63ea4a0c9789ed93b) |

### Onchain State Verified

After the live demo:

- `RefundProtectionHook.authorizedRecorder()` = [`0x467E54D02588c0aeCdC09AaC448913dF2E038040`](https://www.oklink.com/xlayer/address/0x467E54D02588c0aeCdC09AaC448913dF2E038040)
- `RefundInsuranceVault.hook()` = [`0x20610fFe1600aa4eB30a14dB5A5D7E8345d65330`](https://www.oklink.com/xlayer/address/0x20610fFe1600aa4eB30a14dB5A5D7E8345d65330)
- Order `#1` status = `2`, meaning `REFUNDED`
- Order `#1` principal = `1000000` `MockUSDC` units, equal to `1.0` `MockUSDC`
- Order `#1` token out = `499248` `MockTOKEN` base units

### How Judges Can Verify in 60 Seconds

1. Open the Hook Adapter address and confirm it is on X Layer.
2. Open the Pool initialization transaction and confirm success.
3. Open the Protected v4 swap transaction and confirm success.
4. Open the Refund transaction and confirm success.
5. Check [DEPLOYMENTS.md](./DEPLOYMENTS.md) for the full PoolKey, PoolId, and transaction list.
6. Run `npm run check` locally to compile and execute the full test suite.

### Local Verification

```bash
npm install
npm run compile
npm test
npm run demo
npm run check
```

Expected result:

```text
Compiled 28 source files with solc 0.8.26
22 passing
```

### Repository Map

- `src/RefundProtectionHook.sol`
- `src/RefundInsuranceVault.sol`
- `src/UniswapV4RefundProtectionAdapter.sol`
- `src/UniswapV4DemoHelper.sol`
- `test/`
- `scripts/`
- `DEPLOYMENTS.md`
- `TEST_REPORT.md`
- `HACKATHON_SUBMISSION.md`
- `MECHANISM.md`
- `demo-video/`

The `demo-video/` folder contains local Remotion rendering assets. The public hackathon demo video is the X post linked in the quick links section above.

## 简体中文

### 项目是什么？

Refund Protection Hook 是一个部署在 `X Layer Mainnet` 上的 Uniswap v4 `afterSwap` Hook。它给新币发行池增加一层可选、限额、24 小时的链上退款保护。

用户买入新 Token 时，可以额外支付一笔保险费，获得一段时间内的退款权。如果用户后悔，可以在保护期内归还买到的 Token，并拿回扣费后的稳定币。如果用户不退款，订单最终确认，锁定的承保额度释放，保险费沉淀进保险池。

对买家来说，这像是给早期买入加了一个明确的退出规则：不是买完只能祈祷项目方别砸盘。对项目方来说，如果它真的相信自己的项目质量，就可以主动加入这个机制，通过保险费分成和退款违约金分成获得持续收益，同时把“我会保护用户”变成链上规则。

这不是无限保本，也不是项目方口头承诺，而是 optional、capped、time-limited、onchain verifiable 的链上规则。

### 解决什么问题？

- 早期买家怕刚买就被砸盘。
- 早期池子怕流动性突然被抽走。
- 很多项目只能靠口头承诺安抚用户。
- 用户不知道谁能赔、赔多少、钱在哪里、规则是否会变。
- 这个 Hook 把“相信项目方”变成“相信链上规则”。

### 核心流程

1. 项目方创建或配置 TOKEN / 稳定币交易池。
2. 用户用稳定币买入新 Token。
3. 用户可以通过 `hookData` 勾选退款保护。
4. Uniswap v4 PoolManager 在 swap 后触发 `afterSwap` Hook。
5. Hook adapter 根据真实 swap 结果记录订单。
6. 用户支付保险费。
7. Vault 锁定对应承保额度。
8. 24 小时内，用户可以归还 Token，拿回扣费后的稳定币。
9. 如果用户不退款，订单 `finalize`，承保额度释放。

### 架构组件

| 组件 | 作用 |
|---|---|
| `RefundProtectionHook` | 核心状态机，记录保护订单、报价保险费、处理退款和最终确认。 |
| `RefundInsuranceVault` | 管理保险储备、锁定承保额度、支付退款、分配费用。 |
| `UniswapV4RefundProtectionAdapter` | 真正的 Uniswap v4 `BaseHook` adapter，启用 `afterSwap` 并把用户勾选的买入转发到核心合约。 |
| `UniswapV4DemoHelper` | 主网演示辅助合约，用于添加少量 v4 流动性并执行 protected v4 swap 证据。 |
| `MockUSDC` / `MockTOKEN` | 用于 X Layer mainnet 真实证明的演示 Token。 |

### 链上部署信息

- Network: `X Layer Mainnet`
- Chain ID: `196`
- Explorer: [https://www.oklink.com/xlayer](https://www.oklink.com/xlayer)
- PoolManager: [`0x360e68faccca8ca495c1b759fd9eee466db9fb32`](https://www.oklink.com/xlayer/address/0x360e68faccca8ca495c1b759fd9eee466db9fb32)

合约已部署在 X Layer mainnet，并提供链上交易证据。

| 合约 | 地址 | 浏览器链接 |
|---|---|---|
| `MockUSDC` | [`0xaB1Af2cfcdF92b8e0d5F11c3Ae03566409a1c448`](https://www.oklink.com/xlayer/address/0xaB1Af2cfcdF92b8e0d5F11c3Ae03566409a1c448) | [OKLink](https://www.oklink.com/xlayer/address/0xaB1Af2cfcdF92b8e0d5F11c3Ae03566409a1c448) |
| `MockTOKEN` | [`0x8d83D745f0Bddf0a96a0ebbaA14082f252faAdc1`](https://www.oklink.com/xlayer/address/0x8d83D745f0Bddf0a96a0ebbaA14082f252faAdc1) | [OKLink](https://www.oklink.com/xlayer/address/0x8d83D745f0Bddf0a96a0ebbaA14082f252faAdc1) |
| `RefundInsuranceVault` | [`0xee08015700a1F61c9406bF8aD6DB1Bd28B0790B8`](https://www.oklink.com/xlayer/address/0xee08015700a1F61c9406bF8aD6DB1Bd28B0790B8) | [OKLink](https://www.oklink.com/xlayer/address/0xee08015700a1F61c9406bF8aD6DB1Bd28B0790B8) |
| `RefundProtectionHook core` | [`0x20610fFe1600aa4eB30a14dB5A5D7E8345d65330`](https://www.oklink.com/xlayer/address/0x20610fFe1600aa4eB30a14dB5A5D7E8345d65330) | [OKLink](https://www.oklink.com/xlayer/address/0x20610fFe1600aa4eB30a14dB5A5D7E8345d65330) |
| `UniswapV4RefundProtectionAdapter` | [`0x467E54D02588c0aeCdC09AaC448913dF2E038040`](https://www.oklink.com/xlayer/address/0x467E54D02588c0aeCdC09AaC448913dF2E038040) | [OKLink](https://www.oklink.com/xlayer/address/0x467E54D02588c0aeCdC09AaC448913dF2E038040) |
| `UniswapV4DemoHelper` | [`0xD04FA31A81DEb525bCC7c1575373205519D1AdA6`](https://www.oklink.com/xlayer/address/0xD04FA31A81DEb525bCC7c1575373205519D1AdA6) | [OKLink](https://www.oklink.com/xlayer/address/0xD04FA31A81DEb525bCC7c1575373205519D1AdA6) |

### Pool 证明

PoolId:

```text
0xbd34d3fb81a600f242fd70efac60d1cb1925b83c154e9e77d37a997fcad3e6b2
```

PoolKey:

```json
{
  "currency0": "0x8d83d745f0bddf0a96a0ebbaa14082f252faadc1",
  "currency1": "0xab1af2cfcdf92b8e0d5f11c3ae03566409a1c448",
  "fee": 3000,
  "tickSpacing": 60,
  "hooks": "0x467E54D02588c0aeCdC09AaC448913dF2E038040"
}
```

### 关键链上交易

| 证明内容 | 交易哈希 | 浏览器链接 |
|---|---|---|
| Pool 初始化 | [`0xf71b64fd1ed407c5cc3962664df23c1849942ba898a4435c6f8035153204cf42`](https://www.oklink.com/xlayer/tx/0xf71b64fd1ed407c5cc3962664df23c1849942ba898a4435c6f8035153204cf42) | [OKLink](https://www.oklink.com/xlayer/tx/0xf71b64fd1ed407c5cc3962664df23c1849942ba898a4435c6f8035153204cf42) |
| 添加少量 v4 流动性 | [`0xf8f554cd4fcd58bd5f8d05ab7ad4b261a2f77d66cf9ff6be52137cc4241ffc7a`](https://www.oklink.com/xlayer/tx/0xf8f554cd4fcd58bd5f8d05ab7ad4b261a2f77d66cf9ff6be52137cc4241ffc7a) | [OKLink](https://www.oklink.com/xlayer/tx/0xf8f554cd4fcd58bd5f8d05ab7ad4b261a2f77d66cf9ff6be52137cc4241ffc7a) |
| Protected v4 swap | [`0x804f1ad299c6c82111ac79a6941eed24db1314878bff8bef738299a6ad3b446e`](https://www.oklink.com/xlayer/tx/0x804f1ad299c6c82111ac79a6941eed24db1314878bff8bef738299a6ad3b446e) | [OKLink](https://www.oklink.com/xlayer/tx/0x804f1ad299c6c82111ac79a6941eed24db1314878bff8bef738299a6ad3b446e) |
| Refund order `#1` | [`0xb1dbae1cb20d7364ab8bb1092d08975b8bcb05e3b522d1e63ea4a0c9789ed93b`](https://www.oklink.com/xlayer/tx/0xb1dbae1cb20d7364ab8bb1092d08975b8bcb05e3b522d1e63ea4a0c9789ed93b) | [OKLink](https://www.oklink.com/xlayer/tx/0xb1dbae1cb20d7364ab8bb1092d08975b8bcb05e3b522d1e63ea4a0c9789ed93b) |

### 链上状态验证

实盘演示后：

- `RefundProtectionHook.authorizedRecorder()` = [`0x467E54D02588c0aeCdC09AaC448913dF2E038040`](https://www.oklink.com/xlayer/address/0x467E54D02588c0aeCdC09AaC448913dF2E038040)
- `RefundInsuranceVault.hook()` = [`0x20610fFe1600aa4eB30a14dB5A5D7E8345d65330`](https://www.oklink.com/xlayer/address/0x20610fFe1600aa4eB30a14dB5A5D7E8345d65330)
- Order `#1` status = `2`，代表 `REFUNDED`
- Order `#1` principal = `1000000` `MockUSDC` units，也就是 `1.0` `MockUSDC`
- Order `#1` token out = `499248` `MockTOKEN` base units

### 评委如何快速验证？

1. 打开 Hook Adapter 地址，确认合约在 X Layer 上。
2. 打开 Pool 初始化交易，确认成功。
3. 打开 protected v4 swap 交易，确认成功。
4. 打开 refund 交易，确认成功。
5. 查看 [DEPLOYMENTS.md](./DEPLOYMENTS.md) 的 PoolKey、PoolId 和完整交易列表。
6. 本地运行 `npm run check`，确认 `22 passing`。

### 本地验证

```bash
npm install
npm run compile
npm test
npm run demo
npm run check
```

预期结果：

```text
Compiled 28 source files with solc 0.8.26
22 passing
```

### 仓库结构

- `src/RefundProtectionHook.sol`
- `src/RefundInsuranceVault.sol`
- `src/UniswapV4RefundProtectionAdapter.sol`
- `src/UniswapV4DemoHelper.sol`
- `test/`
- `scripts/`
- `DEPLOYMENTS.md`
- `TEST_REPORT.md`
- `HACKATHON_SUBMISSION.md`
- `MECHANISM.md`
- `demo-video/`

`demo-video/` 是本地 Remotion 渲染素材和产物目录。公开提交视频请以顶部快速入口里的 X 视频链接为准。
