# Codex handoff checklist

Please do not rewrite the economic model. Only finish integration polish.

## Already tested
- Core contracts compile through `scripts/compile.js`.
- Tests pass through `npm test`.
- Main state machine is in `src/RefundProtectionHook.sol`.
- Vault accounting is in `src/RefundInsuranceVault.sol`.

## Highest-priority remaining work
1. Replace `src/UniswapV4Adapter_NOT_PRODUCTION.sol` with a real Uniswap v4 `BaseHook` adapter using the latest `v4-core` and `v4-periphery` versions.
2. Add hook address mining for the enabled permissions, especially `afterSwap`.
3. Parse the real swap delta and identify protected stable -> project token buys.
4. Wire front-end/router calldata so users can tick “Refund Protection” and approve/pay premium.
5. Deploy to X Layer testnet and paste addresses into `DEPLOYMENTS.md`.
6. Record demo: buy with protection -> refund before 24h -> buy with protection -> finalize after expiry.

## Commands
```bash
npm install
npm test
npm run compile
```
