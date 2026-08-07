import { describe, expect, it } from "vitest";
import { beginResultGeneration, completeResultGeneration, failResultGeneration } from "./result-lifecycle";

describe("result lifecycle", () => {
  it("clears the saved status before a new result can inherit it", () => {
    const resultA = { id: "A" };
    const resultB = { id: "B" };
    const savedA = { ...completeResultGeneration(resultA), archiveStatus: "已保存到本地案例库。" };

    const startedB = beginResultGeneration(savedA);
    const completedB = completeResultGeneration(resultB);

    expect(startedB.archiveStatus).toBeNull();
    expect(completedB).toEqual({ result: resultB, archiveStatus: null });
  });

  it("clears both result and saved status on failure", () => {
    expect(failResultGeneration()).toEqual({ result: null, archiveStatus: null });
  });
});
