const { expect } = require("chai");
const { ethers } = require("ethers");
const { compileProject } = require("../scripts/solc-utils");

describe("v4 demo flow tooling", function () {
  it("compiles the mainnet demo helper used for liquidity and protected swaps", function () {
    const contracts = compileProject().contracts;
    expect(contracts["UniswapV4DemoHelper.sol"].UniswapV4DemoHelper.abi).to.be.an("array");
  });

  it("encodes buyer hook data and derives the v4 PoolId from the PoolKey", function () {
    const { encodeProtectionHookData, poolIdFromKey } = require("../scripts/v4-demo-flow");
    const buyer = "0x00000000000000000000000000000000000000b0";
    const key = {
      currency0: "0x00000000000000000000000000000000000000aa",
      currency1: "0x00000000000000000000000000000000000000bb",
      fee: 3000,
      tickSpacing: 60,
      hooks: "0x0000000000000000000000000000000000000040"
    };

    expect(encodeProtectionHookData(true, buyer)).to.equal(
      ethers.AbiCoder.defaultAbiCoder().encode(["bool", "address"], [true, buyer])
    );
    expect(poolIdFromKey(key)).to.equal(ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
      ["tuple(address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks)"],
      [key]
    )));
  });
});
