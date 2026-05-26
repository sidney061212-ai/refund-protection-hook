const fs = require("fs");
const path = require("path");

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

function isRealAddress(value) {
  return typeof value === "string" && ADDRESS_RE.test(value) && !/^0x0{40}$/i.test(value);
}

function readDeploymentHints() {
  const deploymentsPath = path.join(__dirname, "..", "DEPLOYMENTS.md");
  const text = fs.existsSync(deploymentsPath) ? fs.readFileSync(deploymentsPath, "utf8") : "";
  return {
    hasTbd: /\bTBD\b/i.test(text),
    addresses: [...text.matchAll(/0x[a-fA-F0-9]{40}/g)].map((match) => match[0]),
    poolIds: [...text.matchAll(/0x[a-fA-F0-9]{64}/g)].map((match) => match[0]),
    mentionsMainnet: /X Layer mainnet/i.test(text),
    mentionsProtectedSwap: /Protected v4 swap/i.test(text)
  };
}

function inferEvidence(env = process.env) {
  const deployments = readDeploymentHints();
  const hookFromEnv = env.V4_HOOK_ADDRESS || env.UNISWAP_V4_HOOK_ADDRESS;
  const poolFromEnv = env.V4_POOL_ID || env.V4_POOL_ADDRESS || env.UNISWAP_V4_POOL_ADDRESS;
  const hasDeploymentHook = deployments.addresses.some((address) => isRealAddress(address));
  const hasDeploymentPool = deployments.poolIds.length > 0 && deployments.mentionsMainnet;

  return {
    localCheckPassing: false,
    hasV4Adapter: fs.existsSync(path.join(__dirname, "..", "src", "UniswapV4RefundProtectionAdapter.sol")),
    hasDeploymentScripts:
      fs.existsSync(path.join(__dirname, "deploy-v4-adapter.js")) &&
      fs.existsSync(path.join(__dirname, "initialize-v4-pool.js")),
    hasDemoVideo: fs.existsSync(path.join(__dirname, "..", "demo-video", "out", "refund-protection-demo.mp4")),
    hasDedicatedSocialAccount: Boolean(env.PROJECT_X_ACCOUNT || env.TWITTER_ACCOUNT),
    hasLiveHookAddress: isRealAddress(hookFromEnv) || hasDeploymentHook,
    hasLivePoolAddress: Boolean(poolFromEnv && (isRealAddress(poolFromEnv) || /^0x[a-fA-F0-9]{64}$/.test(poolFromEnv))) || hasDeploymentPool,
    deploymentsStillHaveTbd: deployments.hasTbd
  };
}

function roundScore(score) {
  return Math.round(score * 10) / 10;
}

function assessSubmission(evidence) {
  const blockers = [];
  const nextActions = [];

  let innovation = evidence.hasV4Adapter ? 9.3 : 8.4;
  let marketPotential = 8.9;
  let codeQuality = evidence.localCheckPassing ? 9.2 : 8.4;
  let completion = 7.4;
  let demoBonus = evidence.hasDemoVideo ? 0.3 : 0;

  if (evidence.hasDeploymentScripts) completion += 0.5;
  if (evidence.hasLiveHookAddress) completion += 0.8;
  if (evidence.hasLivePoolAddress) completion += 0.8;
  if (evidence.hasDedicatedSocialAccount) completion += 0.2;
  completion = Math.min(completion, 9.8);

  if (!evidence.hasLiveHookAddress) {
    blockers.push("Missing verifiable live X Layer v4 Hook address.");
    nextActions.push("Deploy the mined afterSwap hook adapter on X Layer and paste the explorer link into DEPLOYMENTS.md.");
  }

  if (!evidence.hasLivePoolAddress) {
    blockers.push("Missing verifiable live X Layer v4 Pool address or PoolId.");
    nextActions.push("Initialize a Uniswap v4 pool with the deployed hook and paste the PoolManager transaction / PoolId.");
  }

  if (!evidence.hasDedicatedSocialAccount) {
    blockers.push("Missing dedicated project X/Twitter account evidence.");
    nextActions.push("Create or provide the project X account and tag @XLayerOfficial, @Uniswap, and @flapdotsh.");
  }

  if (!evidence.hasDemoVideo) {
    nextActions.push("Render and upload the 1-3 minute demo video.");
  }

  const baseScore =
    innovation * 0.25 +
    marketPotential * 0.2 +
    codeQuality * 0.2 +
    completion * 0.35 +
    demoBonus;

  const total = blockers.length === 0 ? Math.min(9.8, baseScore) : Math.min(9.4, baseScore);

  return {
    total: roundScore(total),
    qualified: blockers.length === 0 && total >= 9.5,
    dimensions: {
      innovation: roundScore(innovation),
      marketPotential: roundScore(marketPotential),
      codeQuality: roundScore(codeQuality),
      completion: roundScore(completion),
      demoBonus
    },
    blockers,
    nextActions
  };
}

function printAssessment(result) {
  console.log(`Estimated score: ${result.total}/10`);
  console.log(`9.5+ qualified: ${result.qualified ? "yes" : "no"}`);
  console.log("\nDimensions:");
  for (const [key, value] of Object.entries(result.dimensions)) {
    console.log(`- ${key}: ${value}`);
  }

  if (result.blockers.length > 0) {
    console.log("\nHard blockers:");
    for (const blocker of result.blockers) console.log(`- ${blocker}`);
  }

  if (result.nextActions.length > 0) {
    console.log("\nNext actions:");
    for (const action of result.nextActions) console.log(`- ${action}`);
  }
}

if (require.main === module) {
  require("dotenv").config();
  const evidence = inferEvidence();
  const localCheckPassing = process.argv.includes("--local-check-passing");
  const result = assessSubmission({ ...evidence, localCheckPassing });
  printAssessment(result);

  if (process.argv.includes("--strict") && !result.qualified) {
    process.exit(1);
  }
}

module.exports = {
  assessSubmission,
  inferEvidence,
  isRealAddress
};
