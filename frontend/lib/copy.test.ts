import { describe, expect, it } from "vitest";

import { NAV_ITEMS, formatDimensionLabel, formatSessionStatus } from "@/lib/copy";

describe("copy", () => {
  it("renders top-level navigation in Chinese", () => {
    expect(NAV_ITEMS.map((item) => item.label)).toEqual(["开始", "面试中", "复盘报告"]);
  });

  it("renders score dimensions in Chinese", () => {
    expect(formatDimensionLabel("technical_accuracy")).toBe("技术准确性");
    expect(formatDimensionLabel("relevance")).toBe("相关性");
    expect(formatDimensionLabel("depth")).toBe("深度");
    expect(formatDimensionLabel("evidence")).toBe("证据");
    expect(formatDimensionLabel("clarity")).toBe("表达清晰度");
  });

  it("renders session statuses in Chinese", () => {
    expect(formatSessionStatus("in_progress")).toBe("进行中");
    expect(formatSessionStatus("ready_to_finish")).toBe("可生成复盘");
    expect(formatSessionStatus("finished")).toBe("已完成");
  });
});
