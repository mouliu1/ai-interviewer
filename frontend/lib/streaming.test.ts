import { describe, expect, test } from "vitest";

import { parseSseChunk } from "@/lib/streaming";

describe("streaming", () => {
  test("parses complete SSE events from a single chunk", () => {
    const parsed = parseSseChunk(
      'event: status\ndata: {"stage":"prepare","message":"正在解析简历"}\n\nevent: token\ndata: {"delta":"你"}\n\n',
      "",
    );

    expect(parsed.events).toEqual([
      {
        event: "status",
        data: { stage: "prepare", message: "正在解析简历" },
      },
      {
        event: "token",
        data: { delta: "你" },
      },
    ]);
    expect(parsed.remainder).toBe("");
  });

  test("keeps incomplete event text as remainder until next chunk arrives", () => {
    const first = parseSseChunk('event: token\ndata: {"delta":"你', "");
    expect(first.events).toEqual([]);

    const second = parseSseChunk('好"}\n\n', first.remainder);
    expect(second.events).toEqual([
      {
        event: "token",
        data: { delta: "你好" },
      },
    ]);
    expect(second.remainder).toBe("");
  });
});
