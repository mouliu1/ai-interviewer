import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HomeProcessCanvas } from "@/components/home-process-canvas";

afterEach(() => {
  cleanup();
});

describe("HomeProcessCanvas", () => {
  it("renders the four process stages from the homepage spec", () => {
    render(<HomeProcessCanvas />);

    expect(screen.getByText("Resume Parse")).toBeInTheDocument();
    expect(screen.getByText("Job Fit Mapping")).toBeInTheDocument();
    expect(screen.getByText("Dynamic Follow-up")).toBeInTheDocument();
    expect(screen.getByText("Structured Review")).toBeInTheDocument();
  });
});
