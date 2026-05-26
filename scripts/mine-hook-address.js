const { compileProject } = require("./solc-utils");
const {
  AFTER_SWAP_FLAG,
  CREATE2_DEPLOYER,
  adapterInitCode,
  artifact,
  mineHookSalt,
  requireEnv
} = require("./v4-deploy-utils");

async function main() {
  const poolManager = requireEnv("V4_POOL_MANAGER_ADDRESS");
  const coreAddress = requireEnv("REFUND_PROTECTION_CORE_ADDRESS");
  const contracts = compileProject().contracts;
  const adapterArtifact = artifact(contracts, "UniswapV4RefundProtectionAdapter.sol", "UniswapV4RefundProtectionAdapter");
  const initCode = adapterInitCode(adapterArtifact, poolManager, coreAddress);
  const { salt, predicted } = mineHookSalt({
    deployer: process.env.CREATE2_DEPLOYER || CREATE2_DEPLOYER,
    initCode,
    maxIterations: Number(process.env.MAX_MINE_ITERATIONS || 200000)
  });

  console.log("Found valid Uniswap v4 hook address");
  console.log("Deployer proxy:", process.env.CREATE2_DEPLOYER || CREATE2_DEPLOYER);
  console.log("Pool manager:", poolManager);
  console.log("Refund core:", coreAddress);
  console.log("Salt:", salt);
  console.log("Predicted hook address:", predicted);
  console.log("Required flags:", `0x${AFTER_SWAP_FLAG.toString(16)}`);
  console.log("Deploy with: CREATE2_SALT=" + salt + " npm run deploy:v4-adapter");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
