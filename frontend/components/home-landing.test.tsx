import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomeLanding } from "@/components/home-landing";

describe("HomeLanding", () => {
  it("sends homepage visitors to /prepare instead of showing the prepare workspace", () => {
    render(<HomeLanding />);

    expect(screen.getByRole("link", { name: "开始一次岗位定制面试" })).toHaveAttribute("href", "/prepare");
    expect(screen.queryByText("准备本场面试")).not.toBeInTheDocument();
  });
});
