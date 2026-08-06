import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, "..");
const SOURCE_ROOT = path.join(REPOSITORY_ROOT, "src");
const SOURCE_EXTENSIONS = new Set([".css", ".js", ".jsx", ".ts", ".tsx"]);

const FORBIDDEN_PATTERNS = [
  { label: "fetch()", pattern: /\bfetch\s*\(/ },
  { label: "XMLHttpRequest", pattern: /\bXMLHttpRequest\b/ },
  { label: "WebSocket", pattern: /\bWebSocket\b/ },
  { label: "EventSource", pattern: /\bEventSource\b/ },
  { label: "navigator.sendBeacon", pattern: /\bnavigator\.sendBeacon\b/ },
  { label: "remote script", pattern: /<script\b[^>]+src\s*=\s*["']https?:\/\//i },
  { label: "remote stylesheet", pattern: /<link\b[^>]+href\s*=\s*["']https?:\/\//i },
  { label: "analytics or telemetry SDK", pattern: /\b(?:analytics|telemetry|sentry|posthog)\b/i },
];

function collectRuntimeFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectRuntimeFiles(entryPath);
    return SOURCE_EXTENSIONS.has(path.extname(entry.name)) && !/\.test\.[^.]+$/.test(entry.name)
      ? [entryPath]
      : [];
  });
}

function isAllowedUserLink(line, patternLabel) {
  return patternLabel === "remote URL" && /<a\b[^>]*\bhref\s*=/i.test(line);
}

function auditFile(filePath) {
  const relativePath = path.relative(REPOSITORY_ROOT, filePath);
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const findings = [];
  lines.forEach((line, index) => {
    for (const rule of FORBIDDEN_PATTERNS) {
      if (rule.pattern.test(line)) {
        findings.push(`${relativePath}:${index + 1}: ${rule.label}`);
      }
    }
    if (/https?:\/\//i.test(line) && !isAllowedUserLink(line, "remote URL")) {
      findings.push(`${relativePath}:${index + 1}: remote URL outside user-clicked link`);
    }
  });
  return findings;
}

function main() {
  const files = [...collectRuntimeFiles(SOURCE_ROOT), path.join(REPOSITORY_ROOT, "index.html")];
  const findings = files.flatMap(auditFile);
  if (findings.length > 0) {
    console.error(["NETWORK_AUDIT_ERROR", ...findings].join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log(`Runtime network audit passed: scanned ${files.length} runtime files.`);
}

main();
