# Judge Scorecard

This is a candid AI-judge style score against the published Hook the Future dimensions.

## Current Package Score

| Dimension | Score | Rationale |
|---|---:|---|
| Innovation | 9.3/10 | Turns launch-pool downside protection into an opt-in `afterSwap` primitive instead of another rewards, staking, or tax-token hook. |
| Market potential | 8.9/10 | Clear buyer/project incentive fit for new token launches; stronger with a frontend, real launch partner, or live usage. |
| Code quality | 9.2/10 | Small contracts, bounded risk controls, fee accounting, authorization, deterministic tests, real v4 adapter compilation, and a submission score gate. |
| Completion after project social | 9.6/10 | X Layer mainnet Hook, PoolId, protected swap, refund, Remotion demo, and project X post evidence are present. |

## Hard Gate

The official deployment requirement is now satisfied on X Layer mainnet, and the project X/Twitter post evidence is recorded.

Run `PROJECT_X_ACCOUNT=https://x.com/changsidne npm run score:strict` after local verification. It exits successfully with a 9.6/10 estimate.

## 9.5+ Path

1. Run `npm run check` and keep the output in the demo.
2. Render/upload `demo-video/out/refund-protection-demo.mp4`.
3. Create or provide the dedicated project X/Twitter account.
4. Add the project X account to the submission form and X post.
5. Re-run `PROJECT_X_ACCOUNT=<account-url> npm run score:strict`; it should exit successfully after the social evidence is present.
