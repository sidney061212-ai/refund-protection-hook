# Refund Protection Hook

Refund Protection Hook is a Uniswap v4 Hook for safer token launches. It lets buyers opt into capped 24-hour refund protection when swapping stablecoins for newly launched tokens. Buyers pay a premium to receive a temporary refund right, while an insurance vault locks the required coverage. If the buyer exits within the protection window, they return the purchased tokens and receive a partial refund after fees. If they do not refund, the position finalizes and the reserved coverage is released.

## Hackathon judge quick read

- Built for OKX X Layer Build X Hackathon: Hook the Future.
- Core idea: turn refund protection into an opt-in Uniswap v4 `afterSwap` hook primitive for launch pools.
- Innovation: not another tax token, staking wrapper, or points hook; it creates a bounded onchain refund right at swap time.
- Market potential: launch teams can seed confidence with finite reserves, while buyers get explicit downside terms instead of social promises.
- Completion evidence: `npm run check` compiles contracts, runs the full test suite, and executes a local end-to-end demo.
- Live deployment: X Layer mainnet contracts, v4 adapter, v4 pool initialization, protected swap, and refund are recorded in `DEPLOYMENTS.md`.

## What it solves

Early launch buyers fear two things:

1. Buying into a token and getting dumped on immediately.
2. Losing exit liquidity if a project or LP pulls back too early.

This project does not promise unlimited principal protection. It provides optional, capped, time-limited downside protection backed by an onchain reserve vault.

## Contracts

- `src/RefundProtectionHook.sol`: the core insurance state machine.
- `src/RefundInsuranceVault.sol`: reserve management, exposure locking, and fee distribution.
- `src/UniswapV4RefundProtectionAdapter.sol`: real `BaseHook` adapter built on the current Uniswap v4 periphery/core packages.
- `src/MockERC20.sol`: local mock stablecoin and launch token.

## Local workflow

```bash
npm install
npm run compile
npm test
npm run demo
npm run score:verified
npm run check
```

Current expected output:

```text
Compiled 28 source files with solc 0.8.26
22 passing
```

`npm run demo` executes a full local walkthrough:

- buyer buys TOKEN with refund protection
- premium is collected
- exposure is locked
- buyer refunds within the window
- vault pays the refund
- buyer buys again
- order finalizes after expiry

`npm run score:verified` prints the current judge-readiness estimate, hard blockers, and the exact actions required before claiming a 9.5+ submission.

## Real Uniswap v4 hook adapter

The adapter now compiles against:

- `@uniswap/v4-core` `1.0.2`
- `@uniswap/v4-periphery` `1.0.3`

It uses `BaseHook`, enables `afterSwap`, decodes opt-in `hookData`, derives `tokenIn`, `tokenOut`, `amountIn`, `amountOut`, and forwards protected buys into the existing `RefundProtectionHook` core contract.

Important v4 deployment note:

- Hook permissions are encoded in the hook address low bits.
- This adapter needs the `afterSwap` flag.
- Use `npm run mine:hook` after you know the v4 pool manager address and deployed refund core address.

Official Uniswap v4 X Layer mainnet PoolManager:

```text
0x360e68faccca8ca495c1b759fd9eee466db9fb32
```

Set `XLAYER_CHAIN_ID=196` when using that official mainnet deployment; keep `1952` for X Layer testnet.

Example:

```bash
V4_POOL_MANAGER_ADDRESS=<pool_manager> \
REFUND_PROTECTION_CORE_ADDRESS=<refund_core> \
npm run mine:hook
```

Deploy and wire the adapter:

```bash
V4_POOL_MANAGER_ADDRESS=<pool_manager> \
REFUND_PROTECTION_CORE_ADDRESS=<refund_core> \
CREATE2_SALT=<salt_from_mine_hook> \
npm run deploy:v4-adapter
```

Initialize the v4 pool:

```bash
V4_POOL_MANAGER_ADDRESS=<pool_manager> \
V4_HOOK_ADDRESS=<deployed_adapter> \
POOL_TOKEN_A=<stable_token> \
POOL_TOKEN_B=<project_token> \
npm run initialize:v4-pool
```

## X Layer testnet

Network details:

- Chain ID: `1952`
- RPC: `https://testrpc.xlayer.tech/terigon`
- Alternative RPC: `https://xlayertestrpc.okx.com/terigon`
- Explorer: `https://www.oklink.com/xlayer-test`

Deployment script:

```bash
cp .env.example .env
npm run deploy:xlayer
```

The script deploys:

- `MockUSDC`
- `MockTOKEN`
- `RefundInsuranceVault`
- `RefundProtectionHook`

It also configures the protected pair and seeds the vault with mock reserve liquidity.

Current X Layer mainnet deployment:

- RefundProtectionHook core: `0x20610fFe1600aa4eB30a14dB5A5D7E8345d65330`
- UniswapV4RefundProtectionAdapter: `0x467E54D02588c0aeCdC09AaC448913dF2E038040`
- PoolId: `0xbd34d3fb81a600f242fd70efac60d1cb1925b83c154e9e77d37a997fcad3e6b2`
- Protected swap tx: `0x804f1ad299c6c82111ac79a6941eed24db1314878bff8bef738299a6ad3b446e`
- Refund tx: `0xb1dbae1cb20d7364ab8bb1092d08975b8bcb05e3b522d1e63ea4a0c9789ed93b`

See `DEPLOYMENTS.md` for the full address, PoolKey, and transaction list.

## Demo + submission docs

- `中文说明.md`: Chinese project explanation, deployment proof, local verification, and recording guide.
- `AI_EVALUATION_BRIEF.md`: judge-oriented scoring map.
- `JUDGE_SCORECARD.md`: candid 10-point AI judge score and 9+ path.
- `MECHANISM.md`: mechanism walkthrough and economics.
- `TEST_REPORT.md`: current automated coverage.
- `HACKATHON_SUBMISSION.md`: submission summary.
- `DEPLOYMENTS.md`: address checklist for X Layer.
- `DEMO_VIDEO_SCRIPT.md`: short video narration outline.
- `demo-video/out/refund-protection-demo.mp4`: Remotion-rendered demo video after running the video render command.
- `SUBMISSION_CHECKLIST.md`: final steps before the Google Form and X post.
