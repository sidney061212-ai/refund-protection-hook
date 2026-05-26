const { spawnSync } = require("child_process");

const steps = [
  ["Compile contracts", "npm", ["run", "compile"]],
  ["Run automated tests", "npm", ["test"]],
  ["Run local demo", "npm", ["run", "demo"]]
];

for (const [label, command, args] of steps) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) {
    console.error(`\nSubmission check failed at: ${label}`);
    process.exit(result.status || 1);
  }
}

console.log("\nSubmission check passed: compile, tests, and demo all completed successfully.");
