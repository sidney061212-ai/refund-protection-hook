const { expect } = require("chai");
const ganache = require("ganache");
const { ethers } = require("ethers");
const { compileProject } = require("../scripts/solc-utils");

function compile() {
  return compileProject().contracts;
}

async function expectRevert(action, expectedFragment, decoder) {
  try {
    await action();
    expect.fail(`Expected revert including "${expectedFragment}"`);
  } catch (error) {
    const fragments = [
      error?.shortMessage,
      error?.reason,
      error?.revert?.name,
      error?.info?.error?.message,
      error?.info?.error?.data?.reason,
      error?.info?.error?.data?.message
    ].filter(Boolean);

    const rawResult = error?.info?.error?.data?.result;
    if (rawResult && decoder) {
      try {
        fragments.push(decoder.interface.parseError(rawResult).name);
      } catch (_) {
        // ignore decode failures for string reverts from mock tokens
      }
    }

    const combined = fragments.join(" | ") || String(error);
    expect(combined).to.include(expectedFragment);
  }
}

async function deploy(contracts, file, name, signer, args = []) {
  const c = contracts[file][name];
  const factory = new ethers.ContractFactory(c.abi, c.evm.bytecode.object, signer);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  return contract;
}

const parse = ethers.parseUnits;

describe("Refund Protection Hook MVP", function () {
  let provider, accounts, owner, buyer, projectTreasury, protocolTreasury, otherUser, stable, token, vault, hook, contracts, pairConfig;

  before(function () {
    contracts = compile();
  });

  async function configurePair(overrides = {}) {
    const nextConfig = { ...pairConfig, ...overrides };
    await (await hook.connect(owner).configurePair(nextConfig)).wait();
    pairConfig = nextConfig;
  }

  async function recordProtectedSwap({
    recorder = owner,
    principal = parse("100", 6),
    tokenAmountOut = parse("1000", 18),
    buyerAddress = buyer.address
  } = {}) {
    const tx = await hook.connect(recorder).recordProtectedSwap(
      buyerAddress,
      await stable.getAddress(),
      await token.getAddress(),
      principal,
      tokenAmountOut
    );
    await tx.wait();
    return tx;
  }

  beforeEach(async function () {
    provider = new ethers.BrowserProvider(ganache.provider({ logging: { quiet: true }, chain: { hardfork: "shanghai" } }));
    accounts = await provider.listAccounts();
    [owner, buyer, projectTreasury, protocolTreasury, otherUser] = accounts;

    stable = await deploy(contracts, "MockERC20.sol", "MockERC20", owner, ["Mock USDC", "mUSDC", 6]);
    token = await deploy(contracts, "MockERC20.sol", "MockERC20", owner, ["Launch Token", "LCH", 18]);
    vault = await deploy(contracts, "RefundInsuranceVault.sol", "RefundInsuranceVault", owner, [projectTreasury.address, protocolTreasury.address]);
    hook = await deploy(contracts, "RefundProtectionHook.sol", "RefundProtectionHook", owner, [await vault.getAddress()]);

    await (await vault.connect(owner).setHook(await hook.getAddress())).wait();
    await (await vault.connect(owner).setStable(await stable.getAddress(), true)).wait();
    await (await stable.connect(owner).mint(owner.address, parse("100000", 6))).wait();
    await (await stable.connect(owner).approve(await vault.getAddress(), parse("100000", 6))).wait();
    await (await vault.connect(owner).deposit(await stable.getAddress(), parse("10000", 6))).wait();

    await (await stable.connect(owner).mint(buyer.address, parse("1000", 6))).wait();
    await (await token.connect(owner).mint(buyer.address, parse("10000", 18))).wait();
    await (await token.connect(owner).mint(otherUser.address, parse("1000", 18))).wait();
    await (await stable.connect(buyer).approve(await hook.getAddress(), parse("1000", 6))).wait();
    await (await token.connect(buyer).approve(await hook.getAddress(), parse("10000", 18))).wait();

    pairConfig = {
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
    await (await hook.connect(owner).configurePair(pairConfig)).wait();
  });

  it("records a protected swap, collects premium, and locks exposure", async function () {
    await recordProtectedSwap();
    const locked = await vault.lockedExposure(await stable.getAddress());
    expect(locked).to.equal(parse("95", 6));
    expect(await hook.nextOrderId()).to.equal(2n);

    expect(await stable.balanceOf(projectTreasury.address)).to.equal(parse("0.3", 6));
    expect(await stable.balanceOf(protocolTreasury.address)).to.equal(parse("0.3", 6));
  });

  it("rejects protected swap recording from unauthorized callers", async function () {
    await expectRevert(() => recordProtectedSwap({ recorder: otherUser }), "NotRouterOrHook", hook);
  });

  it("allows the owner to rotate the authorized hook adapter", async function () {
    await (await hook.connect(owner).setAuthorizedRecorder(otherUser.address)).wait();
    await recordProtectedSwap({ recorder: otherUser });
    expect(await hook.nextOrderId()).to.equal(2n);
  });

  it("refunds within 24h, charges premium/refund fee, and closes exposure", async function () {
    await recordProtectedSwap();
    const before = await stable.balanceOf(buyer.address);
    await (await hook.connect(buyer).refund(1)).wait();
    const after = await stable.balanceOf(buyer.address);
    // 95% max payout minus 5% refund fee = 90 USDC returned. Premium paid at record time is separate.
    expect(after - before).to.equal(parse("90", 6));
    expect(await vault.lockedExposure(await stable.getAddress())).to.equal(0n);
    const order = await hook.orders(1);
    expect(order.status).to.equal(2n); // REFUNDED

    expect(await stable.balanceOf(projectTreasury.address)).to.equal(parse("0.8", 6));
    expect(await stable.balanceOf(protocolTreasury.address)).to.equal(parse("0.8", 6));
  });

  it("quotes a higher dynamic premium as vault utilization rises", async function () {
    const id = await hook.pairId(await stable.getAddress(), await token.getAddress());
    const [premiumBefore] = await hook.quotePremium(id, parse("100", 6));

    await recordProtectedSwap({ principal: parse("200", 6), tokenAmountOut: parse("2000", 18) });
    const [premiumAfter] = await hook.quotePremium(id, parse("100", 6));

    expect(premiumAfter > premiumBefore).to.equal(true);
  });

  it("finalizes after deadline and releases exposure", async function () {
    await recordProtectedSwap();
    await provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
    await provider.send("evm_mine", []);
    await (await hook.connect(buyer).finalize(1)).wait();
    expect(await vault.lockedExposure(await stable.getAddress())).to.equal(0n);
    const order = await hook.orders(1);
    expect(order.status).to.equal(3n); // FINALIZED
  });

  it("rejects protected buys above the per-order limit", async function () {
    await expectRevert(
      () => recordProtectedSwap({ principal: parse("201", 6), tokenAmountOut: parse("2000", 18) }),
      "BelowMinOrAboveMax",
      hook
    );
  });

  it("rejects protected buys that exceed the per-user rolling window limit", async function () {
    await recordProtectedSwap({ principal: parse("200", 6), tokenAmountOut: parse("2000", 18) });
    await expectRevert(
      () => recordProtectedSwap({ principal: parse("101", 6), tokenAmountOut: parse("1010", 18) }),
      "BelowMinOrAboveMax",
      hook
    );
  });

  it("rejects malformed pair configs before they can create runtime risk", async function () {
    const stableAddress = await stable.getAddress();
    await expectRevert(() => configurePair({ userWindowSeconds: 0 }), "BadConfig", hook);
    await expectRevert(() => configurePair({ minPrincipal: parse("250", 6) }), "BadConfig", hook);
    await expectRevert(() => configurePair({ maxPrincipalPerUserPerWindow: parse("100", 6) }), "BadConfig", hook);
    await expectRevert(() => configurePair({ projectToken: stableAddress }), "BadConfig", hook);
  });

  it("rejects protected buys when pair protection is disabled", async function () {
    await configurePair({ enabled: false });
    await expectRevert(() => recordProtectedSwap(), "ProtectionDisabled", hook);
  });

  it("rejects protected buys when vault exposure capacity is insufficient", async function () {
    await configurePair({ maxExposureBps: 100 });
    await expectRevert(
      () => recordProtectedSwap({ principal: parse("110", 6), tokenAmountOut: parse("1100", 18) }),
      "ExposureLimitReached",
      hook
    );
  });

  it("rejects refunds from anyone except the original buyer", async function () {
    await recordProtectedSwap();
    await expectRevert(() => hook.connect(otherUser).refund(1), "NotBuyer", hook);
  });

  it("rejects refunds after the protection window expires", async function () {
    await recordProtectedSwap();
    await provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
    await provider.send("evm_mine", []);
    await expectRevert(() => hook.connect(buyer).refund(1), "Expired", hook);
  });

  it("rejects refunds when the buyer no longer holds enough project tokens", async function () {
    await recordProtectedSwap();
    await (await token.connect(buyer).transfer(otherUser.address, parse("9501", 18))).wait();
    await expectRevert(() => hook.connect(buyer).refund(1), "BALANCE");
  });

  it("keeps fee splits correct across premium collection and refund settlement", async function () {
    await recordProtectedSwap();

    expect(await stable.balanceOf(projectTreasury.address)).to.equal(parse("0.3", 6));
    expect(await stable.balanceOf(protocolTreasury.address)).to.equal(parse("0.3", 6));

    await (await hook.connect(buyer).refund(1)).wait();

    expect(await stable.balanceOf(projectTreasury.address)).to.equal(parse("0.8", 6));
    expect(await stable.balanceOf(protocolTreasury.address)).to.equal(parse("0.8", 6));
    expect(await stable.balanceOf(await vault.getAddress())).to.equal(parse("9911.4", 6));
  });
});
