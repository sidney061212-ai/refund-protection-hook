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

## What is implemented
- Insurance vault with project/protocol/reserve fee split.
- Pair-level config: min/max order, per-user window cap, protection duration, premium bps, refund fee bps, payout bps, exposure cap.
- Protected swap recorder designed to be called by a Uniswap v4 `afterSwap` hook adapter.
- Real compile-capable Uniswap v4 adapter in `src/UniswapV4RefundProtectionAdapter.sol`.
- Hook-address mining helper for Uniswap v4 permission-bit deployment.
- CREATE2 adapter deployment script that deploys the mined hook address and sets it as the authorized recorder.
- Pool initialization script for a hook-enabled Uniswap v4 PoolManager key.
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
Compiled 24 source files with solc 0.8.26
18 passing
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

## X Layer fit
The contracts are EVM-compatible Solidity `0.8.26`. X Layer mainnet Chain ID is `196`, and the official Uniswap v4 X Layer PoolManager is `0x360e68faccca8ca495c1b759fd9eee466db9fb32`. X Layer testnet Chain ID is `1952`; testnet deployment needs a live or self-deployed v4 PoolManager address.

## Submission status

- Core contracts: ready
- Real v4 adapter: ready and compiling
- CREATE2 adapter deployment: scripted
- v4 pool initialization: scripted
- Local tests: passing
- Demo script: ready
- X Layer deployment script: ready
- Live X Layer addresses: pending funded deployer key / testnet gas

## Remaining live-network step

This repository now includes the real `BaseHook` adapter, hook-address mining, CREATE2 adapter deployment, recorder wiring, and v4 pool initialization scripts. The remaining step for a full onchain submission is broadcasting deployment transactions with a funded X Layer wallet, creating the hook-enabled v4 pool, and filling the resulting addresses into `DEPLOYMENTS.md`.

No unverified live addresses are included in this submission package.
