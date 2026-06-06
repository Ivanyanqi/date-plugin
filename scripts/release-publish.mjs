import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const versionFlagIndex = args.indexOf("--version");
const targetFlagIndex = args.indexOf("--target");
const execute = args.includes("--execute");

const rootDir = process.cwd();
const manifest = JSON.parse(
  fs.readFileSync(path.join(rootDir, "package.json"), "utf8")
);

const version =
  versionFlagIndex >= 0 && args[versionFlagIndex + 1]
    ? args[versionFlagIndex + 1]
    : manifest.version;

const tag = "v" + version;
const target =
  targetFlagIndex >= 0 && args[targetFlagIndex + 1]
    ? args[targetFlagIndex + 1]
    : null;

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: rootDir,
    encoding: "utf8"
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "").trim() || command + " failed");
  }

  return (result.stdout || "").trim();
}

function runOptional(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: rootDir,
    encoding: "utf8"
  });

  if (result.error) {
    return {
      ok: false,
      stdout: "",
      stderr: result.error.message
    };
  }

  return {
    ok: result.status === 0,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim()
  };
}

const currentBranch = run("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
const statusOutput = run("git", ["status", "--short"]);
const tagExists = run("git", ["tag", "--list", tag]) === tag;
const originRemote = runOptional("git", ["remote", "get-url", "origin"]);
const upstreamStatus = runOptional("git", ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]);
const ghAuthStatus = runOptional("gh", ["auth", "status"]);
const notesPath = path.join(rootDir, "docs", "release-notes-v" + version + ".md");

if (!fs.existsSync(notesPath)) {
  console.error("Release notes not found for version:", version);
  process.exit(1);
}

const resolvedTarget = target || currentBranch;
const planLines = [
  "Release publish plan:",
  "1. npm run release:preflight",
  "2. npm run release:notes",
  "3. npm run test:ci",
  "4. git tag " + tag,
  "5. git push origin " + currentBranch,
  "6. git push origin " + tag,
  "7. npm run release:github -- --execute --target " + resolvedTarget
];

console.log("Version:", version);
console.log("Tag:", tag);
console.log("Branch:", currentBranch);
console.log("Origin:", originRemote.ok ? originRemote.stdout : "missing");
console.log("Upstream:", upstreamStatus.ok ? upstreamStatus.stdout : "not configured");
console.log("Target:", resolvedTarget);
console.log("Release notes:", notesPath);
console.log("GitHub auth:", ghAuthStatus.ok ? "logged in" : "not logged in");
console.log("Working tree clean:", statusOutput === "" ? "yes" : "no");
console.log("Tag already exists:", tagExists ? "yes" : "no");
console.log("");
console.log(planLines.join("\n"));

if (!execute) {
  if (statusOutput !== "") {
    console.log("");
    console.log("Uncommitted changes detected:");
    console.log(statusOutput);
  }
  if (!ghAuthStatus.ok) {
    console.log("");
    console.log("GitHub CLI auth issue:");
    console.log(ghAuthStatus.stderr || "gh auth status failed");
  }
  console.log("");
  console.log("Dry run only. Use --execute to run the publish sequence.");
  process.exit(0);
}

if (!originRemote.ok) {
  console.error("Refusing to publish because origin remote is missing.");
  process.exit(1);
}

if (statusOutput !== "") {
  console.error("Refusing to publish with uncommitted changes.");
  process.exit(1);
}

if (tagExists) {
  console.error("Refusing to publish because tag already exists:", tag);
  process.exit(1);
}

if (!ghAuthStatus.ok) {
  console.error("Refusing to publish because GitHub CLI is not authenticated.");
  process.exit(1);
}

const commands = [
  ["npm", ["run", "release:preflight"]],
  ["npm", ["run", "release:notes"]],
  ["npm", ["run", "test:ci"]],
  ["git", ["tag", tag]],
  ["git", ["push", "origin", currentBranch]],
  ["git", ["push", "origin", tag]],
  ["npm", ["run", "release:github", "--", "--execute", "--target", resolvedTarget]]
];

for (const [command, commandArgs] of commands) {
  console.log("");
  console.log("$", command, commandArgs.join(" "));
  const result = spawnSync(command, commandArgs, {
    cwd: rootDir,
    stdio: "inherit"
  });

  if (result.error) {
    console.error("Failed to execute", command + ":", result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
