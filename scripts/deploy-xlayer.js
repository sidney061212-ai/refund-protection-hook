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
  const tx = c.deploymentTransaction();
  await c.waitForDeployment();
  return { contract: c, txHash: tx.hash };
}

async function sendAndWait(label, txPromise) {
  const tx = await txPromise;
  console.log(`${label} tx:`, tx.hash);
  const receipt = await tx.wait();
  if (receipt.status !== 1) throw new Error(`${label} reverted: ${tx.hash}`);
  return tx.hash;
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

  const stableDeployment = await deploy(wallet, artifact(contracts, "MockERC20.sol", "MockERC20"), ["Mock USDC", "mUSDC", 6]);
  const tokenDeployment = await deploy(wallet, artifact(contracts, "MockERC20.sol", "MockERC20"), ["Launch Token", "LCH", 18]);
  const vaultDeployment = await deploy(wallet, artifact(contracts, "RefundInsuranceVault.sol", "RefundInsuranceVault"), [projectTreasury, protocolTreasury]);
  const hookDeployment = await deploy(wallet, artifact(contracts, "RefundProtectionHook.sol", "RefundProtectionHook"), [await vaultDeployment.contract.getAddress()]);
  const stable = stableDeployment.contract;
  const token = tokenDeployment.contract;
  const vault = vaultDeployment.contract;
  const hook = hookDeployment.contract;

  const txs = {
    mockUSDCDeploy: stableDeployment.txHash,
    mockTOKENDeploy: tokenDeployment.txHash,
    vaultDeploy: vaultDeployment.txHash,
    hookDeploy: hookDeployment.txHash
  };
  txs.setHook = await sendAndWait("set vault hook", vault.setHook(await hook.getAddress()));
  txs.setStable = await sendAndWait("support stable", vault.setStable(await stable.getAddress(), true));
  txs.mintReserve = await sendAndWait("mint reserve stable", stable.mint(wallet.address, initialReserve));
  txs.approveReserve = await sendAndWait("approve reserve deposit", stable.approve(await vault.getAddress(), initialReserve));
  txs.depositReserve = await sendAndWait("deposit reserve", vault.deposit(await stable.getAddress(), initialReserve));

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
  txs.configurePair = await sendAndWait("configure protected pair", hook.configurePair(pairConfig));

  console.log(`Network: X Layer (Chain ID ${chainId})`);
  console.log("MockUSDC:", await stable.getAddress());
  console.log("MockTOKEN:", await token.getAddress());
  console.log("RefundInsuranceVault:", await vault.getAddress());
  console.log("RefundProtectionHook:", await hook.getAddress());
  console.log("Configured pairId:", await hook.pairId(await stable.getAddress(), await token.getAddress()));
  console.log("Transaction hashes:", JSON.stringify(txs, null, 2));
  console.log("\nAdd these to .env for the v4 steps:");
  console.log(`MOCK_USDC_ADDRESS=${await stable.getAddress()}`);
  console.log(`MOCK_TOKEN_ADDRESS=${await token.getAddress()}`);
  console.log(`REFUND_INSURANCE_VAULT_ADDRESS=${await vault.getAddress()}`);
  console.log(`REFUND_PROTECTION_CORE_ADDRESS=${await hook.getAddress()}`);
  console.log(`POOL_TOKEN_A=${await stable.getAddress()}`);
  console.log(`POOL_TOKEN_B=${await token.getAddress()}`);

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
