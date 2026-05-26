const { ethers } = require("ethers");
require("dotenv").config();
const { compileProject } = require("./solc-utils");
const { artifact, buildPoolKey, requireEnv } = require("./v4-deploy-utils");

const ERC20_ABI = [
  "function mint(address to,uint256 amount) external",
  "function approve(address spender,uint256 amount) external returns (bool)",
  "function decimals() external view returns (uint8)",
  "function balanceOf(address owner) external view returns (uint256)"
];

function poolIdFromKey(key) {
  return ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
    ["tuple(address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks)"],
    [key]
  ));
}

function encodeProtectionHookData(wantsProtection, buyer) {
  return ethers.AbiCoder.defaultAbiCoder().encode(["bool", "address"], [wantsProtection, buyer]);
}

function parseSignedDelta(packed) {
  const value = BigInt(packed);
  const mask = (1n << 128n) - 1n;
  let amount0 = value >> 128n;
  let amount1 = value & mask;
  if (amount0 >= (1n << 127n)) amount0 -= (1n << 128n);
  if (amount1 >= (1n << 127n)) amount1 -= (1n << 128n);
  return { amount0, amount1 };
}

async function deploy(wallet, art, args = []) {
  const factory = new ethers.ContractFactory(art.abi, art.bytecode, wallet);
  const contract = await factory.deploy(...args);
  const tx = contract.deploymentTransaction();
  const receipt = await contract.waitForDeployment().then(() => tx.wait());
  if (receipt.status !== 1) throw new Error(`Deployment reverted: ${tx.hash}`);
  return { contract, txHash: tx.hash };
}

async function sendAndWait(label, txPromise) {
  const tx = await txPromise;
  console.log(`${label} tx:`, tx.hash);
  const receipt = await tx.wait();
  if (receipt.status !== 1) throw new Error(`${label} reverted: ${tx.hash}`);
  return tx.hash;
}

async function main() {
  const privateKey = requireEnv("PRIVATE_KEY");
  const chainId = Number(process.env.XLAYER_CHAIN_ID || 196);
  const rpc = process.env.XLAYER_RPC_URL || "https://rpc.xlayer.tech";
  const provider = new ethers.JsonRpcProvider(rpc, chainId);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contracts = compileProject().contracts;

  const stableAddress = requireEnv("MOCK_USDC_ADDRESS");
  const tokenAddress = requireEnv("MOCK_TOKEN_ADDRESS");
  const coreAddress = requireEnv("REFUND_PROTECTION_CORE_ADDRESS");
  const poolManager = requireEnv("V4_POOL_MANAGER_ADDRESS");
  const hookAddress = requireEnv("V4_HOOK_ADDRESS");
  const fee = Number(process.env.POOL_FEE || 3000);
  const tickSpacing = Number(process.env.POOL_TICK_SPACING || 60);
  const key = buildPoolKey({ tokenA: stableAddress, tokenB: tokenAddress, fee, tickSpacing, hooks: hookAddress });
  const poolId = poolIdFromKey(key);

  const stable = new ethers.Contract(stableAddress, ERC20_ABI, wallet);
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
  const core = new ethers.Contract(coreAddress, artifact(contracts, "RefundProtectionHook.sol", "RefundProtectionHook").abi, wallet);

  let helperAddress = process.env.V4_DEMO_HELPER_ADDRESS;
  let helperDeployTx;
  if (!helperAddress) {
    const helperArtifact = artifact(contracts, "UniswapV4DemoHelper.sol", "UniswapV4DemoHelper");
    const deployed = await deploy(wallet, helperArtifact, [poolManager]);
    helperAddress = await deployed.contract.getAddress();
    helperDeployTx = deployed.txHash;
    console.log("UniswapV4DemoHelper:", helperAddress);
    console.log("Helper deploy tx:", helperDeployTx);
  }

  const helper = new ethers.Contract(
    helperAddress,
    artifact(contracts, "UniswapV4DemoHelper.sol", "UniswapV4DemoHelper").abi,
    wallet
  );

  const stableDecimals = Number(await stable.decimals());
  const tokenDecimals = Number(await token.decimals());
  const liquidityStable = ethers.parseUnits(process.env.DEMO_LIQUIDITY_STABLE || "2", stableDecimals);
  const liquidityToken = ethers.parseUnits(process.env.DEMO_LIQUIDITY_TOKEN || "2", tokenDecimals);
  const swapAmount = ethers.parseUnits(process.env.PROTECTED_SWAP_STABLE || "1", stableDecimals);
  const premiumHeadroom = ethers.parseUnits(process.env.DEMO_PREMIUM_HEADROOM_STABLE || "1", stableDecimals);

  const txs = {};
  if (process.env.DEMO_MINT_TOKENS !== "false") {
    txs.mintStable = await sendAndWait("mint stable for demo", stable.mint(wallet.address, liquidityStable + swapAmount + premiumHeadroom));
    txs.mintToken = await sendAndWait("mint project token for demo", token.mint(wallet.address, liquidityToken));
  }

  txs.approveStableHelper = await sendAndWait("approve stable to demo helper", stable.approve(helperAddress, ethers.MaxUint256));
  txs.approveTokenHelper = await sendAndWait("approve token to demo helper", token.approve(helperAddress, ethers.MaxUint256));
  txs.approveStableCore = await sendAndWait("approve stable premium to refund core", stable.approve(coreAddress, ethers.MaxUint256));
  txs.approveTokenCore = await sendAndWait("approve token refunds to refund core", token.approve(coreAddress, ethers.MaxUint256));

  const tickLower = Number(process.env.DEMO_TICK_LOWER || -887220);
  const tickUpper = Number(process.env.DEMO_TICK_UPPER || 887220);
  const liquidityDelta = BigInt(process.env.DEMO_LIQUIDITY_DELTA || "1000000000000");
  const salt = process.env.DEMO_LIQUIDITY_SALT || ethers.zeroPadValue("0x01", 32);
  const liquidityTx = await helper.addLiquidity(key, tickLower, tickUpper, liquidityDelta, salt);
  console.log("add liquidity tx:", liquidityTx.hash);
  const liquidityReceipt = await liquidityTx.wait();
  if (liquidityReceipt.status !== 1) throw new Error("add liquidity reverted");
  txs.addLiquidity = liquidityTx.hash;

  const orderId = await core.nextOrderId();
  const zeroForOne = key.currency0.toLowerCase() === ethers.getAddress(stableAddress).toLowerCase();
  const hookData = encodeProtectionHookData(true, wallet.address);
  const swapTx = await helper.swapExactInput(key, zeroForOne, swapAmount, hookData);
  console.log("protected v4 swap tx:", swapTx.hash);
  const swapReceipt = await swapTx.wait();
  if (swapReceipt.status !== 1) throw new Error("protected swap reverted");
  txs.protectedSwap = swapTx.hash;

  const closeMode = process.env.DEMO_CLOSE_MODE || "refund";
  if (closeMode === "finalize") {
    console.log("Finalize mode requested. Waiting for protection expiry is not automated on mainnet.");
  } else {
    txs.refund = await sendAndWait(`refund order ${orderId}`, core.refund(orderId));
  }

  const output = {
    network: { chainId, rpc },
    wallet: wallet.address,
    contracts: {
      mockUSDC: stableAddress,
      mockTOKEN: tokenAddress,
      refundProtectionHook: coreAddress,
      v4Hook: hookAddress,
      v4DemoHelper: helperAddress
    },
    pool: {
      poolManager,
      poolId,
      poolKey: key,
      fee,
      tickSpacing
    },
    demo: {
      liquidityDelta: liquidityDelta.toString(),
      tickLower,
      tickUpper,
      swapAmount: swapAmount.toString(),
      orderId: orderId.toString(),
      mode: closeMode
    },
    txs
  };

  console.log("\nV4 demo flow result:");
  console.log(JSON.stringify(output, null, 2));
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = {
  encodeProtectionHookData,
  parseSignedDelta,
  poolIdFromKey
};
