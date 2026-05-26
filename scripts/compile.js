const fs = require("fs");
const path = require("path");
const solc = require("solc");
const { compileProject } = require("./solc-utils");

let output;
try {
  output = compileProject();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

fs.mkdirSync(path.join(__dirname, "..", "build"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "..", "build", "solc-output.json"), JSON.stringify(output, null, 2));
console.log("Compiled", Object.keys(output.contracts).length, "source files with solc", solc.version());
