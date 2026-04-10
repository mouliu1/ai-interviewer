import { describe, expect, it } from "vitest";

import {
  buildPendingInterviewSnapshot,
  buildQuestionPlanSummary,
  buildRoundTitle,
  getDimensionEntries,
} from "@/lib/interview-presenter";

describe("interview-presenter", () => {
  it("builds a pending interview snapshot before the interview page starts streaming", () => {
    expect(buildPendingInterviewSnapshot("prepare-1", 3)).toEqual({
      prepareId: "prepare-1",
      currentQuestion: "",
      plannedRoundCount: 3,
      currentRound: 1,
      remainingRounds: 2,
      sessionStatus: "starting",
      focusDimensions: [],
    });
  });

  it("creates a user-facing summary from the question-plan payload", () => {
    expect(
      buildQuestionPlanSummary({
        focus_dimensions: ["technical_accuracy", "evidence"],
        opening_questions: ["先介绍一下你在 RAG 项目里如何做召回和重排。"],
      }),
    ).toBe("本轮会先围绕技术准确性、证据展开，再进入更具体的项目追问。");
  });

  it("uses explicit round titles instead of a generic latest-round label", () => {
    expect(buildRoundTitle(1)).toBe("第一轮");
    expect(buildRoundTitle(2)).toBe("第二轮");
    expect(buildRoundTitle(4)).toBe("第四轮");
  });

  it("preserves the actual model scores instead of falling back to fixed values", () => {
    expect(
      getDimensionEntries({
        technical_accuracy: 5,
        relevance: 4,
        depth: 2,
        evidence: 1,
        clarity: 4,
      }),
    ).toEqual([
      ["technical_accuracy", 5],
      ["relevance", 4],
      ["depth", 2],
      ["evidence", 1],
      ["clarity", 4],
    ]);
  });
});
