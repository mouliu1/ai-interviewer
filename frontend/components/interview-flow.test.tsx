import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();
const mockSearchParamGet = vi.fn<(key: string) => string | null>();
const mockLoadAppSnapshot = vi.fn();
const mockUpdateAppSnapshot = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockSearchParamGet,
  }),
}));

vi.mock("@/lib/session-store", () => ({
  loadAppSnapshot: () => mockLoadAppSnapshot(),
  updateAppSnapshot: (...args: unknown[]) => mockUpdateAppSnapshot(...args),
}));

vi.mock("@/lib/frontend-api", () => ({
  streamAnswerInterview: vi.fn(),
  streamFinishInterview: vi.fn(),
  streamStartInterview: vi.fn(),
}));

import { InterviewFlow } from "@/components/interview-flow";

describe("InterviewFlow", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockSearchParamGet.mockReset();
    mockLoadAppSnapshot.mockReset();
    mockUpdateAppSnapshot.mockReset();
    mockSearchParamGet.mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
  });

  it("routes the empty state back to the prepare page", () => {
    mockLoadAppSnapshot.mockReturnValue(null);

    render(<InterviewFlow />);

    expect(screen.getByText("请先前往准备页上传简历并填写目标岗位，再开始一场新的面试。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "前往准备页" }));

    expect(mockPush).toHaveBeenCalledWith("/prepare");
  });

  it("routes restart from the ready-to-finish state to the prepare page", () => {
    mockLoadAppSnapshot.mockReturnValue({
      interview: {
        sessionId: "session-1",
        prepareId: "prepare-1",
        currentQuestion: "请介绍你最近做过的项目。",
        plannedRoundCount: 3,
        currentRound: 3,
        remainingRounds: 0,
        sessionStatus: "ready_to_finish",
        focusDimensions: ["technical_accuracy", "clarity"],
      },
    });

    render(<InterviewFlow />);

    fireEvent.click(screen.getByRole("button", { name: "开始新的面试" }));

    expect(mockPush).toHaveBeenCalledWith("/prepare");
  });
});
