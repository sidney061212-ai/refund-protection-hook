const { ethers } = require("ethers");
const { compileProject } = require("./solc-utils");

const CREATE2_DEPLOYER = process.env.CREATE2_DEPLOYER || "0x4e59b44847b379578588920cA78FbF26c0B4956C";
const FLAG_MASK = (1n << 14n) - 1n;
const AFTER_SWAP_FLAG = 1n << 6n;
const MAX_ITERATIONS = 200000;

function requireEnv(name) {
  if (!process.env[name]) {
    throw new Error(`${name} is required`);
  }
  return process.env[name];
}

async function main() {
  const poolManager = requireEnv("V4_POOL_MANAGER_ADDRESS");
  const coreAddress = requireEnv("REFUND_PROTECTION_CORE_ADDRESS");
  const contracts = compileProject().contracts;
  const artifact = contracts["UniswapV4RefundProtectionAdapter.sol"].UniswapV4RefundProtectionAdapter;
  const constructorArgs = ethers.AbiCoder.defaultAbiCoder().encode(["address", "address"], [poolManager, coreAddress]);
  const initCode = ethers.concat([`0x${artifact.evm.bytecode.object}`, constructorArgs]);
  const initCodeHash = ethers.keccak256(initCode);

  for (let i = 0n; i < MAX_ITERATIONS; i += 1n) {
    const salt = ethers.zeroPadValue(ethers.toBeHex(i), 32);
    const candidate = ethers.getCreate2Address(CREATE2_DEPLOYER, salt, initCodeHash);
    if ((BigInt(candidate) & FLAG_MASK) === AFTER_SWAP_FLAG) {
      console.log("Found valid Uniswap v4 hook address");
      console.log("Deployer proxy:", CREATE2_DEPLOYER);
      console.log("Pool manager:", poolManager);
      console.log("Refund core:", coreAddress);
      console.log("Salt:", salt);
      console.log("Predicted hook address:", candidate);
      console.log("Required flags:", `0x${AFTER_SWAP_FLAG.toString(16)}`);
      return;
    }
  }

  throw new Error(`No matching salt found within ${MAX_ITERATIONS} iterations`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
