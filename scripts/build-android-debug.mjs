import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const androidDirectory = path.join(repositoryRoot, "android");
const command = process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : "./gradlew";
const argumentsForPlatform = process.platform === "win32"
  ? ["/d", "/s", "/c", "gradlew.bat assembleDebug"]
  : ["assembleDebug"];
const defaultSdkRoot = process.platform === "win32"
  ? process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, "Android", "Sdk")
    : null
  : path.join(os.homedir(), "Android", "Sdk");
const sdkRoots = [process.env.ANDROID_SDK_ROOT, process.env.ANDROID_HOME, defaultSdkRoot]
  .filter(Boolean)
  .filter((root, index, roots) => roots.indexOf(root) === index);
const sdkRoot = sdkRoots.find((root) => fs.existsSync(path.join(root, "platform-tools")));
const environment = { ...process.env };

if (sdkRoot) {
  environment.ANDROID_SDK_ROOT = sdkRoot;
  environment.ANDROID_HOME = sdkRoot;
}

const result = spawnSync(command, argumentsForPlatform, {
  cwd: androidDirectory,
  env: environment,
  stdio: "inherit",
});

if (result.error) {
  console.error(`Android debug build failed to start: ${result.error.message}`);
  process.exitCode = 1;
} else if (typeof result.status === "number") {
  process.exitCode = result.status;
} else {
  console.error("Android debug build terminated without an exit status.");
  process.exitCode = 1;
}
