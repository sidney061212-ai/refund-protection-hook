# Deployments

## Status

Deployment scripts are ready, but this session did not have a funded `PRIVATE_KEY` / X Layer gas, so no live X Layer transactions were broadcast.

The hackathon requires at least one v4 Pool and Hook contract deployed on X Layer mainnet or testnet with verifiable addresses. Do not submit placeholder addresses. Fill this file only after transactions are broadcast and confirmed.

Use:

```bash
cp .env.example .env
npm run deploy:xlayer
```

For a real v4 adapter deployment:

```bash
V4_POOL_MANAGER_ADDRESS=<pool_manager> \
REFUND_PROTECTION_CORE_ADDRESS=<refund_core> \
npm run mine:hook

V4_POOL_MANAGER_ADDRESS=<pool_manager> \
REFUND_PROTECTION_CORE_ADDRESS=<refund_core> \
CREATE2_SALT=<salt_from_mine_hook> \
npm run deploy:v4-adapter

V4_POOL_MANAGER_ADDRESS=<pool_manager> \
V4_HOOK_ADDRESS=<deployed_adapter> \
POOL_TOKEN_A=<stable_token> \
POOL_TOKEN_B=<project_token> \
npm run initialize:v4-pool
```

Official Uniswap v4 X Layer mainnet PoolManager: `0x360e68faccca8ca495c1b759fd9eee466db9fb32`. Set `XLAYER_CHAIN_ID=196` and `XLAYER_RPC_URL=https://rpc.xlayer.tech` when using the official mainnet deployment.

## Target addresses

| Network | Chain ID | Contract | Address | Status |
|---|---:|---|---|---|
| X Layer Mainnet | 196 | Uniswap v4 PoolManager | `0x360e68faccca8ca495c1b759fd9eee466db9fb32` | Official deployment |
| X Layer Testnet | 1952 | MockUSDC | TBD | Ready to deploy |
| X Layer Testnet | 1952 | MockTOKEN | TBD | Ready to deploy |
| X Layer Testnet | 1952 | RefundInsuranceVault | TBD | Ready to deploy |
| X Layer Testnet | 1952 | RefundProtectionHook | TBD | Ready to deploy |
| X Layer Testnet/Mainnet | 1952/196 | UniswapV4RefundProtectionAdapter | TBD | Scripted via CREATE2 mined hook address |
| X Layer Testnet/Mainnet | 1952/196 | Uniswap v4 Pool | TBD | Scripted via PoolManager initialize |

## Address update checklist

1. Deploy the core contracts with `npm run deploy:xlayer`.
2. Copy the four printed addresses into the table above.
3. Set `REFUND_PROTECTION_CORE_ADDRESS` to the deployed `RefundProtectionHook`.
4. Set `V4_POOL_MANAGER_ADDRESS` to the real X Layer v4 PoolManager.
5. Run `npm run mine:hook`.
6. Deploy the adapter at the mined CREATE2 address with `npm run deploy:v4-adapter`.
7. Create/initialize the v4 pool using the mined adapter address with `npm run initialize:v4-pool`.
8. Paste explorer links next to each real address before submission.
