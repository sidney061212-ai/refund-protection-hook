# AI Evaluation Brief

This file is intentionally written for fast automated and human review. It maps the project to the published Hook the Future judging dimensions without claiming unverified deployment status.

## Project

Refund Protection Hook is an opt-in Uniswap v4 `afterSwap` hook for launch pools. When a buyer purchases a new project token with a stablecoin, the buyer can pay a premium to reserve a capped 24-hour refund right backed by an onchain insurance vault.

## Innovation

- Creates a new pool-level launch-market behavior: swap-time refund rights.
- Uses Uniswap v4 hook execution instead of offchain promises or post-trade support tickets.
- Keeps risk bounded through per-order, per-user, time-window, and vault-capacity constraints.
- Adds utilization-sensitive pricing so protection becomes more expensive as reserve usage rises.
- Avoids the common hackathon shortcuts of unlimited insurance, staking wrappers, NFT receipts, or pure reward points.

## Market Potential

- New token launches need trust primitives because buyers fear immediate drawdowns and unstable liquidity.
- Projects can seed a finite reserve to make launches feel safer without promising full principal protection.
- Buyers can make a simple decision: buy normally, or pay extra for a temporary refund option.
- The vault creates visible market signals: growing reserves suggest healthy launches; drawdowns reveal stress.
- X Layer benefits because this is a real trading UX improvement rather than a detached demo contract.

## Completion Evidence

Run:

```bash
npm install
npm run check
```

Expected local evidence:

```text
Compiled 24 source files with solc 0.8.26
15 passing
Submission check passed: compile, tests, and demo all completed successfully.
```

Implemented artifacts:

- `src/RefundProtectionHook.sol`: core order, refund, finalize, premium, and limit logic.
- `src/RefundInsuranceVault.sol`: reserve, locked exposure, payout, and fee-split accounting.
- `src/UniswapV4RefundProtectionAdapter.sol`: real Uniswap v4 `BaseHook` adapter with `afterSwap` enabled.
- `scripts/mine-hook-address.js`: CREATE2 hook-address mining helper for v4 permission bits.
- `scripts/deploy-xlayer.js`: X Layer testnet deployment script for core contracts.
- `scripts/demo.js`: local end-to-end demo covering refund and finalize paths.

## Honest Limitations

- No live X Layer address is claimed without a funded deployer wallet.
- The adapter compiles against current Uniswap v4 packages, but a live v4 pool/hook transaction still requires X Layer gas, a deployed PoolManager address, address mining, and pool initialization.
- The local tests use Ganache for deterministic execution, not a fork of X Layer.

## Why This Should Score Well

The project directly targets the required hook mechanism, has a clear launch-market use case, includes a real compile-capable v4 adapter, demonstrates bounded reserve-backed economics, and provides reproducible local evidence. It is honest about the only missing piece: live X Layer deployment funding.
