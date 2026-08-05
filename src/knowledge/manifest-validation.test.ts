import { describe, expect, it } from "vitest";
import { loadKnowledgeBundle, validateKnowledgeManifest } from "../../scripts/validate-knowledge-manifest.mjs";

describe("knowledge manifest validation", () => {
  it("accepts the checked-in knowledge bundle", () => {
    expect(validateKnowledgeManifest(loadKnowledgeBundle()).valid).toBe(true);
  });

  it("fails closed and names the mismatched version field", () => {
    const bundle = loadKnowledgeBundle();
    const simulated = {
      ...bundle,
      manifest: { ...bundle.manifest, questionDomainsVersion: "simulated-mismatch" },
    };

    expect(() => validateKnowledgeManifest(simulated)).toThrow(
      /KNOWLEDGE_INTEGRITY_ERROR[\s\S]*questionDomainsVersion[\s\S]*simulated-mismatch[\s\S]*question-domains|questionDomainsVersion[\s\S]*domains\.knowledgeVersion/,
    );
  });
});
