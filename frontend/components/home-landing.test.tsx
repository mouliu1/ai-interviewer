import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HomeLanding } from "@/components/home-landing";
import { HOME_PINNED_STAGES, HOME_PREPARE_ENTRY } from "@/lib/copy";

afterEach(() => {
  cleanup();
});

describe("HomeLanding", () => {
  it("homepage CTA points to /prepare", () => {
    render(<HomeLanding />);

    expect(screen.getByRole("link", { name: HOME_PREPARE_ENTRY.cta })).toHaveAttribute("href", HOME_PREPARE_ENTRY.href);
  });

  it("renders the product-story sections selected in the spec", () => {
    render(<HomeLanding />);

    expect(screen.getByRole("heading", { name: "AI Interviewer" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: HOME_PINNED_STAGES[0].title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "为什么这套方式更接近真实面试" })).toBeInTheDocument();
  });
});
