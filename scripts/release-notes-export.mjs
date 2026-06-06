import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const versionFlagIndex = args.indexOf("--version");
const outputFlagIndex = args.indexOf("--output");

const rootDir = process.cwd();
const manifest = JSON.parse(
  fs.readFileSync(path.join(rootDir, "package.json"), "utf8")
);

const version =
  versionFlagIndex >= 0 && args[versionFlagIndex + 1]
    ? args[versionFlagIndex + 1]
    : manifest.version;

const notesPath = path.join(rootDir, "docs", "release-notes-v" + version + ".md");
if (!fs.existsSync(notesPath)) {
  console.error("Release notes not found for version:", version);
  process.exit(1);
}

const body = fs.readFileSync(notesPath, "utf8").trim();
const output = [
  "Tag: v" + version,
  "Title: date-plugin v" + version,
  "",
  body
].join("\n");

if (outputFlagIndex >= 0 && args[outputFlagIndex + 1]) {
  const outputFile = path.resolve(rootDir, args[outputFlagIndex + 1]);
  fs.writeFileSync(outputFile, output + "\n");
  console.log("Release notes exported to", outputFile);
  process.exit(0);
}

process.stdout.write(output + "\n");
