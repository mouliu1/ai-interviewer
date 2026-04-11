import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HomePinnedCanvas } from "@/components/home-pinned-canvas";
import { HOME_PINNED_STAGES } from "@/lib/copy";

afterEach(() => {
  cleanup();
});

describe("HomePinnedCanvas", () => {
  it("renders the focus stage canvas", () => {
    render(<HomePinnedCanvas activeStage="focus" />);

    expect(screen.getByRole("region", { name: "AI Interviewer pinned canvas" })).toBeInTheDocument();
    expect(screen.getByText(HOME_PINNED_STAGES[1].canvasLabel, { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: HOME_PINNED_STAGES[1].canvasLabel })).toBeInTheDocument();

    const activeStageItem = screen.getByRole("heading", { name: HOME_PINNED_STAGES[1].canvasLabel }).closest("li");

    expect(activeStageItem).toHaveAttribute("aria-current", "step");
    expect(activeStageItem).toHaveTextContent(HOME_PINNED_STAGES[1].body);
    expect(screen.getByRole("heading", { name: HOME_PINNED_STAGES[0].canvasLabel })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: HOME_PINNED_STAGES[2].canvasLabel })).toBeInTheDocument();
  });
});
