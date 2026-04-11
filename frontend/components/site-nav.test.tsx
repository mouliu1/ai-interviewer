import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from "next/navigation";
import { SiteNav } from "@/components/site-nav";

const mockedUsePathname = vi.mocked(usePathname);

afterEach(() => {
  cleanup();
  mockedUsePathname.mockReset();
});

describe("SiteNav", () => {
  it("marks the current route as active", () => {
    mockedUsePathname.mockReturnValue("/prepare");

    render(<SiteNav />);

    expect(screen.getByRole("link", { name: "准备工作区" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "首页" })).not.toHaveAttribute("aria-current");
  });

  it("keeps the homepage active only on root", () => {
    mockedUsePathname.mockReturnValue("/");

    render(<SiteNav />);

    expect(screen.getByRole("link", { name: "首页" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "准备工作区" })).not.toHaveAttribute("aria-current");
  });
});
