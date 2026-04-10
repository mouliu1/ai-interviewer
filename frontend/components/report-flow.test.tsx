import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();
const mockSearchParamGet = vi.fn<(key: string) => string | null>();
const mockLoadAppSnapshot = vi.fn();
const mockUpdateAppSnapshot = vi.fn();
const mockGetReport = vi.fn();

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
  getReport: (...args: unknown[]) => mockGetReport(...args),
}));

import { ReportFlow } from "@/components/report-flow";

describe("ReportFlow", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockSearchParamGet.mockReset();
    mockLoadAppSnapshot.mockReset();
    mockUpdateAppSnapshot.mockReset();
    mockGetReport.mockReset();
    mockSearchParamGet.mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
  });

  it("routes the empty state to the prepare page", () => {
    mockLoadAppSnapshot.mockReturnValue(null);

    render(<ReportFlow />);

    fireEvent.click(screen.getByRole("button", { name: "前往准备页" }));

    expect(mockPush).toHaveBeenCalledWith("/prepare");
  });

  it("routes restart from the failed report state to the prepare page", async () => {
    mockLoadAppSnapshot.mockReturnValue(null);
    mockSearchParamGet.mockImplementation((key) => (key === "sessionId" ? "session-1" : null));
    mockGetReport.mockRejectedValue(new Error("Report not found."));

    render(<ReportFlow />);

    await screen.findByText("未找到复盘报告。");

    fireEvent.click(screen.getByRole("button", { name: "重新开始" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/prepare");
    });
  });
});
