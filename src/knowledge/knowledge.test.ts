import { describe, expect, it } from "vitest";
import {
  getContextSourceIds,
  getEthicsRulesVersion,
  getKnowledgeManifest,
  getPalace,
  getSources,
  listPalaces,
  searchPalaces,
} from "./index";

describe("local knowledge selectors", () => {
  it("keeps the six-palace order and exposes the Xiao Ji element variant", () => {
    expect(listPalaces().map((palace) => palace.id)).toEqual([
      "da_an",
      "liu_lian",
      "su_xi",
      "chi_kou",
      "xiao_ji",
      "kong_wang",
    ]);
    const xiaoJi = getPalace("xiao_ji");
    expect(xiaoJi.element).toBe("木");
    expect(xiaoJi.elementVariants.map((variant) => variant.value)).toContain("水");
    expect(xiaoJi.disputedFieldIds).toContain("palace.xiao_ji.classical.element");
  });

  it("searches local modern and classical knowledge without a remote service", () => {
    expect(searchPalaces("小吉").map((palace) => palace.id)).toEqual(["xiao_ji"]);
    expect(searchPalaces("阴人").map((palace) => palace.id)).toContain("xiao_ji");
    expect(searchPalaces("").length).toBe(6);
  });

  it("returns manifest versions and context source coverage", () => {
    const manifest = getKnowledgeManifest();
    expect(manifest.bundleVersion).toBe("2.0.0");
    expect(manifest.questionDomainsVersion).toBe("1.0.0-provisional.2");
    expect(getEthicsRulesVersion()).toBe("1.0.0-provisional.3");
    const sourceIds = getContextSourceIds({ finalPalaceId: "xiao_ji", domainId: "relationship", stageId: "seeking" });
    expect(sourceIds.length).toBeGreaterThan(0);
    expect(getSources(sourceIds).every((source) => source.supports.length > 0)).toBe(true);
  });
});
