# Deployments

## Status

Refund Protection Hook is deployed on **X Layer mainnet** and has a live Uniswap v4 hook-enabled pool.

- Network: X Layer Mainnet
- Chain ID: `196`
- RPC used: `https://rpc.xlayer.tech`
- Explorer: `https://www.oklink.com/xlayer`
- Deployer wallet: `0x991F98f30C3De203d4872E0f4f990214A49A5EE7`
- Official Uniswap v4 PoolManager: `0x360e68faccca8ca495c1b759fd9eee466db9fb32`

## Contract Addresses

| Contract | Address | Verification |
|---|---|---|
| MockUSDC | `0xaB1Af2cfcdF92b8e0d5F11c3Ae03566409a1c448` | code present |
| MockTOKEN | `0x8d83D745f0Bddf0a96a0ebbaA14082f252faAdc1` | code present |
| RefundInsuranceVault | `0xee08015700a1F61c9406bF8aD6DB1Bd28B0790B8` | code present |
| RefundProtectionHook core | `0x20610fFe1600aa4eB30a14dB5A5D7E8345d65330` | code present |
| UniswapV4RefundProtectionAdapter | `0x467E54D02588c0aeCdC09AaC448913dF2E038040` | code present, `afterSwap` hook address |
| UniswapV4DemoHelper | `0xD04FA31A81DEb525bCC7c1575373205519D1AdA6` | code present |

## Pool

PoolId:

```text
0xbd34d3fb81a600f242fd70efac60d1cb1925b83c154e9e77d37a997fcad3e6b2
```

PoolKey:

```json
{
  "currency0": "0x8d83d745f0bddf0a96a0ebbaa14082f252faadc1",
  "currency1": "0xab1af2cfcdf92b8e0d5f11c3ae03566409a1c448",
  "fee": 3000,
  "tickSpacing": 60,
  "hooks": "0x467E54D02588c0aeCdC09AaC448913dF2E038040"
}
```

Pool initialization:

```text
0xf71b64fd1ed407c5cc3962664df23c1849942ba898a4435c6f8035153204cf42
```

## Deployment Transactions

| Step | Transaction hash |
|---|---|
| Deploy MockUSDC | `0x3146669f896d8d02643fd10400ef4396033a724c4566cc55caa6a5df04e09759` |
| Deploy MockTOKEN | `0x0fd3457cca7cfdaa729a2cdde99b2555e3a622529ea346fedcf0ff6842528e64` |
| Deploy RefundInsuranceVault | `0x009fe5cb7242b26b1d7f89c31fc543d3a26f84da70b93e89c216c52dd356bbcc` |
| Deploy RefundProtectionHook core | `0x334d27feff4b5f97299cc06b2abf436d8db4215b4ec456be9d7d5b4b5deff944` |
| Set vault hook | `0xbcfb2506e0e6863ec542c3a1ae2de9342e81c1776f59e8ca52530bac3e74229e` |
| Support MockUSDC in vault | `0x66c7aa7df859529b6f803102831cfcce19d7a76735f09cc388104a56705a6edc` |
| Mint reserve MockUSDC | `0x6576727348726709258458471eb59b0e6e7d44c3d31a889343b4e4c5046b36b9` |
| Approve reserve deposit | `0xa4fc82fab26c6516b286274713fc8b65db31bffee0e9ab5a342520bc92d17cee` |
| Deposit reserve | `0x80731914cb53497aecefac40c2b7b350b11c883c9346dd59218b4d738fc540eb` |
| Configure protected pair | `0x2fcf6d958e3ecbebbaa11367781653523e334047577dc84c28ccf11dd247ccc5` |
| Deploy v4 adapter via CREATE2 | `0xc3255d0dd9b77f331bd1d9f3e3d04f15562fe3ef7692195665fb3e5d0c3df45d` |
| Set adapter as authorized recorder | `0x89ecfef55b67cef3830cee8dfacfbb52205e83bf6142ed8a4327bccfe21c928c` |
| Initialize v4 pool | `0xf71b64fd1ed407c5cc3962664df23c1849942ba898a4435c6f8035153204cf42` |

CREATE2 salt used for the v4 adapter:

```text
0x000000000000000000000000000000000000000000000000000000000000584d
```

## Onchain Demo Transactions

| Step | Transaction hash |
|---|---|
| Deploy UniswapV4DemoHelper | `0x26520f685e3cf6d2c0eda425e598fadb15512097d01c1ad3e2501b83e65f8de6` |
| Mint demo MockUSDC | `0x32cea3ca844a4eb47ca5618c244c82bb1730dfe4bc1dbb76b5529e991e322f7e` |
| Mint demo MockTOKEN | `0x21dae5d13b81bd9f62d069d6c5f786a301e44b3c7a0a1fde38936c58d7a27779` |
| Approve MockUSDC to demo helper | `0x51fc80e87a9a0123d455fa3cfb636703db247aa1682b290610debc31e2bd41ad` |
| Approve MockTOKEN to demo helper | `0xd284261877822dbb52250a8ee18424b821118468b4e5f3d71d753489d6ce40af` |
| Approve premium spend to core | `0x0ef1a236e2fc4ecc90603fca1e63c1026ca63c2401ad598d6ab1ed2624802967` |
| Approve refund token return to core | `0xe56af7275be4a0db8695d50d0956480d261d782b2a336c6340c5445b9e2b96a7` |
| Add small v4 liquidity | `0xf8f554cd4fcd58bd5f8d05ab7ad4b261a2f77d66cf9ff6be52137cc4241ffc7a` |
| Protected v4 swap | `0x804f1ad299c6c82111ac79a6941eed24db1314878bff8bef738299a6ad3b446e` |
| Refund order `#1` | `0xb1dbae1cb20d7364ab8bb1092d08975b8bcb05e3b522d1e63ea4a0c9789ed93b` |

Onchain state verified after the demo:

- `RefundProtectionHook.authorizedRecorder()` is `0x467E54D02588c0aeCdC09AaC448913dF2E038040`.
- `RefundInsuranceVault.hook()` is `0x20610fFe1600aa4eB30a14dB5A5D7E8345d65330`.
- Order `#1` status is `2`, meaning `REFUNDED`.
- Order `#1` principal was `1000000` MockUSDC units, equal to `1.0` MockUSDC.
- Order `#1` token out was `499248` MockTOKEN base units.

## Reproduce

Use a funded X Layer mainnet wallet in local `.env` only. Do not commit `.env`.

```bash
npm run deploy:xlayer
npm run mine:hook
npm run deploy:v4-adapter
npm run initialize:v4-pool
V4_DEMO_HELPER_ADDRESS=0xD04FA31A81DEb525bCC7c1575373205519D1AdA6 DEMO_LIQUIDITY_DELTA=1000000 npm run demo:v4-mainnet
```
