# Security And Limitations

## Security posture

- The refund right is reserve-backed and capped, not an unlimited guarantee.
- Pair configuration rejects invalid tokens, zero windows, impossible order ranges, and excessive fee / exposure parameters.
- Protected swap recording is restricted to the owner or the authorized v4 adapter.
- Refunds can only be executed by the original buyer before the deadline.
- Buyers must return the exact project-token amount recorded for the protected order.
- Vault payouts cannot exceed locked exposure.

## Known limitations

- Contracts are hackathon MVP contracts and have not been externally audited.
- The core deployment script deploys mocks for local/testnet demonstration.
- Live Uniswap v4 pool integration requires a funded deployer, a valid X Layer PoolManager address, a mined hook address, and pool initialization.
- Ganache is used for local tests; it is not a substitute for testnet transaction evidence.
- Treasury ownership is simple owner-based control for MVP clarity; production should use multisig/timelock governance.

## Non-goals

- No promise of full principal protection.
- No staking model.
- No NFT receipt layer.
- No hidden offchain claims process.
- No fake or placeholder deployment addresses.
