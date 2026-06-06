import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const failures = [];

function logResult(passed, name, details) {
  const prefix = passed ? "PASS" : "FAIL";
  console.log(prefix, name, "-", details);
  if (!passed) {
    failures.push(name);
  }
}

function assert(name, condition, details) {
  logResult(Boolean(condition), name, details);
}

function readText(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

const manifest = JSON.parse(readText("package.json"));
const packageLock = JSON.parse(readText("package-lock.json"));
const currentVersion = manifest.version;
const releaseNotesPath = "docs/release-notes-v" + currentVersion + ".md";

assert(
  "package manifest should expose required release metadata",
  manifest.name === "date-plugin" &&
    typeof manifest.version === "string" &&
    manifest.version.length > 0 &&
    manifest.license === "MIT" &&
    manifest.type === "module" &&
    manifest.homepage === "https://github.com/Ivanyanqi/date-plugin" &&
    manifest.bugs &&
    manifest.bugs.url === "https://github.com/Ivanyanqi/date-plugin/issues",
  "expected name, version, license, type, homepage and bugs url"
);

assert(
  "package manifest should expose publish entrypoints",
  manifest.exports &&
    manifest.exports["."] === "./src/index.js" &&
    manifest.exports["./styles"] === "./date.style.css" &&
    manifest.exports["./legacy"] === "./date.plugin.ext.js" &&
    manifest.exports["./auto"] === "./date.plugin.js",
  "expected module, styles, legacy and auto exports"
);

assert(
  "package manifest should include release scripts",
  manifest.scripts &&
    manifest.scripts.serve === "python3 -m http.server 8765" &&
    typeof manifest.scripts["test:ci"] === "string" &&
    typeof manifest.scripts["release:publish"] === "string" &&
    typeof manifest.scripts["release:github"] === "string" &&
    typeof manifest.scripts["release:notes"] === "string" &&
    typeof manifest.scripts["release:preflight"] === "string" &&
    typeof manifest.scripts["release:prepare"] === "string",
  "expected serve, test:ci, release:prepare, release:notes, release:github, release:publish and release:preflight scripts"
);

assert(
  "package-lock should stay in sync with the current package version",
  packageLock.version === currentVersion &&
    packageLock.packages &&
    packageLock.packages[""] &&
    packageLock.packages[""].version === currentVersion,
  "expected package-lock root version to match " + currentVersion
);

assert(
  "package manifest should publish release docs",
  Array.isArray(manifest.files) &&
    manifest.files.includes("src") &&
    manifest.files.includes("LICENSE") &&
    manifest.files.includes("CHANGELOG.md") &&
    manifest.files.includes("docs/release-checklist.md") &&
    manifest.files.includes("docs/release-process.md") &&
    manifest.files.includes("docs/browser-compatibility.md") &&
    manifest.files.includes(releaseNotesPath),
  "expected source, license, changelog and current release docs in files allowlist"
);

[
  "LICENSE",
  "CHANGELOG.md",
  "README.md",
  "package-lock.json",
  ".gitignore",
  ".github/workflows/browser-regression.yml",
  "scripts/browser-regression-check.mjs",
  "scripts/release-github.mjs",
  "scripts/release-notes-export.mjs",
  "scripts/release-publish.mjs",
  "scripts/release-prepare.mjs",
  "docs/release-checklist.md",
  "docs/release-process.md",
  "docs/browser-compatibility.md",
  releaseNotesPath
].forEach(function (relativePath) {
  assert(
    relativePath + " should exist",
    exists(relativePath),
    "expected " + relativePath + " to be present"
  );
});

const changelogText = readText("CHANGELOG.md");
assert(
  "CHANGELOG should include the current package version",
  changelogText.includes("## v" + currentVersion),
  "expected changelog heading for v" + currentVersion
);

const gitignoreText = readText(".gitignore");
assert(
  ".gitignore should ignore node_modules",
  gitignoreText.includes("node_modules/"),
  "expected node_modules/ ignore rule"
);

const readmeText = readText("README.md");
assert(
  "README should document release and verification entrypoints",
  readmeText.includes("docs/release-process.md") &&
    readmeText.includes("CHANGELOG.md") &&
    readmeText.includes("npm run test:ci") &&
    readmeText.includes("npm run release:publish") &&
    readmeText.includes("npm run release:github") &&
    readmeText.includes("npm run release:notes") &&
    readmeText.includes("npm run release:preflight"),
  "expected release docs and verification commands in README"
);

const releaseProcessText = readText("docs/release-process.md");
assert(
  "release process should mention preflight and browser regression",
  releaseProcessText.includes("release:preflight") &&
    releaseProcessText.includes("browser-regression") &&
    releaseProcessText.includes("发布执行步骤"),
  "expected release process to mention preflight and CI flow"
);

const checklistText = readText("docs/release-checklist.md");
assert(
  "release checklist should mention preflight",
  checklistText.includes("release:preflight") &&
    checklistText.includes("浏览器回归"),
  "expected checklist to mention local preflight and browser regression"
);

const releaseNotesText = readText(releaseNotesPath);
assert(
  "release notes should match the current package version",
  releaseNotesText.includes("v" + currentVersion),
  "expected release notes title or body to mention v" + currentVersion
);

if (failures.length > 0) {
  console.error("Release preflight failed with", failures.length, "issue(s).");
  process.exitCode = 1;
} else {
  console.log("All release preflight checks passed.");
}
