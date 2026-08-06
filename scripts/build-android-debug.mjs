import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const androidDirectory = path.join(repositoryRoot, "android");
const command = process.platform === "win32" ? process.env.ComSpec ?? "cmd.exe" : "./gradlew";
const argumentsForPlatform = process.platform === "win32"
  ? ["/d", "/s", "/c", "gradlew.bat assembleDebug"]
  : ["assembleDebug"];

const result = spawnSync(command, argumentsForPlatform, {
  cwd: androidDirectory,
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
