const fs = require("fs");
const path = require("path");
const solc = require("solc");

const ROOT = path.join(__dirname, "..");
const SRC_DIR = path.join(ROOT, "src");
const IMPORT_RE = /^\s*import\s+(?:[^"']*from\s+)?["']([^"']+)["'];/gm;

function normalizeUnit(unitName) {
  return unitName.split(path.sep).join("/");
}

function resolveImport(importPath, importerUnitName, importerFullPath) {
  if (importPath.startsWith(".")) {
    return {
      unitName: normalizeUnit(path.posix.normalize(path.posix.join(path.posix.dirname(importerUnitName), importPath))),
      fullPath: path.resolve(path.dirname(importerFullPath), importPath)
    };
  }

  if (importPath.startsWith("openzeppelin-contracts/contracts/")) {
    const mapped = `@openzeppelin/contracts/${importPath.slice("openzeppelin-contracts/contracts/".length)}`;
    return {
      unitName: mapped,
      fullPath: path.join(ROOT, "node_modules", mapped)
    };
  }

  return {
    unitName: importPath,
    fullPath: path.join(ROOT, "node_modules", importPath)
  };
}

function collectSourceGraph(sources, seen, unitName, fullPath) {
  const normalizedUnit = normalizeUnit(unitName);
  const normalizedPath = path.normalize(fullPath);
  if (seen.has(normalizedUnit)) return;
  if (!fs.existsSync(normalizedPath)) {
    throw new Error(`Missing Solidity import: ${normalizedUnit}`);
  }

  seen.add(normalizedUnit);
  const content = fs.readFileSync(normalizedPath, "utf8");
  sources[normalizedUnit] = { content };

  for (const match of content.matchAll(IMPORT_RE)) {
    const resolved = resolveImport(match[1], normalizedUnit, normalizedPath);
    collectSourceGraph(sources, seen, resolved.unitName, resolved.fullPath);
  }
}

function compileProject() {
  const sources = {};
  const seen = new Set();
  for (const file of fs.readdirSync(SRC_DIR)) {
    if (!file.endsWith(".sol")) continue;
    collectSourceGraph(sources, seen, file, path.join(SRC_DIR, file));
  }

  const input = {
    language: "Solidity",
    sources,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
      evmVersion: "paris",
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"]
        }
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (output.errors || []).filter((entry) => entry.severity === "error");
  if (errors.length) {
    throw new Error(errors.map((entry) => entry.formattedMessage).join("\n"));
  }

  return output;
}

module.exports = {
  compileProject
};
