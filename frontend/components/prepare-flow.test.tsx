import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

import { PrepareFlow } from "@/components/prepare-flow";

describe("PrepareFlow", () => {
  it("renders a focused prepare workspace instead of the old homepage hero", () => {
    render(<PrepareFlow />);

    expect(screen.getByRole("heading", { name: "准备本场面试" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "生成准备结果" })).toBeInTheDocument();
    expect(
      screen.queryByText("从真实简历出发，围绕目标岗位生成问题、追问与复盘。"),
    ).not.toBeInTheDocument();
  });
});
