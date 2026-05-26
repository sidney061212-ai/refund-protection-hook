# Submission Checklist

## Before opening the Google Form

1. Run `npm install`.
2. Run `npm run check`.
3. Confirm the output includes `18 passing`.
4. If you obtain X Layer OKB, run `npm run deploy:xlayer`.
5. Run `npm run mine:hook` with `V4_POOL_MANAGER_ADDRESS` and `REFUND_PROTECTION_CORE_ADDRESS`.
6. Run `npm run deploy:v4-adapter` with the mined `CREATE2_SALT`.
7. Run `npm run initialize:v4-pool` with `V4_HOOK_ADDRESS`, `POOL_TOKEN_A`, and `POOL_TOKEN_B`.
8. Paste any real addresses into `DEPLOYMENTS.md`, `README.md`, and `HACKATHON_SUBMISSION.md`.
9. Do not paste placeholder addresses into the form.

## Submission form fields

- Project name: `Refund Protection Hook`
- One-liner: `A Uniswap v4 afterSwap hook that lets launch-pool buyers opt into capped 24-hour refund protection backed by an onchain insurance vault.`
- Category: `DeFi Hook / launch-pool protection`
- Chain: `X Layer; local demo fully verified; live addresses pending funded deployer gas`
- Repository: paste the GitHub repository URL after pushing.
- Demo video: paste the video URL after recording.
- Contract addresses: paste real X Layer addresses only.

## X post draft

Refund Protection Hook for @XLayerOfficial Build X: Hook the Future.

It is a Uniswap v4 `afterSwap` hook for safer launch pools: buyers can opt into capped 24h refund protection, while a reserve vault enforces per-order, per-user, and total exposure limits.

Built for @Uniswap v4 hooks with @flapdotsh ecosystem in mind.

## Video title

`Refund Protection Hook - Uniswap v4 launch-pool refund protection on X Layer`

## Video description

`Refund Protection Hook lets early buyers opt into capped 24-hour refund protection when buying a newly launched token. The Uniswap v4 afterSwap adapter records protected buys, collects premiums, locks vault exposure, supports refunds inside the window, and finalizes unused coverage after expiry.`
