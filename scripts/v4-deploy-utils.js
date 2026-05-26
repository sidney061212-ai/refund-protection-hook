const { ethers } = require("ethers");

const CREATE2_DEPLOYER = "0x4e59b44847b379578588920cA78FbF26c0B4956C";
const FLAG_MASK = (1n << 14n) - 1n;
const AFTER_SWAP_FLAG = 1n << 6n;
const MAX_MINE_ITERATIONS = 200000;
const XLAYER_MAINNET_POOL_MANAGER = "0x360e68faccca8ca495c1b759fd9eee466db9fb32";

function requireEnv(name) {
  if (!process.env[name]) {
    throw new Error(`${name} is required`);
  }
  return process.env[name];
}

function artifact(contracts, file, name) {
  const c = contracts[file][name];
  return { abi: c.abi, bytecode: "0x" + c.evm.bytecode.object };
}

function adapterInitCode(adapterArtifact, poolManager, coreAddress) {
  const constructorArgs = ethers.AbiCoder.defaultAbiCoder().encode(["address", "address"], [poolManager, coreAddress]);
  return ethers.concat([adapterArtifact.bytecode || `0x${adapterArtifact.evm.bytecode.object}`, constructorArgs]);
}

function predictCreate2Address(deployer, salt, initCode) {
  return ethers.getCreate2Address(deployer, salt, ethers.keccak256(initCode));
}

function hasExpectedHookFlags(address, expectedFlags = AFTER_SWAP_FLAG) {
  return (BigInt(address) & FLAG_MASK) === expectedFlags;
}

function mineHookSalt({ deployer, initCode, maxIterations = MAX_MINE_ITERATIONS, expectedFlags = AFTER_SWAP_FLAG }) {
  for (let i = 0n; i < BigInt(maxIterations); i += 1n) {
    const salt = ethers.zeroPadValue(ethers.toBeHex(i), 32);
    const predicted = predictCreate2Address(deployer, salt, initCode);
    if (hasExpectedHookFlags(predicted, expectedFlags)) {
      return { salt, predicted };
    }
  }
  throw new Error(`No matching salt found within ${maxIterations} iterations`);
}

function buildCreate2Calldata(salt, initCode) {
  return ethers.concat([salt, initCode]);
}

function buildPoolKey({ tokenA, tokenB, fee, tickSpacing, hooks }) {
  const a = ethers.getAddress(tokenA).toLowerCase();
  const b = ethers.getAddress(tokenB).toLowerCase();
  if (a === b) throw new Error("Pool currencies must be different");
  const [currency0, currency1] = BigInt(a) < BigInt(b) ? [a, b] : [b, a];
  return {
    currency0,
    currency1,
    fee: Number(fee),
    tickSpacing: Number(tickSpacing),
    hooks: ethers.getAddress(hooks)
  };
}

module.exports = {
  AFTER_SWAP_FLAG,
  CREATE2_DEPLOYER,
  FLAG_MASK,
  MAX_MINE_ITERATIONS,
  XLAYER_MAINNET_POOL_MANAGER,
  adapterInitCode,
  artifact,
  buildCreate2Calldata,
  buildPoolKey,
  hasExpectedHookFlags,
  mineHookSalt,
  predictCreate2Address,
  requireEnv
};
