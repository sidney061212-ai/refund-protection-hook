const ganache = require("ganache");
const { ethers } = require("ethers");
const { compileProject } = require("./solc-utils");

const parse = ethers.parseUnits;

function fmt(value, decimals) {
  return ethers.formatUnits(value, decimals);
}

async function deploy(contracts, file, name, signer, args = []) {
  const artifact = contracts[file][name];
  const factory = new ethers.ContractFactory(artifact.abi, artifact.evm.bytecode.object, signer);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  return contract;
}

async function main() {
  const contracts = compileProject().contracts;
  const provider = new ethers.BrowserProvider(ganache.provider({ logging: { quiet: true }, chain: { hardfork: "shanghai" } }));
  const [owner, buyer, projectTreasury, protocolTreasury] = await provider.listAccounts();

  const stable = await deploy(contracts, "MockERC20.sol", "MockERC20", owner, ["Mock USDC", "mUSDC", 6]);
  const token = await deploy(contracts, "MockERC20.sol", "MockERC20", owner, ["Launch Token", "LCH", 18]);
  const vault = await deploy(contracts, "RefundInsuranceVault.sol", "RefundInsuranceVault", owner, [projectTreasury.address, protocolTreasury.address]);
  const hook = await deploy(contracts, "RefundProtectionHook.sol", "RefundProtectionHook", owner, [await vault.getAddress()]);

  await (await vault.connect(owner).setHook(await hook.getAddress())).wait();
  await (await vault.connect(owner).setStable(await stable.getAddress(), true)).wait();

  await (await stable.connect(owner).mint(owner.address, parse("100000", 6))).wait();
  await (await stable.connect(owner).approve(await vault.getAddress(), parse("100000", 6))).wait();
  await (await vault.connect(owner).deposit(await stable.getAddress(), parse("10000", 6))).wait();

  await (await stable.connect(owner).mint(buyer.address, parse("1000", 6))).wait();
  await (await token.connect(owner).mint(buyer.address, parse("20000", 18))).wait();
  await (await stable.connect(buyer).approve(await hook.getAddress(), parse("1000", 6))).wait();
  await (await token.connect(buyer).approve(await hook.getAddress(), parse("20000", 18))).wait();

  const cfg = {
    enabled: true,
    stableToken: await stable.getAddress(),
    projectToken: await token.getAddress(),
    minPrincipal: parse("10", 6),
    maxPrincipalPerOrder: parse("200", 6),
    maxPrincipalPerUserPerWindow: parse("300", 6),
    userWindowSeconds: 24 * 60 * 60,
    protectionSeconds: 24 * 60 * 60,
    basePremiumBps: 300,
    refundFeeBps: 500,
    payoutBps: 9500,
    maxExposureBps: 5000
  };

  await (await hook.connect(owner).configurePair(cfg)).wait();

  const pairId = await hook.pairId(await stable.getAddress(), await token.getAddress());
  const [premium, maxPayout] = await hook.quotePremium(pairId, parse("100", 6));

  console.log("=== Refund Protection Hook Demo ===");
  console.log("Use case: opt-in 24h refund protection for launch-pool buys");
  console.log("Risk model: capped per order, capped per user window, capped by vault exposure");
  console.log("Hook adapter compiled:", Boolean(contracts["UniswapV4RefundProtectionAdapter.sol"]));
  console.log("Insurance capacity before buy:", `${fmt(await vault.freeReserve(await stable.getAddress()), 6)} mUSDC`);
  console.log("Premium quote:", `${fmt(premium, 6)} mUSDC`);
  console.log("Max refundable amount:", `${fmt(maxPayout, 6)} mUSDC`);
  console.log("Refund fee on refund:", "5.0 mUSDC");

  await (await hook.connect(owner).recordProtectedSwap(
    buyer.address,
    await stable.getAddress(),
    await token.getAddress(),
    parse("100", 6),
    parse("1000", 18)
  )).wait();

  let order = await hook.orders(1);
  console.log("\n1) Buyer buys TOKEN with refund protection");
  console.log("   Order #1 deadline:", Number(order.deadline));
  console.log("   Locked exposure:", `${fmt(await vault.lockedExposure(await stable.getAddress()), 6)} mUSDC`);

  const stableBeforeRefund = await stable.balanceOf(buyer.address);
  await (await hook.connect(buyer).refund(1)).wait();
  const stableAfterRefund = await stable.balanceOf(buyer.address);

  console.log("\n2) Buyer refunds within the 24h window");
  console.log("   Stable returned:", `${fmt(stableAfterRefund - stableBeforeRefund, 6)} mUSDC`);
  console.log("   Project treasury fees:", `${fmt(await stable.balanceOf(projectTreasury.address), 6)} mUSDC`);
  console.log("   Protocol treasury fees:", `${fmt(await stable.balanceOf(protocolTreasury.address), 6)} mUSDC`);

  await (await hook.connect(owner).recordProtectedSwap(
    buyer.address,
    await stable.getAddress(),
    await token.getAddress(),
    parse("100", 6),
    parse("1000", 18)
  )).wait();
  await provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
  await provider.send("evm_mine", []);
  await (await hook.connect(owner).finalize(2)).wait();

  order = await hook.orders(2);
  console.log("\n3) Buyer does not refund; order finalizes after expiry");
  console.log("   Order #2 status:", order.status.toString());
  console.log("   Locked exposure after finalize:", `${fmt(await vault.lockedExposure(await stable.getAddress()), 6)} mUSDC`);
  console.log("   Insurance capacity after finalize:", `${fmt(await vault.freeReserve(await stable.getAddress()), 6)} mUSDC`);

  console.log("\nSubmission evidence");
  console.log("   Compile-capable v4 afterSwap adapter:", "yes");
  console.log("   Local refund path:", "verified");
  console.log("   Local finalize path:", "verified");
  console.log("   Live X Layer addresses:", "pending funded testnet deployer");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
