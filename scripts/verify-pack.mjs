/**
 * Simulates a consumer installing the package artifact.
 *
 * Validates:
 * - `npm pack` works
 * - `files` + `exports` are correct
 * - ESM import and CJS require both resolve
 *
 * Usage:
 *   npm run verify:pack
 */

import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function run(cmd, opts = {}) {
  execSync(cmd, { cwd: repoRoot, stdio: "inherit", ...opts });
}

function runIn(dir, cmd, opts = {}) {
  execSync(cmd, { cwd: dir, stdio: "inherit", ...opts });
}

console.log("Building...");
run("npm run build");

const tmpRoot = path.join(repoRoot, ".tmp");
const npmCacheDir = path.join(tmpRoot, "npm-cache");
fs.mkdirSync(npmCacheDir, { recursive: true });

// Important: avoid using ~/.npm which can have permission issues.
const env = { ...process.env, npm_config_cache: npmCacheDir };

console.log("Packing...");
const packOut = execFileSync("npm", ["pack", "--silent"], {
  cwd: repoRoot,
  env,
  encoding: "utf8",
}).trim();
const tgzName = packOut.split(/\r?\n/).filter(Boolean).at(-1);
if (!tgzName || !tgzName.endsWith(".tgz")) {
  throw new Error(`Unexpected npm pack output:\n${packOut}`);
}
const tgzPath = path.join(repoRoot, tgzName);

const tmpDir = path.join(tmpRoot, "verify-pack");
fs.rmSync(tmpDir, { recursive: true, force: true });
fs.mkdirSync(tmpDir, { recursive: true });

console.log("Installing tarball into temp consumer...");
fs.writeFileSync(
  path.join(tmpDir, "package.json"),
  JSON.stringify({ name: "consumer", private: true, type: "module" }, null, 2),
);

runIn(tmpDir, `npm i --silent --no-audit --no-fund "${tgzPath}"`, { env });

console.log("Verifying ESM import...");
runIn(
  tmpDir,
  `node -e "import('wjs-client').then(m=>{console.log('esm keys', Object.keys(m));}).catch(e=>{console.error(e);process.exit(1);})"`,
);

console.log("Verifying CJS require...");
runIn(tmpDir, `node -e "const m=require('wjs-client'); console.log('cjs keys', Object.keys(m));"`);

console.log("OK");

// Cleanup pack artifact so it doesn't clutter the repo
fs.rmSync(tgzPath, { force: true });

