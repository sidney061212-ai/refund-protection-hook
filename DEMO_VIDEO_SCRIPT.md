# Demo Video Script

## 1-3 minute flow

1. Token launches are scary for early buyers. They worry about buying into the first wave, getting dumped on, or losing exit liquidity before they can react.

2. Refund Protection Hook is our answer: a Uniswap v4 `afterSwap` hook for launch pools on X Layer.

3. When a buyer swaps stablecoins into a newly launched token, they can choose to add 24-hour refund protection.

4. If they opt in, they pay a premium. Our insurance vault then locks the exact coverage needed for that order.

5. The buyer still receives the token immediately, but now they also hold an onchain refund right for the next 24 hours.

6. If they change their mind during that window, they return the purchased token and receive a partial stablecoin refund after fees.

7. If they do nothing, the order finalizes after expiry, the locked exposure is released, and the premium stays in the system.

8. That means good launches grow the reserve over time, while bad launches consume it. The vault itself becomes a visible market signal.

9. This is not infinite insurance. It is optional, capped, and time-limited downside protection for early buyers.

10. We think this creates a more trustable launch experience for new token pools on X Layer.

## Screen recording checklist

1. Show the README top section and the judge quick read.
2. Run `npm install`.
3. Run `npm run check`.
4. Point out `15 passing`.
5. Show the demo output: premium quote, max refundable amount, refund payout, finalize path.
6. Open `src/UniswapV4RefundProtectionAdapter.sol` and show `afterSwap: true`.
7. Open `DEPLOYMENTS.md` and state that live addresses are pending only because no funded X Layer testnet deployer was available.

## Short voiceover

"This project turns launch-pool refund protection into a Uniswap v4 hook primitive. Buyers opt in during a stable-to-token swap. The hook records the actual swap flow, collects a premium, and locks reserve-backed coverage in the vault. If the buyer refunds within 24 hours, they return the purchased tokens and receive a capped stablecoin payout after fees. If they do nothing, the order finalizes and the reserve is released. The key is bounded risk: per-order caps, per-user rolling limits, dynamic premiums, a vault exposure cap, and fee splits that strengthen the reserve when launches go well."
