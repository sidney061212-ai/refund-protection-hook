const { ethers } = require("ethers");
require("dotenv").config();
const { compileProject } = require("./solc-utils");

function artifact(contracts, file, name) {
  const c = contracts[file][name];
  return { abi: c.abi, bytecode: "0x" + c.evm.bytecode.object };
}

async function deploy(wallet, art, args = []) {
  const f = new ethers.ContractFactory(art.abi, art.bytecode, wallet);
  const c = await f.deploy(...args);
  await c.waitForDeployment();
  return c;
}

async function main() {
  if (!process.env.PRIVATE_KEY) throw new Error("PRIVATE_KEY missing");
  const chainId = Number(process.env.XLAYER_CHAIN_ID || 1952);
  const rpc = chainId === 196
    ? (process.env.XLAYER_RPC_URL || "https://rpc.xlayer.tech")
    : (process.env.XLAYER_TESTNET_RPC_URL || "https://testrpc.xlayer.tech/terigon");
  const provider = new ethers.JsonRpcProvider(rpc, chainId);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contracts = compileProject().contracts;

  const projectTreasury = process.env.PROJECT_TREASURY || wallet.address;
  const protocolTreasury = process.env.PROTOCOL_TREASURY || wallet.address;
  const initialReserve = ethers.parseUnits(process.env.INITIAL_RESERVE_USDC || "10000", 6);

  const stable = await deploy(wallet, artifact(contracts, "MockERC20.sol", "MockERC20"), ["Mock USDC", "mUSDC", 6]);
  const token = await deploy(wallet, artifact(contracts, "MockERC20.sol", "MockERC20"), ["Launch Token", "LCH", 18]);
  const vault = await deploy(wallet, artifact(contracts, "RefundInsuranceVault.sol", "RefundInsuranceVault"), [projectTreasury, protocolTreasury]);
  const hook = await deploy(wallet, artifact(contracts, "RefundProtectionHook.sol", "RefundProtectionHook"), [await vault.getAddress()]);

  await (await vault.setHook(await hook.getAddress())).wait();
  await (await vault.setStable(await stable.getAddress(), true)).wait();
  await (await stable.mint(wallet.address, initialReserve)).wait();
  await (await stable.approve(await vault.getAddress(), initialReserve)).wait();
  await (await vault.deposit(await stable.getAddress(), initialReserve)).wait();

  const pairConfig = {
    enabled: true,
    stableToken: await stable.getAddress(),
    projectToken: await token.getAddress(),
    minPrincipal: ethers.parseUnits(process.env.MIN_PRINCIPAL_USDC || "10", 6),
    maxPrincipalPerOrder: ethers.parseUnits(process.env.MAX_PRINCIPAL_PER_ORDER_USDC || "200", 6),
    maxPrincipalPerUserPerWindow: ethers.parseUnits(process.env.MAX_PRINCIPAL_PER_USER_WINDOW_USDC || "300", 6),
    userWindowSeconds: Number(process.env.USER_WINDOW_SECONDS || 24 * 60 * 60),
    protectionSeconds: Number(process.env.PROTECTION_SECONDS || 24 * 60 * 60),
    basePremiumBps: Number(process.env.BASE_PREMIUM_BPS || 300),
    refundFeeBps: Number(process.env.REFUND_FEE_BPS || 500),
    payoutBps: Number(process.env.PAYOUT_BPS || 9500),
    maxExposureBps: Number(process.env.MAX_EXPOSURE_BPS || 5000)
  };
  await (await hook.configurePair(pairConfig)).wait();

  console.log(`Network: X Layer (Chain ID ${chainId})`);
  console.log("MockUSDC:", await stable.getAddress());
  console.log("MockTOKEN:", await token.getAddress());
  console.log("RefundInsuranceVault:", await vault.getAddress());
  console.log("RefundProtectionHook:", await hook.getAddress());
  console.log("Configured pairId:", await hook.pairId(await stable.getAddress(), await token.getAddress()));

  if (process.env.V4_POOL_MANAGER_ADDRESS) {
    console.log("V4 pool manager set in env:", process.env.V4_POOL_MANAGER_ADDRESS);
    console.log("Next step:");
    console.log(`REFUND_PROTECTION_CORE_ADDRESS=${await hook.getAddress()} npm run mine:hook`);
    console.log("Then run `npm run deploy:v4-adapter` with the printed CREATE2_SALT.");
  } else {
    console.log("V4 adapter not deployed by this script.");
    console.log("To deploy the real BaseHook adapter, set V4_POOL_MANAGER_ADDRESS and mine a CREATE2 address whose low bits match AFTER_SWAP.");
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
