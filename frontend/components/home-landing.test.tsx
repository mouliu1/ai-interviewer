import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HomeLanding } from "@/components/home-landing";

afterEach(() => {
  cleanup();
});

describe("HomeLanding", () => {
  it("sends homepage visitors to /prepare instead of showing the prepare workspace", () => {
    render(<HomeLanding />);

    expect(screen.getByRole("link", { name: "开始一次岗位定制面试" })).toHaveAttribute("href", "/prepare");
    expect(screen.queryByText("准备本场面试")).not.toBeInTheDocument();
  });

  it("renders the product-story sections selected in the spec", () => {
    render(<HomeLanding />);

    expect(screen.getByRole("heading", { name: "把一次岗位面试拆成可观察、可追问、可复盘的过程。" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "为什么它有效" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "工作流预览" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "准备好开始一场更像真实工作的面试了吗？" })).toBeInTheDocument();
  });
});
