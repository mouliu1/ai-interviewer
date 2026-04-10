import { afterEach, describe, expect, it } from "vitest";

import {
  clearAppSnapshot,
  loadAppSnapshot,
  saveAppSnapshot,
  type AppSnapshot,
} from "@/lib/session-store";

describe("session-store", () => {
  afterEach(() => {
    clearAppSnapshot();
  });

  it("round-trips the active frontend snapshot", () => {
    const snapshot: AppSnapshot = {
      prepare: {
        prepare_id: "prepare-1",
        resume_summary_preview: "Built a RAG assistant.",
        jd_summary_preview: "RAG, evaluation",
        candidate_profile: {
          skills: ["Python", "FastAPI"],
        },
        jd_profile: {
          target_role: "AI Engineer",
        },
        fit_focus_preview: ["RAG", "evaluation"],
      },
      interview: {
        sessionId: "session-1",
        currentQuestion: "Walk me through your retrieval pipeline.",
        plannedRoundCount: 3,
        currentRound: 1,
        remainingRounds: 2,
        sessionStatus: "in_progress",
      },
      report: {
        sessionId: "session-1",
        reportId: "session-1",
        overallScore: 78,
      },
    };

    saveAppSnapshot(snapshot);

    expect(loadAppSnapshot()).toEqual(snapshot);
  });

  it("drops malformed local storage payloads instead of throwing", () => {
    window.localStorage.setItem("ai-interviewer.frontend.snapshot", "{bad json");

    expect(loadAppSnapshot()).toBeNull();
    expect(window.localStorage.getItem("ai-interviewer.frontend.snapshot")).toBeNull();
  });
});
