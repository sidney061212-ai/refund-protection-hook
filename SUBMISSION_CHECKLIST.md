# Submission Checklist

## Before opening the Google Form

1. Run `npm install`.
2. Run `npm run check`.
3. Confirm the output includes `22 passing`.
4. Run `npm run score:verified`.
5. Confirm `score:verified` only shows the project X/Twitter account blocker, or no blockers after you provide `PROJECT_X_ACCOUNT`.
6. Render the Remotion video with `cd demo-video && npm run render`.
7. Upload `demo-video/out/refund-protection-demo.mp4`.
8. Paste the live addresses, PoolId, protected swap tx, and refund tx from `DEPLOYMENTS.md`.
9. Paste the project X/Twitter account.
10. Do not paste placeholder addresses into the form.

## Submission form fields

- Project name: `Refund Protection Hook`
- One-liner: `A Uniswap v4 afterSwap hook that lets launch-pool buyers opt into capped 24-hour refund protection backed by an onchain insurance vault.`
- Category: `DeFi Hook / launch-pool protection`
- Chain: `X Layer; local demo fully verified; live addresses deployed on X Layer mainnet`
- Chinese project guide: `中文说明.md`
- Repository: paste the GitHub repository URL after pushing.
- Demo video: upload `demo-video/out/refund-protection-demo.mp4` and paste the video URL.
- Contract addresses: paste real X Layer addresses only.
- Project X account: `https://x.com/changsidne`
- Project X post: `https://x.com/changsidne/status/2059262123138855255`

## X post draft

Refund Protection Hook for @XLayerOfficial Build X: Hook the Future.

It is a Uniswap v4 `afterSwap` hook for safer launch pools: buyers can opt into capped 24h refund protection, while a reserve vault enforces per-order, per-user, and total exposure limits.

Built for @Uniswap v4 hooks with @flapdotsh ecosystem in mind.

## Video title

`Refund Protection Hook - Uniswap v4 launch-pool refund protection on X Layer`

## Video description

`Refund Protection Hook lets early buyers opt into capped 24-hour refund protection when buying a newly launched token. The Uniswap v4 afterSwap adapter records protected buys, collects premiums, locks vault exposure, supports refunds inside the window, and finalizes unused coverage after expiry.`
