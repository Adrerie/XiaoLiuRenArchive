import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPOSITORY_ROOT = path.resolve(SCRIPT_DIRECTORY, "..");

const VERSION_FIELDS = Object.freeze({
  palacesVersion: "palaces",
  questionDomainsVersion: "domains",
  interpretationFragmentsVersion: "fragments",
  sourceRegistryVersion: "sources",
  ethicsRulesVersion: "ethicsRules",
  safetyMessagesVersion: "safetyMessages",
});

const REQUIRED_MANIFEST_FIELDS = Object.freeze([
  "bundleVersion",
  "status",
  "updatedAt",
  ...Object.keys(VERSION_FIELDS),
]);

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readJson(repositoryRoot, relativePath) {
  const absolutePath = path.join(repositoryRoot, relativePath);
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

export function loadKnowledgeBundle(repositoryRoot = DEFAULT_REPOSITORY_ROOT) {
  return {
    manifest: readJson(repositoryRoot, "knowledge/knowledge-manifest.v1.json"),
    palaces: readJson(repositoryRoot, "knowledge/palaces.v1.json"),
    domains: readJson(repositoryRoot, "knowledge/question-domains.v1.json"),
    fragments: readJson(repositoryRoot, "knowledge/interpretation-fragments.v1.json"),
    sources: readJson(repositoryRoot, "knowledge/source-registry.json"),
    ethicsRules: readJson(repositoryRoot, "knowledge/ethics-rules.v1.json"),
    safetyMessages: readJson(repositoryRoot, "knowledge/safety-messages.v1.json"),
  };
}

export function validateKnowledgeManifest(bundle) {
  const manifest = bundle?.manifest;
  if (!isRecord(manifest)) {
    throw new Error("KNOWLEDGE_INTEGRITY_ERROR: manifest must be an object");
  }

  const errors = [];
  for (const field of REQUIRED_MANIFEST_FIELDS) {
    if (typeof manifest[field] !== "string" || manifest[field].length === 0) {
      errors.push(`${field}: manifest value must be a non-empty string`);
    }
  }

  for (const [manifestField, sourceKey] of Object.entries(VERSION_FIELDS)) {
    const source = bundle?.[sourceKey];
    const sourceVersion = isRecord(source) ? source.knowledgeVersion : undefined;
    if (typeof sourceVersion !== "string" || sourceVersion.length === 0) {
      errors.push(`${manifestField}: ${sourceKey}.knowledgeVersion must be a non-empty string`);
      continue;
    }
    if (manifest[manifestField] !== sourceVersion) {
      errors.push(`${manifestField}: manifest="${String(manifest[manifestField])}" ${sourceKey}.knowledgeVersion="${sourceVersion}"`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`KNOWLEDGE_INTEGRITY_ERROR\n${errors.join("\n")}`);
  }
  return { valid: true, bundleVersion: manifest.bundleVersion };
}

function main() {
  const result = validateKnowledgeManifest(loadKnowledgeBundle());
  console.log(`Knowledge manifest validated: bundleVersion=${result.bundleVersion}`);
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (entryPath === fileURLToPath(import.meta.url)) main();
