import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const versionArg = args.find(function (arg) {
  return arg !== "--dry-run";
});

if (!versionArg) {
  console.error("Usage: node scripts/release-prepare.mjs <version> [--dry-run]");
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(versionArg)) {
  console.error("Invalid version:", versionArg);
  process.exit(1);
}

const rootDir = process.cwd();
const packageJsonPath = path.join(rootDir, "package.json");
const packageLockPath = path.join(rootDir, "package-lock.json");
const readmePath = path.join(rootDir, "README.md");
const changelogPath = path.join(rootDir, "CHANGELOG.md");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function writeText(filePath, content) {
  if (!dryRun) {
    fs.writeFileSync(filePath, content);
  }
}

function replaceAll(text, from, to) {
  return text.split(from).join(to);
}

const manifest = readJson(packageJsonPath);
const packageLock = readJson(packageLockPath);
const readmeText = readText(readmePath);
const changelogText = readText(changelogPath);

const oldVersion = manifest.version;
const oldReleaseNotesPath = "docs/release-notes-v" + oldVersion + ".md";
const newReleaseNotesPath = "docs/release-notes-v" + versionArg + ".md";
const newReleaseNotesFile = path.join(rootDir, newReleaseNotesPath);

if (oldVersion === versionArg) {
  console.log("Version already set to", versionArg);
  process.exit(0);
}

manifest.version = versionArg;
manifest.files = manifest.files.map(function (entry) {
  return entry === oldReleaseNotesPath ? newReleaseNotesPath : entry;
});

packageLock.version = versionArg;
if (packageLock.packages && packageLock.packages[""]) {
  packageLock.packages[""].version = versionArg;
}

const nextReadmeText = replaceAll(readmeText, oldReleaseNotesPath, newReleaseNotesPath);

let nextChangelogText = changelogText;
const newHeading = "## v" + versionArg;
if (!changelogText.includes(newHeading)) {
  nextChangelogText =
    "# Changelog\n\n" +
    newHeading +
    "\n\n" +
    "- 补充本版本的变更摘要\n\n" +
    changelogText.replace(/^# Changelog\s*\n*/u, "");
}

let createdReleaseNotes = false;
if (!fs.existsSync(newReleaseNotesFile)) {
  createdReleaseNotes = true;
  const releaseNotesText = [
    "# date-plugin v" + versionArg + " 发布说明",
    "",
    "## 发布定位",
    "",
    "概述这一版本的发布目标、所处阶段，以及它相对上一版本最重要的推进点。",
    "",
    "## 本版本包含",
    "",
    "- 补充本版本的核心能力或工程化变更",
    "- 补充本版本的验证或发布链路变化",
    "",
    "## 已知限制",
    "",
    "- 补充当前版本仍然存在的限制",
    "",
    "## 下一步建议",
    "",
    "- 补充下一轮迭代重点"
  ].join("\n");
  writeText(newReleaseNotesFile, releaseNotesText + "\n");
}

writeText(packageJsonPath, JSON.stringify(manifest, null, 2) + "\n");
writeText(packageLockPath, JSON.stringify(packageLock, null, 2) + "\n");
writeText(readmePath, nextReadmeText);
writeText(changelogPath, nextChangelogText);

console.log(dryRun ? "Dry run complete." : "Release preparation complete.");
console.log("Version:", oldVersion, "->", versionArg);
console.log("Updated:", "package.json", "package-lock.json", "README.md", "CHANGELOG.md");
if (createdReleaseNotes) {
  console.log((dryRun ? "Would create:" : "Created:"), newReleaseNotesPath);
} else {
  console.log("Release notes already present:", newReleaseNotesPath);
}
