const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

const runtimeFiles = [
  "options.html",
  "popup.js",
  "scripts/extensionApi.js",
  "scripts/common.js",
  "scripts/content.js",
  "scripts/tableExpansion.js",
  "icons/icon16.png",
  "icons/icon32.png",
  "icons/icon48.png",
  "icons/icon128.png"
];

const firefoxGeckoSettings = {
  id: "finanzen-net-last-visit-diff@zeberti.github.io",
  strict_min_version: "128.0",
  data_collection_permissions: {
    required: ["none"]
  }
};

function resetDirectory(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyRuntimeFiles(targetDir) {
  runtimeFiles.forEach((relativePath) => {
    const sourcePath = path.join(rootDir, relativePath);
    const targetPath = path.join(targetDir, relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  });
}

function writeManifest(targetDir, manifest) {
  fs.writeFileSync(
    path.join(targetDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );
}

function zipPackage(targetDir, zipFileName) {
  execFileSync("zip", ["-rq", zipFileName, path.basename(targetDir)], {
    cwd: distDir,
    stdio: "inherit"
  });
}

function createChromeManifest(baseManifest) {
  return { ...baseManifest };
}

function createFirefoxManifest(baseManifest) {
  return {
    ...baseManifest,
    browser_specific_settings: {
      gecko: firefoxGeckoSettings
    }
  };
}

function buildReleasePackage(label, manifestFactory) {
  const packageDirName = `finanzen-net-last-visit-diff-${label}`;
  const packageDir = path.join(distDir, packageDirName);
  const zipFileName = `${packageDirName}.zip`;
  const zipFilePath = path.join(distDir, zipFileName);

  resetDirectory(packageDir);
  fs.rmSync(zipFilePath, { force: true });

  copyRuntimeFiles(packageDir);
  const baseManifest = JSON.parse(fs.readFileSync(path.join(rootDir, "manifest.json"), "utf8"));
  writeManifest(packageDir, manifestFactory(baseManifest));
  zipPackage(packageDir, zipFileName);

  return zipFilePath;
}

function main() {
  fs.mkdirSync(distDir, { recursive: true });

  const chromeZip = buildReleasePackage("chrome", createChromeManifest);
  const firefoxZip = buildReleasePackage("firefox", createFirefoxManifest);

  console.log("Created release packages:");
  console.log(`  ${chromeZip}`);
  console.log(`  ${firefoxZip}`);
}

main();
