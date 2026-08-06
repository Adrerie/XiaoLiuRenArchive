import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const androidDirectory = path.join(repositoryRoot, "android");
const apkPath = path.join(androidDirectory, "app", "build", "outputs", "apk", "debug", "app-debug.apk");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env,
    encoding: "utf8",
    stdio: options.inherit ? "inherit" : ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    throw new Error(`${command} failed to start: ${result.error.message}`);
  }

  if (result.status !== 0) {
    const details = options.inherit
      ? ""
      : ` ${String(result.stderr ?? "").trim()}`;
    throw new Error(`${command} exited with status ${result.status}.${details}`.trim());
  }

  return String(result.stdout ?? "");
}

function findAdb() {
  const defaultSdkRoot = process.platform === "win32"
    ? process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, "Android", "Sdk")
      : null
    : path.join(os.homedir(), "Android", "Sdk");
  const sdkRoots = [process.env.ANDROID_SDK_ROOT, process.env.ANDROID_HOME, defaultSdkRoot]
    .filter(Boolean)
    .filter((root, index, roots) => roots.indexOf(root) === index);
  const adbName = process.platform === "win32" ? "adb.exe" : "adb";

  for (const sdkRoot of sdkRoots) {
    const candidate = path.join(sdkRoot, "platform-tools", adbName);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  const fallback = process.platform === "win32" ? "adb.exe" : "adb";
  try {
    run(fallback, ["version"]);
    return fallback;
  } catch {
    throw new Error("找不到 Android SDK platform-tools/adb，请先安装 Android SDK 或设置 ANDROID_SDK_ROOT");
  }
}

function parseDevices(output) {
  return output
    .split(/\r?\n/)
    .map((line) => line.match(/^(\S+)\s+(device|unauthorized|offline)\b/))
    .filter(Boolean)
    .map((match) => ({ serial: match[1], state: match[2] }));
}

function selectDevice(adbPath) {
  const devices = parseDevices(run(adbPath, ["devices", "-l"]));
  const requestedSerial = (process.env.ANDROID_SERIAL ?? "").trim();

  if (requestedSerial) {
    const requested = devices.find((device) => device.serial === requestedSerial);
    if (!requested) {
      throw new Error(`ANDROID_SERIAL=${requestedSerial} 未出现在 adb devices 中`);
    }
    if (requested.state !== "device") {
      throw new Error(`设备 ${requestedSerial} 当前状态为 ${requested.state}，请解锁平板并允许 USB 调试`);
    }
    return requestedSerial;
  }

  const authorized = devices.filter((device) => device.state === "device");
  if (authorized.length === 1) {
    return authorized[0].serial;
  }
  if (authorized.length > 1) {
    throw new Error(`检测到多个 Android 设备，请设置 ANDROID_SERIAL：${authorized.map((device) => device.serial).join(", ")}`);
  }

  const unauthorized = devices.find((device) => device.state === "unauthorized");
  if (unauthorized) {
    throw new Error(`设备 ${unauthorized.serial} 未授权，请解锁平板并在 USB 调试提示中点“允许”`);
  }

  throw new Error("没有检测到已授权的 USB Android 设备");
}

try {
  if (!fs.existsSync(apkPath)) {
    throw new Error(`找不到 Debug APK：${apkPath}，请先运行 npm run mobile:build:debug`);
  }

  const adbPath = findAdb();
  const serial = selectDevice(adbPath);
  console.log(`Using physical Android device ${serial}`);

  run(adbPath, ["-s", serial, "install", "-r", apkPath], { inherit: true });

  const environment = { ...process.env, ANDROID_SERIAL: serial };
  if (path.isAbsolute(adbPath)) {
    const sdkRoot = path.dirname(path.dirname(adbPath));
    environment.ANDROID_SDK_ROOT = sdkRoot;
    environment.ANDROID_HOME = sdkRoot;
  }

  const gradleCommand = process.platform === "win32"
    ? process.env.ComSpec ?? "cmd.exe"
    : path.join(androidDirectory, "gradlew");
  const gradleArguments = process.platform === "win32"
    ? ["/d", "/s", "/c", "gradlew.bat :app:connectedDebugAndroidTest --no-daemon --console=plain"]
    : [":app:connectedDebugAndroidTest", "--no-daemon", "--console=plain"];
  run(gradleCommand, gradleArguments, {
    cwd: androidDirectory,
    env: environment,
    inherit: true,
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
