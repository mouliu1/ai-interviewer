import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getNarrativeProgress, HomeLanding, resolveActiveStage } from "@/components/home-landing";
import { HOME_PINNED_STAGES, HOME_PREPARE_ENTRY } from "@/lib/copy";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("getNarrativeProgress", () => {
  it("clamps geometry-derived narrative progress across the scroll track", () => {
    expect(
      getNarrativeProgress({
        top: 120,
        height: 3000,
      }, 1000),
    ).toBe(0);

    expect(
      getNarrativeProgress({
        top: -1020,
        height: 3000,
      }, 1000),
    ).toBeCloseTo(0.5, 3);

    expect(
      getNarrativeProgress({
        top: -2300,
        height: 3000,
      }, 1000),
    ).toBe(1);
  });
});

describe("resolveActiveStage", () => {
  it("maps progress thresholds to pinned stages", () => {
    expect(resolveActiveStage(0)).toBe("input");
    expect(resolveActiveStage(0.339)).toBe("input");
    expect(resolveActiveStage(0.34)).toBe("focus");
    expect(resolveActiveStage(0.669)).toBe("focus");
    expect(resolveActiveStage(0.67)).toBe("followup");
    expect(resolveActiveStage(1)).toBe("followup");
  });
});

describe("HomeLanding", () => {
  it("starts with the pinned narrative input stage active", () => {
    render(<HomeLanding />);

    expect(screen.getByTestId("pinned-narrative")).toHaveAttribute("data-active-stage", "input");
    expect(screen.getByTestId("pinned-narrative")).toHaveAttribute("data-motion-mode", "sharp");
    expect(screen.getByTestId("story-stage-input")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("story-stage-input")).toHaveAttribute("data-state", "active");
    expect(screen.getByTestId("story-stage-input")).toHaveAttribute("aria-current", "step");
    expect(screen.getByTestId("story-stage-focus")).toHaveAttribute("data-active", "false");
    expect(screen.getByTestId("story-stage-focus")).toHaveAttribute("data-state", "upcoming");
    expect(screen.getByTestId("story-stage-focus")).not.toHaveAttribute("aria-current");
    expect(screen.getByTestId("story-stage-followup")).toHaveAttribute("data-active", "false");
    expect(screen.getByTestId("story-stage-followup")).toHaveAttribute("data-state", "upcoming");
    expect(screen.getByTestId("story-stage-followup")).not.toHaveAttribute("aria-current");
    expect(screen.getByTestId("story-progress-rail")).toBeInTheDocument();
    expect(screen.getByTestId("story-progress-segment-input")).toHaveAttribute("data-state", "active");
    expect(screen.getByTestId("story-progress-segment-focus")).toHaveAttribute("data-state", "upcoming");
    expect(screen.getByTestId("story-progress-segment-followup")).toHaveAttribute("data-state", "upcoming");
  });

  it("renders the pinned story copy for every approved stage", () => {
    render(<HomeLanding />);

    expect(screen.getByRole("heading", { name: "AI Interviewer" })).toBeInTheDocument();

    for (const stage of HOME_PINNED_STAGES) {
      expect(screen.getByTestId(`story-stage-${stage.id}`)).toHaveTextContent(stage.title);
      expect(screen.getByTestId(`story-stage-${stage.id}`)).toHaveTextContent(stage.body);
    }
  });

  it("renders the quieter proof section with all proof points", () => {
    render(<HomeLanding />);

    expect(screen.getByRole("heading", { name: "为什么这套方式更接近真实面试" })).toBeInTheDocument();
    expect(screen.getByText("基于真实简历，而不是随机题库")).toBeInTheDocument();
    expect(screen.getByText("围绕目标岗位，而不是泛化提问")).toBeInTheDocument();
    expect(screen.getByText("输出结构复盘，而不是对话结束即结束")).toBeInTheDocument();
  });

  it("renders the final prepare entry", () => {
    render(<HomeLanding />);

    expect(screen.getByRole("heading", { name: HOME_PREPARE_ENTRY.title })).toBeInTheDocument();
    expect(screen.getByText(HOME_PREPARE_ENTRY.detail)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: HOME_PREPARE_ENTRY.cta })).toHaveAttribute("href", HOME_PREPARE_ENTRY.href);
  });

  it("updates the active story stage when scroll progress reaches a later segment", () => {
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

    let rectTop = 96;

    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function () {
      if ((this as HTMLElement).dataset.testid === "pinned-narrative") {
        return {
          x: 0,
          y: rectTop,
          top: rectTop,
          left: 0,
          right: 1200,
          bottom: rectTop + 3000,
          width: 1200,
          height: 3000,
          toJSON: () => ({}),
        };
      }

      return {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 1200,
        bottom: 800,
        width: 1200,
        height: 800,
        toJSON: () => ({}),
      };
    });

    render(<HomeLanding />);

    expect(screen.getByTestId("pinned-narrative")).toHaveAttribute("data-active-stage", "input");

    rectTop = -1900;

    act(() => {
      fireEvent.scroll(window);
    });

    expect(screen.getByTestId("pinned-narrative")).toHaveAttribute("data-active-stage", "followup");
    expect(screen.getByTestId("story-stage-followup")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("story-stage-followup")).toHaveAttribute("data-state", "active");
    expect(screen.getByTestId("story-stage-followup")).toHaveAttribute("aria-current", "step");
    expect(screen.getByTestId("story-stage-input")).toHaveAttribute("data-active", "false");
    expect(screen.getByTestId("story-stage-input")).toHaveAttribute("data-state", "past");
    expect(screen.getByTestId("story-stage-input")).not.toHaveAttribute("aria-current");
    expect(screen.getByTestId("story-stage-focus")).toHaveAttribute("data-state", "past");
    expect(screen.getByTestId("story-progress-segment-input")).toHaveAttribute("data-state", "past");
    expect(screen.getByTestId("story-progress-segment-focus")).toHaveAttribute("data-state", "past");
    expect(screen.getByTestId("story-progress-segment-followup")).toHaveAttribute("data-state", "active");
  });
});
