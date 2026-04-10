import { formatDimensionLabel } from "@/lib/copy";
import type { InterviewSnapshot } from "@/lib/types";

const CN_NUMBERS = ["零", "一", "二", "三", "四", "五", "六"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function buildPendingInterviewSnapshot(prepareId: string, plannedRoundCount: number): InterviewSnapshot {
  return {
    prepareId,
    currentQuestion: "",
    plannedRoundCount,
    currentRound: 1,
    remainingRounds: Math.max(plannedRoundCount - 1, 0),
    sessionStatus: "starting",
    focusDimensions: [],
  };
}

export function buildQuestionPlanSummary(payload: unknown): string {
  if (!isRecord(payload)) {
    return "系统正在结合简历与目标岗位整理本轮切入点。";
  }

  const focusDimensions = Array.isArray(payload.focus_dimensions)
    ? payload.focus_dimensions.map((item) => String(item)).filter(Boolean)
    : [];

  if (focusDimensions.length > 0) {
    return `本轮会先围绕${focusDimensions.map((item) => formatDimensionLabel(item)).join("、")}展开，再进入更具体的项目追问。`;
  }

  const openingQuestions = Array.isArray(payload.opening_questions)
    ? payload.opening_questions.map((item) => String(item)).filter(Boolean)
    : [];

  if (openingQuestions[0]) {
    return `系统已整理好本轮切入点，接下来会从“${openingQuestions[0]}”展开。`;
  }

  return "系统正在结合简历与目标岗位整理本轮切入点。";
}

export function buildRoundTitle(roundNumber: number): string {
  return `第${CN_NUMBERS[roundNumber] ?? roundNumber}轮`;
}

export function getDimensionEntries(dimensionScores: Record<string, number>): Array<[string, number]> {
  return Object.entries(dimensionScores);
}
