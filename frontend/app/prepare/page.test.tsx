import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/prepare-flow", () => ({
  PrepareFlow: () => <div data-testid="prepare-flow">prepare workspace</div>,
}));

import PreparePage from "@/app/prepare/page";

describe("PreparePage", () => {
  it("mounts the existing prepare workspace on /prepare", () => {
    render(<PreparePage />);

    expect(screen.getByTestId("prepare-flow")).toHaveTextContent("prepare workspace");
  });
});
