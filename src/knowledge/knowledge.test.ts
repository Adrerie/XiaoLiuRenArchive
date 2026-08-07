import { describe, expect, it } from "vitest";
import {
  getContextSourceIds,
  getEthicsRulesVersion,
  getKnowledgeManifest,
  getPalace,
  getSources,
  isProvisionalSource,
  listDomains,
  listStageOptions,
  listPalaces,
  searchPalaces,
} from "./index";

function sourceById(sourceIds: readonly ReturnType<typeof getSources>[number][], id: string): ReturnType<typeof getSources>[number] {
  const source = sourceIds.find((candidate) => candidate.id === id);
  if (!source) throw new Error(`Missing source in test fixture: ${id}`);
  return source;
}

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
    expect(manifest.bundleVersion).toBe("2.2.0");
    expect(manifest.palacesVersion).toBe("1.0.0-provisional.2");
    expect(manifest.questionDomainsVersion).toBe("1.0.0-provisional.4");
    expect(manifest.interpretationFragmentsVersion).toBe("1.0.0-provisional.2");
    expect(manifest.sourceRegistryVersion).toBe("1.0.0-provisional.1");
    expect(getEthicsRulesVersion()).toBe("1.0.0-provisional.3");
    const sourceIds = getContextSourceIds({ finalPalaceId: "xiao_ji", domainId: "relationship", stageId: "seeking" });
    expect(sourceIds.length).toBeGreaterThan(0);
    expect(sourceIds).toContain("xiaoliurenarchive-editorial-modern-knowledge-v1");
    expect(sourceIds).toContain("yuxiaji-liuren-shike-web-transcription-8s8s");
    expect(getPalace("xiao_ji").modernSourceIds).toEqual(["xiaoliurenarchive-editorial-modern-knowledge-v1"]);
    expect(getSources(sourceIds).every((source) => source.supports.length > 0)).toBe(true);
    const sources = getSources([
      "moe-revised-dictionary-xiaoliuren",
      "yuxiaji-liuren-shike-web-transcription-8s8s",
      "xiaoliurenarchive-editorial-modern-knowledge-v1",
    ]);
    expect(isProvisionalSource(sourceById(sources, "yuxiaji-liuren-shike-web-transcription-8s8s"))).toBe(true);
    expect(isProvisionalSource(sourceById(sources, "moe-revised-dictionary-xiaoliuren"))).toBe(false);
    expect(isProvisionalSource(sourceById(sources, "xiaoliurenarchive-editorial-modern-knowledge-v1"))).toBe(false);
  });

  it("exposes Chinese stage labels with fail-closed domain coverage", () => {
    const relationshipStages = listStageOptions("relationship");
    expect(relationshipStages).toEqual([
      { id: "seeking", label: "寻找关系" },
      { id: "new_acquaintance", label: "初识" },
      { id: "ambiguous", label: "暧昧或关系未明" },
      { id: "dating", label: "约会与交往" },
      { id: "committed", label: "稳定承诺关系" },
      { id: "separated", label: "已经分开" },
      { id: "reconciliation", label: "考虑复合" },
    ]);
    expect(listDomains().every((domain) => domain.stages.length === domain.stageOptions.length)).toBe(true);
    expect(listStageOptions("study_exam")).toEqual([]);
  });
});
