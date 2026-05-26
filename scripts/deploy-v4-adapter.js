const { ethers } = require("ethers");
require("dotenv").config();
const { compileProject } = require("./solc-utils");
const {
  CREATE2_DEPLOYER,
  adapterInitCode,
  artifact,
  buildCreate2Calldata,
  hasExpectedHookFlags,
  mineHookSalt,
  predictCreate2Address,
  requireEnv
} = require("./v4-deploy-utils");

async function main() {
  const privateKey = requireEnv("PRIVATE_KEY");
  const rpc = process.env.XLAYER_RPC_URL || process.env.XLAYER_TESTNET_RPC_URL || "https://rpc.xlayer.tech";
  const chainId = Number(process.env.XLAYER_CHAIN_ID || 196);
  const provider = new ethers.JsonRpcProvider(rpc, chainId);
  const wallet = new ethers.Wallet(privateKey, provider);

  const deployer = process.env.CREATE2_DEPLOYER || CREATE2_DEPLOYER;
  const poolManager = requireEnv("V4_POOL_MANAGER_ADDRESS");
  const coreAddress = requireEnv("REFUND_PROTECTION_CORE_ADDRESS");
  const contracts = compileProject().contracts;
  const adapterArtifact = artifact(contracts, "UniswapV4RefundProtectionAdapter.sol", "UniswapV4RefundProtectionAdapter");
  const initCode = adapterInitCode(adapterArtifact, poolManager, coreAddress);

  const salt = process.env.CREATE2_SALT || mineHookSalt({
    deployer,
    initCode,
    maxIterations: Number(process.env.MAX_MINE_ITERATIONS || 200000)
  }).salt;
  const predicted = predictCreate2Address(deployer, salt, initCode);
  if (!hasExpectedHookFlags(predicted)) {
    throw new Error(`Predicted adapter ${predicted} does not carry the required afterSwap flag`);
  }

  const deployerCode = await provider.getCode(deployer);
  if (deployerCode === "0x") {
    throw new Error(`CREATE2 deployer is not deployed at ${deployer} on chain ${chainId}`);
  }

  const existing = await provider.getCode(predicted);
  if (existing !== "0x") {
    console.log("Adapter already deployed:", predicted);
  } else {
    const tx = await wallet.sendTransaction({
      to: deployer,
      data: buildCreate2Calldata(salt, initCode)
    });
    console.log("CREATE2 deploy tx:", tx.hash);
    const receipt = await tx.wait();
    if (receipt.status !== 1) throw new Error("CREATE2 adapter deployment reverted");
    const deployedCode = await provider.getCode(predicted);
    if (deployedCode === "0x") throw new Error(`No code found at predicted adapter ${predicted}`);
    console.log("Adapter deployed:", predicted);
  }

  if (process.env.SET_AUTHORIZED_RECORDER !== "false") {
    const core = new ethers.Contract(coreAddress, artifact(contracts, "RefundProtectionHook.sol", "RefundProtectionHook").abi, wallet);
    const tx = await core.setAuthorizedRecorder(predicted);
    console.log("setAuthorizedRecorder tx:", tx.hash);
    const receipt = await tx.wait();
    if (receipt.status !== 1) throw new Error("setAuthorizedRecorder reverted");
  }

  console.log("Network chainId:", chainId);
  console.log("Pool manager:", poolManager);
  console.log("Refund core:", coreAddress);
  console.log("UniswapV4RefundProtectionAdapter:", predicted);
  console.log("CREATE2 salt:", salt);
}

main().catch((err) => { console.error(err); process.exit(1); });
