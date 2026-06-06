import fs from "node:fs";
import os from "node:os";
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

const target =
  targetFlagIndex >= 0 && args[targetFlagIndex + 1]
    ? args[targetFlagIndex + 1]
    : null;

const notesPath = path.join(rootDir, "docs", "release-notes-v" + version + ".md");
if (!fs.existsSync(notesPath)) {
  console.error("Release notes not found for version:", version);
  process.exit(1);
}

const tag = "v" + version;
const title = "date-plugin v" + version;
const isPrerelease = version.includes("-");

const commandArgs = ["release", "create", tag, "--title", title, "--notes-file", notesPath];
if (isPrerelease) {
  commandArgs.push("--prerelease");
}
if (target) {
  commandArgs.push("--target", target);
}

if (!execute) {
  console.log("Dry run only. GitHub Release command preview:");
  console.log("gh " + commandArgs.map(function (arg) {
    return /\s/.test(arg) ? JSON.stringify(arg) : arg;
  }).join(" "));
  console.log("Tag:", tag);
  console.log("Title:", title);
  console.log("Notes:", notesPath);
  console.log("Prerelease:", isPrerelease ? "yes" : "no");
  if (target) {
    console.log("Target:", target);
  }
  console.log("Use --execute to create the release.");
  process.exit(0);
}

const notesBody = fs.readFileSync(notesPath, "utf8");
const tempNotesPath = path.join(os.tmpdir(), "date-plugin-" + version + "-release-notes.md");
fs.writeFileSync(tempNotesPath, notesBody);

const executeArgs = [
  "release",
  "create",
  tag,
  "--title",
  title,
  "--notes-file",
  tempNotesPath
];

if (isPrerelease) {
  executeArgs.push("--prerelease");
}
if (target) {
  executeArgs.push("--target", target);
}

const result = spawnSync("gh", executeArgs, {
  cwd: rootDir,
  stdio: "inherit"
});

if (result.error) {
  console.error("Failed to execute gh:", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
