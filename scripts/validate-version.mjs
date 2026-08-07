import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packagePath = path.join(repositoryRoot, "package.json");
const packageLockPath = path.join(repositoryRoot, "package-lock.json");
const versionSourcePath = path.join(repositoryRoot, "src", "app", "app-version.ts");
const androidBuildPath = path.join(repositoryRoot, "android", "app", "build.gradle");

const expected = {
  packageName: "xiaoliurenarchive",
  version: "0.6.0-beta.1",
  versionCode: "601",
  buildChannel: "beta-debug",
};
const errors = [];

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function matchOrError(content, pattern, label) {
  const match = content.match(pattern);
  if (!match) errors.push(`${label} is missing or inconsistent`);
  return match?.[1] ?? null;
}

try {
  const packageJson = JSON.parse(read(packagePath));
  if (packageJson.name !== expected.packageName) errors.push(`package.json name must be ${expected.packageName}`);
  if (packageJson.version !== expected.version) errors.push(`package.json version must be ${expected.version}`);

  const packageLock = JSON.parse(read(packageLockPath));
  if (packageLock.name !== expected.packageName) errors.push(`package-lock.json name must be ${expected.packageName}`);
  if (packageLock.version !== expected.version) errors.push(`package-lock.json version must be ${expected.version}`);
  if (packageLock.packages?.[""]?.name !== expected.packageName) errors.push(`package-lock root name must be ${expected.packageName}`);
  if (packageLock.packages?.[""]?.version !== expected.version) errors.push(`package-lock root version must be ${expected.version}`);

  const versionSource = read(versionSourcePath);
  const displayedVersion = matchOrError(versionSource, /APP_VERSION\s*=\s*["']([^"']+)["']/, "APP_VERSION");
  const versionCode = matchOrError(versionSource, /ANDROID_VERSION_CODE\s*=\s*(\d+)/, "ANDROID_VERSION_CODE");
  const buildChannel = matchOrError(versionSource, /BUILD_CHANNEL\s*=\s*["']([^"']+)["']/, "BUILD_CHANNEL");
  if (displayedVersion !== expected.version) errors.push(`About version must be ${expected.version}`);
  if (versionCode !== expected.versionCode) errors.push(`Android version code must be ${expected.versionCode}`);
  if (buildChannel !== expected.buildChannel) errors.push(`build channel must be ${expected.buildChannel}`);

  const androidBuild = read(androidBuildPath);
  const androidVersion = matchOrError(androidBuild, /versionName\s+["']([^"']+)["']/, "android versionName");
  const androidCode = matchOrError(androidBuild, /versionCode\s+(\d+)/, "android versionCode");
  if (androidVersion !== expected.version) errors.push(`android/app/build.gradle versionName must be ${expected.version}`);
  if (androidCode !== expected.versionCode) errors.push(`android/app/build.gradle versionCode must be ${expected.versionCode}`);
} catch (error) {
  errors.push(error instanceof Error ? error.message : "version validation could not read its inputs");
}

if (errors.length > 0) {
  console.error(["VERSION_VALIDATION_ERROR", ...errors].join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Version validated: xiaoliurenarchive ${expected.version} (${expected.buildChannel}), Android versionCode=${expected.versionCode}`);
}
