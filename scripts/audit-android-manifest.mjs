import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(repositoryRoot, "android", "app", "src", "main", "AndroidManifest.xml");
const manifest = fs.readFileSync(manifestPath, "utf8");
const errors = [];

if (/<uses-permission[^>]+android\.permission\.INTERNET/.test(manifest)) {
  errors.push("android.permission.INTERNET must not be declared");
}
if (!/<application[\s\S]*android:allowBackup\s*=\s*["']false["']/.test(manifest)) {
  errors.push("application must set android:allowBackup=\"false\"");
}
if (!/<application[\s\S]*android:usesCleartextTraffic\s*=\s*["']false["']/.test(manifest)) {
  errors.push("application must set android:usesCleartextTraffic=\"false\"");
}
if (/android:usesCleartextTraffic\s*=\s*["']true["']/.test(manifest)) {
  errors.push("cleartext traffic is forbidden");
}
if (/networkSecurityConfig|server\.url/.test(manifest)) {
  errors.push("network security exceptions and server.url are forbidden");
}

if (errors.length > 0) {
  console.error(["ANDROID_MANIFEST_AUDIT_ERROR", ...errors].join("\n"));
  process.exitCode = 1;
} else {
  console.log("Android manifest audit passed: no app network permission, cleartext traffic, or backup path.");
}
