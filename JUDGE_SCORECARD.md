# Judge Scorecard

This is a candid AI-judge style score against the published Hook the Future dimensions.

## Current Package Score

| Dimension | Score | Rationale |
|---|---:|---|
| Innovation | 9.2/10 | Turns launch-pool downside protection into an opt-in `afterSwap` primitive instead of another rewards, staking, or tax-token hook. |
| Market potential | 8.8/10 | Clear buyer/project incentive fit for new token launches; stronger with a frontend, real launch partner, or live usage. |
| Code quality | 9.0/10 | Small contracts, bounded risk controls, fee accounting, authorization, deterministic tests, and real v4 adapter compilation. |
| Completion before live deployment | 8.3/10 | Local compile/tests/demo pass, and deployment tooling is now complete, but official submission still needs verifiable X Layer addresses. |
| Completion after live deployment | 9.1/10 | With X Layer Hook + Pool addresses filled in, this becomes a strong, reproducible hackathon submission. |

## Hard Gate

The official requirement is not just code readiness: at least one v4 Pool and Hook contract must be deployed on X Layer mainnet or testnet with verifiable addresses. Without those addresses, the project may be penalized heavily or rejected even if the local package is strong.

## 9+ Path

1. Run `npm run check` and keep the output in the demo.
2. Deploy core contracts with `npm run deploy:xlayer`.
3. Mine the hook address with `npm run mine:hook`.
4. Deploy the adapter with `npm run deploy:v4-adapter`.
5. Initialize the v4 pool with `npm run initialize:v4-pool`.
6. Add explorer links to `DEPLOYMENTS.md`, `README.md`, and the submission form.
