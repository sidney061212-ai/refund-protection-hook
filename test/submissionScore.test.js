const { expect } = require("chai");

describe("submission score assessment", function () {
  it("keeps the score below 9.5 when live X Layer hook and pool addresses are missing", function () {
    const { assessSubmission } = require("../scripts/submission-score");

    const result = assessSubmission({
      localCheckPassing: true,
      hasV4Adapter: true,
      hasDeploymentScripts: true,
      hasDemoVideo: true,
      hasDedicatedSocialAccount: true,
      hasLiveHookAddress: false,
      hasLivePoolAddress: false
    });

    expect(result.qualified).to.equal(false);
    expect(result.total).to.be.below(9.5);
    expect(result.blockers).to.include("Missing verifiable live X Layer v4 Hook address.");
    expect(result.nextActions[0]).to.match(/Deploy/);
  });

  it("scores above 9.5 only when deployment, demo, and social requirements are present", function () {
    const { assessSubmission } = require("../scripts/submission-score");

    const result = assessSubmission({
      localCheckPassing: true,
      hasV4Adapter: true,
      hasDeploymentScripts: true,
      hasDemoVideo: true,
      hasDedicatedSocialAccount: true,
      hasLiveHookAddress: true,
      hasLivePoolAddress: true
    });

    expect(result.qualified).to.equal(true);
    expect(result.total).to.be.at.least(9.5);
    expect(result.blockers).to.deep.equal([]);
  });
});
