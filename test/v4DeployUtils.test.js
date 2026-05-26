const { expect } = require("chai");
const { ethers } = require("ethers");

describe("v4 deployment utilities", function () {
  it("detects the afterSwap hook permission flag in the address low bits", function () {
    const {
      AFTER_SWAP_FLAG,
      hasExpectedHookFlags
    } = require("../scripts/v4-deploy-utils");

    expect(hasExpectedHookFlags("0x0000000000000000000000000000000000000040")).to.equal(true);
    expect(hasExpectedHookFlags("0x0000000000000000000000000000000000000000")).to.equal(false);
    expect(AFTER_SWAP_FLAG).to.equal(1n << 6n);
  });

  it("predicts CREATE2 addresses from deployer, salt, and init code", function () {
    const { predictCreate2Address } = require("../scripts/v4-deploy-utils");
    const deployer = "0x4e59b44847b379578588920cA78FbF26c0B4956C";
    const salt = ethers.zeroPadValue("0x2a", 32);
    const initCode = "0x6001600055";

    expect(predictCreate2Address(deployer, salt, initCode)).to.equal(
      ethers.getCreate2Address(deployer, salt, ethers.keccak256(initCode))
    );
  });

  it("sorts ERC20 currencies for a Uniswap v4 PoolKey", function () {
    const { buildPoolKey } = require("../scripts/v4-deploy-utils");
    const tokenA = "0x00000000000000000000000000000000000000bb";
    const tokenB = "0x00000000000000000000000000000000000000aa";
    const hooks = "0x0000000000000000000000000000000000000040";

    expect(buildPoolKey({ tokenA, tokenB, fee: 3000, tickSpacing: 60, hooks })).to.deep.equal({
      currency0: "0x00000000000000000000000000000000000000aa",
      currency1: "0x00000000000000000000000000000000000000bb",
      fee: 3000,
      tickSpacing: 60,
      hooks
    });
  });
});
