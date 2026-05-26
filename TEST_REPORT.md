# Test Report

Environment:

- Date: `2026-05-26`
- Node.js: `v24.14.0`
- Solidity compiler: `solc-js 0.8.26`
- Local EVM: `Ganache`
- Test runner: `Mocha`

Commands executed:

```bash
npm install
npm run compile
npm test
npm run demo
V4_POOL_MANAGER_ADDRESS=0x0000000000000000000000000000000000000001 REFUND_PROTECTION_CORE_ADDRESS=0x0000000000000000000000000000000000000002 npm run mine:hook
```

Current automated result:

```text
Compiled 24 source files with solc 0.8.26
15 passing
```

Covered scenarios:

1. Protected buy records correctly, collects premium, and locks exposure.
2. Unauthorized callers cannot record protected swaps.
3. Owner can rotate the authorized v4 hook adapter / recorder.
4. Refund inside the 24h window succeeds.
5. Dynamic premium increases as vault utilization rises.
6. Expired order finalizes and releases exposure.
7. Per-order max principal limit is enforced.
8. Per-user rolling window limit is enforced.
9. Malformed pair configs are rejected before runtime risk.
10. Disabled pair protection blocks protected buys.
11. Vault exposure cap is enforced.
12. Non-buyer refunds are rejected.
13. Refunds after expiry are rejected.
14. Refunds fail if the buyer no longer holds enough project tokens.
15. Project/protocol/vault fee split is consistent across premium collection and refund settlement.

Notes:

- Ganache emits a `µWS` binary compatibility warning under Node `24.x` and falls back to a pure Node implementation.
- The warning does not block compilation, tests, or the local demo flow.
- `npm audit fix` was run. Remaining audit warnings are from local development dependencies (`ganache`, `solc`, `ethers`, `mocha`) and were not force-fixed because the suggested forced changes downgrade or break the current verified toolchain.
- Hook address mining was smoke-tested with dummy constructor addresses and produced an address whose low permission bits match the `AFTER_SWAP` flag (`0x40`).
