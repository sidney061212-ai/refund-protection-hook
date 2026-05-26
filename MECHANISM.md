# Mechanism

## Core idea

Refund Protection Hook gives early buyers an optional 24-hour refund right when buying a newly launched token with stablecoins.

The protection is:

- optional
- capped
- time-limited
- reserve-backed
- fee-funded

This is not infinite principal insurance. It is a bounded launch-market confidence layer.

## Participants

- Project: launches a `TOKEN / stablecoin` pool and seeds the insurance vault.
- Buyer: buys the new token and can optionally add refund protection.
- LPs: provide normal Uniswap liquidity.
- Insurance vault: holds stable reserves, locks exposure, pays valid refunds, and accumulates fees.
- Protocol: receives a configurable share of fees.

## Buy flow

1. A project configures a protected pair with:
   - min buy size
   - max per-order protected principal
   - max per-user protected principal per rolling window
   - protection window
   - base premium
   - refund fee
   - payout ratio
   - max exposure ratio
2. The buyer swaps stablecoin for the project token.
3. If the buyer opts into protection, the hook collects a premium and records the order.
4. The vault locks the maximum insured payout for that order.
5. The buyer receives the purchased token immediately and holds a 24-hour refund right.

## Pricing and limits

### Dynamic premium

Premium starts from `basePremiumBps` and increases with utilization:

- utilization = `lockedExposure / vaultBalance`
- extra premium = `utilization / 5`
- premium is capped at `3000 bps`

This means rising vault usage makes protection more expensive, helping defend the reserve during stressed launch conditions.

### Hard risk caps

Protection is constrained by:

- `maxPrincipalPerOrder`
- `maxPrincipalPerUserPerWindow`
- `maxExposureBps`

These caps stop the system from accidentally becoming an uncapped backstop.

## Refund flow

If the buyer refunds before expiry:

1. The buyer returns the exact token amount originally received.
2. The refund order is marked closed.
3. The vault pays out the insured stable amount minus refund fee.
4. Premium and refund fee are economically retained and split across:
   - vault reserve
   - project treasury
   - protocol treasury

## Finalize flow

If the buyer does not refund in time:

1. Anyone can finalize the order after expiry.
2. Locked exposure is released back to free reserve.
3. The premium remains in the system.
4. Good launches therefore deepen the reserve over time.

## Why this is useful for launches

- Buyers get a real onchain refund right instead of a social promise.
- Projects can seed confidence with finite insurance capital.
- The reserve stays bounded instead of becoming an impossible guarantee.
- Fee income can compound reserve depth when launches go well.
- Reserve drawdowns become a visible market signal when launches go badly.

## Why this belongs in a v4 hook

The refund right is created at the same moment as the protected buy. A Uniswap v4 `afterSwap` adapter can read the executed stable-in / project-token-out flow, decode the buyer's opt-in intent from hook data, and forward only eligible protected buys to the core insurance state machine.

This keeps the AMM as the execution layer and the insurance vault as a bounded accounting layer. The hook does not replace the pool; it adds launch-specific behavior around the pool.

## Product sentence

Buy a new token with a 24-hour refund option. Pay a premium, cap your downside, and let good launches strengthen the insurance pool over time.
