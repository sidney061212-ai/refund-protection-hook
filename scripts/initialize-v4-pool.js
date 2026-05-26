const { ethers } = require("ethers");
require("dotenv").config();
const { buildPoolKey, requireEnv } = require("./v4-deploy-utils");

const POOL_MANAGER_ABI = [
  "function initialize((address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks) key,uint160 sqrtPriceX96) external returns (int24 tick)"
];

async function main() {
  const privateKey = requireEnv("PRIVATE_KEY");
  const rpc = process.env.XLAYER_RPC_URL || process.env.XLAYER_TESTNET_RPC_URL || "https://rpc.xlayer.tech";
  const chainId = Number(process.env.XLAYER_CHAIN_ID || 196);
  const provider = new ethers.JsonRpcProvider(rpc, chainId);
  const wallet = new ethers.Wallet(privateKey, provider);

  const poolManager = requireEnv("V4_POOL_MANAGER_ADDRESS");
  const tokenA = requireEnv("POOL_TOKEN_A");
  const tokenB = requireEnv("POOL_TOKEN_B");
  const hooks = requireEnv("V4_HOOK_ADDRESS");
  const fee = Number(process.env.POOL_FEE || 3000);
  const tickSpacing = Number(process.env.POOL_TICK_SPACING || 60);
  const sqrtPriceX96 = BigInt(process.env.SQRT_PRICE_X96 || "79228162514264337593543950336");
  const key = buildPoolKey({ tokenA, tokenB, fee, tickSpacing, hooks });

  const manager = new ethers.Contract(poolManager, POOL_MANAGER_ABI, wallet);
  const tx = await manager.initialize(key, sqrtPriceX96);
  console.log("Pool initialize tx:", tx.hash);
  const receipt = await tx.wait();
  if (receipt.status !== 1) throw new Error("Pool initialize reverted");

  console.log("Network chainId:", chainId);
  console.log("Pool manager:", poolManager);
  console.log("Pool key:", key);
  console.log("sqrtPriceX96:", sqrtPriceX96.toString());
}

main().catch((err) => { console.error(err); process.exit(1); });
