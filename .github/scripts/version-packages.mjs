import { execFileSync } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const scriptsBlocked = execFileSync(npm, ["config", "get", "ignore-scripts"], { encoding: "utf8" }).trim();
console.log(`npm ignore-scripts=${scriptsBlocked}`);
if (scriptsBlocked !== "true") throw new Error("Dependency scripts must remain blocked before versioning");
execFileSync(npm, ["exec", "--no", "--ignore-scripts", "--", "changeset", "version"], { stdio: "inherit" });
execFileSync(npm, ["install", "--package-lock-only", "--ignore-scripts"], { stdio: "inherit" });
