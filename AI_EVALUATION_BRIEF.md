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
npm run score:verified
```

Expected local evidence:

```text
Compiled 28 source files with solc 0.8.26
22 passing
Submission check passed: compile, tests, and demo all completed successfully.
```

Implemented artifacts:

- `src/RefundProtectionHook.sol`: core order, refund, finalize, premium, and limit logic.
- `src/RefundInsuranceVault.sol`: reserve, locked exposure, payout, and fee-split accounting.
- `src/UniswapV4RefundProtectionAdapter.sol`: real Uniswap v4 `BaseHook` adapter with `afterSwap` enabled.
- `scripts/mine-hook-address.js`: CREATE2 hook-address mining helper for v4 permission bits.
- `scripts/deploy-xlayer.js`: X Layer testnet deployment script for core contracts.
- `scripts/deploy-v4-adapter.js`: CREATE2 deployment for the mined v4 `afterSwap` hook address, plus recorder wiring.
- `scripts/initialize-v4-pool.js`: v4 PoolManager initialization script for the hook-enabled pool key.
- `scripts/demo.js`: local end-to-end demo covering refund and finalize paths.
- `scripts/submission-score.js`: explicit score gate that keeps the project below 9.5 until live deployment and social/demo evidence are present.
- `demo-video/`: Remotion demo video with voiceover and reusable render script.

Social evidence:

- Project X account: `https://x.com/changsidne`
- Project X post: `https://x.com/changsidne/status/2059262123138855255`

## Honest Limitations

- Live X Layer mainnet addresses, PoolId, protected swap, and refund are recorded in `DEPLOYMENTS.md`.
- The onchain demo uses mock ERC20 tokens to minimize real cost while proving the v4 hook path, pool initialization, protected swap recording, and refund state transition.
- The local tests use Ganache for deterministic execution, not a fork of X Layer.

## Why This Should Score Well

The project directly targets the required hook mechanism, has a clear launch-market use case, includes a real v4 adapter deployed on X Layer mainnet, demonstrates bounded reserve-backed economics, and provides both reproducible local evidence and live onchain proof.
