# Refund Protection Hook — Hackathon Submission

## One-liner
An opt-in refund-protection layer for new token pools: buyers can pay a premium at swap time to reserve a 24-hour refund right, while the pool/project earns fees and the vault limits total insured exposure.

## Why it fits Hook the Future

Refund Protection Hook uses the Uniswap v4 hook surface for a new launch-market behavior: optional refund rights created directly from swap execution. The design is native to the hook model because the protection decision is attached to `afterSwap`, where the adapter can observe the actual stable-in / project-token-out flow and forward only opted-in buys to the insurance core.

This is not a generic vault bolted beside a DEX. It is a pool-level launch primitive:

- Buyers get a transparent 24-hour refund option.
- Projects get a finite, configurable way to reduce launch anxiety.
- The vault gets hard exposure caps, dynamic pricing, and fee-funded reserve growth.
- X Layer gets a realistic onchain trading use case for early token launches.

## Problem solved

The hardest part of an early token launch is not only executing the buy. It is making the buyer's downside terms explicit before trust has been established. Most launch-pool protections are social, discretionary, or offchain: teams promise support in chat, reserve funds manually, or compensate users later. That creates ambiguity about who is covered, how much is covered, where the funds come from, and whether the actual swap result matches the promised protection.

Refund Protection Hook turns that vague promise into a bounded onchain primitive:

- Buyers can choose protection at swap time instead of relying on after-the-fact support.
- Projects can reduce launch anxiety without promising unlimited principal protection.
- The vault exposes the real available reserve and refuses orders that exceed configured capacity.
- The hook records the actual v4 swap amounts, so the refund right is based on real execution data.
- The state machine makes every order auditable: active, refunded, or finalized.

This makes the launch experience more credible for buyers and more controllable for projects. Good launches keep the premium revenue and release coverage after expiry; stressed launches consume reserve according to transparent rules.

## Product highlights

The strongest part of the product is that it creates aligned incentives for both sides of a launch pool:

- Buyer value: buyers can pay a clear insurance premium for a short-term onchain "right to regret." If they buy into a launch and later regret it, see unexpected downside, or lose confidence during the protection window, they can return the purchased project tokens and receive a capped stablecoin refund after a transparent refund fee. The buyer knows the rules before opting in.
- Project value: a confident project can voluntarily enable this mechanism to signal quality and reduce launch anxiety. If most buyers do not refund, the project can keep earning a share of the premium revenue. If a buyer does refund, the refund fee also creates fee revenue. The project is not promising unlimited protection; it is accepting bounded, parameterized risk in exchange for stronger buyer trust and recurring fee participation.
- Vault/protocol value: premium and refund-fee flows can grow reserves and create protocol revenue. Healthy launches strengthen the reserve over time; stressed launches consume reserve according to visible rules rather than ad hoc promises.

This turns refund protection into both a buyer-risk-management tool and a project-side trust/monetization primitive.

## Core mechanism

The mechanism is an opt-in refund right attached to a Uniswap v4 swap:

1. A project configures a stable-token/project-token pair with order limits, protection duration, premium bps, refund fee bps, payout bps, and vault exposure cap.
2. The reserve vault holds stablecoin liquidity that backs protected orders.
3. A buyer swaps stablecoin into the project token and passes `hookData` indicating they want protection.
4. The v4 `afterSwap` adapter reads the real swap flow and records only eligible opted-in buys.
5. The core contract charges the premium, computes the maximum payout, and locks that exposure in the vault.
6. During the protection window, the buyer can return the purchased project tokens and receive the stablecoin payout after refund fee.
7. If the buyer does not refund, anyone can finalize the order after expiry and release the reserved exposure.
8. Premium and refund-fee revenue is split across project treasury, protocol treasury, and reserve growth.

The important product choice is that protection is voluntary and bounded. Buyers pay for the right; projects and vaults cap their maximum risk.

## Implementation logic

The implementation is split into focused contracts and scripts:

- `RefundInsuranceVault` holds stablecoin reserves, tracks locked exposure, pays refunds, releases expired exposure, and distributes fees. Only the configured hook/core can move reserve accounting.
- `RefundProtectionHook` is the main state machine. It stores pair configs, quotes dynamic premiums, records protected orders, validates limits, handles `refund(orderId)`, and handles `finalize(orderId)`.
- `UniswapV4RefundProtectionAdapter` is the real Uniswap v4 `BaseHook`. It enables `afterSwap`, decodes opt-in `hookData`, derives token input/output and amounts from `BalanceDelta`, and forwards the protected buy to the core.
- `UniswapV4DemoHelper` is a small mainnet demonstration helper. It adds minimal mock liquidity and runs a protected v4 swap so the submission includes real X Layer transactions without requiring expensive real-market liquidity.
- Deployment scripts handle the full path: core deployment, CREATE2 hook-address mining for v4 permission bits, adapter deployment, authorized-recorder wiring, pool initialization, demo liquidity, protected swap, and refund.

Runtime flow:

```text
buyer swap with hookData
-> PoolManager calls adapter.afterSwap
-> adapter calls RefundProtectionHook.recordProtectedSwap
-> core collects premium and locks vault exposure
-> buyer calls refund before deadline or anyone finalizes after expiry
-> vault pays/refunds or releases exposure
```

## What is implemented
- Insurance vault with project/protocol/reserve fee split.
- Pair-level config: min/max order, per-user window cap, protection duration, premium bps, refund fee bps, payout bps, exposure cap.
- Protected swap recorder designed to be called by a Uniswap v4 `afterSwap` hook adapter.
- Real compile-capable Uniswap v4 adapter in `src/UniswapV4RefundProtectionAdapter.sol`.
- Hook-address mining helper for Uniswap v4 permission-bit deployment.
- CREATE2 adapter deployment script that deploys the mined hook address and sets it as the authorized recorder.
- Pool initialization script for a hook-enabled Uniswap v4 PoolManager key.
- X Layer mainnet deployment using the official Uniswap v4 PoolManager.
- Onchain v4 demo helper that adds small mock liquidity, runs a protected v4 swap, and refunds the order.
- Judge-readiness score gate that prevents a false 9.5+ claim unless live Hook, Pool, demo, and social evidence are present.
- Remotion demo video project with voiceover and rendered submission video artifact.
- Refund path: buyer returns the received project token and receives the protected stable payout minus refund fee.
- Finalize path: after the refund window expires, locked exposure is released.
- Full local tests using `solc-js + ganache + ethers`.
- Local demo script covering buy -> refund -> buy -> finalize.

## Test result
Run:

```bash
npm install
npm run compile
npm test
npm run demo
```

Current local result:

```text
Compiled 28 source files with solc 0.8.26
22 passing
```

Covered flows:
1. Record protected swap, collect premium, lock exposure.
2. Authorized adapter / recorder enforcement.
3. Authorized recorder rotation.
4. Refund inside the window, charge refund fee, close exposure.
5. Dynamic premium increases with vault utilization.
6. Finalize after deadline, release exposure.
7. Per-order limit enforcement.
8. Per-user rolling window limit enforcement.
9. Bad config rejection.
10. Disabled protection rejection.
11. Vault capacity enforcement.
12. Non-buyer refund rejection.
13. Expired refund rejection.
14. Token-balance enforcement on refund.
15. Fee split verification.
16. v4 afterSwap permission flag validation.
17. CREATE2 hook address prediction.
18. v4 PoolKey currency sorting.
19. Score gate keeps the estimate below 9.5 when live X Layer addresses are missing.
20. Score gate allows 9.5+ only when live deployment, demo, and social evidence are present.
21. v4 demo helper compiles for mainnet liquidity/swap evidence.
22. v4 PoolId and hookData encoding are deterministic.

## X Layer fit
The contracts are deployed on X Layer mainnet Chain ID `196` using the official Uniswap v4 X Layer PoolManager `0x360e68faccca8ca495c1b759fd9eee466db9fb32`.

Live deployment summary:

- MockUSDC: `0xaB1Af2cfcdF92b8e0d5F11c3Ae03566409a1c448`
- MockTOKEN: `0x8d83D745f0Bddf0a96a0ebbaA14082f252faAdc1`
- RefundInsuranceVault: `0xee08015700a1F61c9406bF8aD6DB1Bd28B0790B8`
- RefundProtectionHook core: `0x20610fFe1600aa4eB30a14dB5A5D7E8345d65330`
- UniswapV4RefundProtectionAdapter: `0x467E54D02588c0aeCdC09AaC448913dF2E038040`
- UniswapV4DemoHelper: `0xD04FA31A81DEb525bCC7c1575373205519D1AdA6`
- PoolId: `0xbd34d3fb81a600f242fd70efac60d1cb1925b83c154e9e77d37a997fcad3e6b2`
- Pool initialize tx: `0xf71b64fd1ed407c5cc3962664df23c1849942ba898a4435c6f8035153204cf42`
- Protected v4 swap tx: `0x804f1ad299c6c82111ac79a6941eed24db1314878bff8bef738299a6ad3b446e`
- Refund tx: `0xb1dbae1cb20d7364ab8bb1092d08975b8bcb05e3b522d1e63ea4a0c9789ed93b`

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

## Submission status

- Core contracts: deployed on X Layer mainnet
- Real v4 adapter: deployed on X Layer mainnet
- CREATE2 adapter deployment: complete
- v4 pool initialization: complete
- Onchain protected swap + refund: complete
- Local tests: passing
- Demo script: ready
- Remotion demo video: generated locally at `demo-video/out/refund-protection-demo.mp4`
- Judge score gate: ready
- X Layer deployment script: ready
- Live X Layer addresses: filled in `DEPLOYMENTS.md`
- Project X account: `https://x.com/changsidne`
- Project X post: `https://x.com/changsidne/status/2059262123138855255`

## Onchain proof

All listed deployment and demo transactions were checked for `receipt.status = 1`. After the protected swap and refund, `RefundProtectionHook.orders(1).status` is `2`, meaning `REFUNDED`, and `authorizedRecorder` is the deployed v4 adapter.

## Social proof

- Project X account: `https://x.com/changsidne`
- Project X post: `https://x.com/changsidne/status/2059262123138855255`
