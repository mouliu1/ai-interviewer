import { describe, expect, it } from "vitest";

import {
  HOME_PINNED_STAGES,
  HOME_PREPARE_ENTRY,
  HOME_PROOF_POINTS,
  NAV_ITEMS,
  formatDimensionLabel,
  formatSessionStatus,
} from "@/lib/copy";

describe("copy", () => {
  it("renders top-level navigation for home, prepare, interview, and report", () => {
    expect(NAV_ITEMS).toEqual([
      { href: "/", label: "首页" },
      { href: "/prepare", label: "准备工作区" },
      { href: "/interview", label: "面试中" },
      { href: "/report", label: "复盘报告" },
    ]);
  });

  it("renders the pinned homepage stages", () => {
    expect(HOME_PINNED_STAGES).toEqual([
      {
        id: "input",
        eyebrow: "Stage 01",
        title: "输入真实语境",
        body: "上传简历和目标岗位后，系统先建立这场面试的真实上下文，而不是直接吐出一组泛化题目。",
        canvasLabel: "Context Build",
      },
      {
        id: "focus",
        eyebrow: "Stage 02",
        title: "形成匹配焦点",
        body: "系统把 JD、项目经历和能力信号对齐，决定应该先问什么、继续追什么、风险点落在哪里。",
        canvasLabel: "Fit Focus",
      },
      {
        id: "followup",
        eyebrow: "Stage 03",
        title: "进入追问与复盘闭环",
        body: "回答之后不是结束，而是继续追问并最终沉淀成结构化复盘，直接回到训练闭环。",
        canvasLabel: "Follow-up Loop",
      },
    ]);
  });

  it("renders the homepage proof points", () => {
    expect(HOME_PROOF_POINTS).toEqual([
      "基于真实简历，而不是随机题库",
      "围绕目标岗位，而不是泛化提问",
      "输出结构复盘，而不是对话结束即结束",
    ]);
  });

  it("renders the homepage prepare entry", () => {
    expect(HOME_PREPARE_ENTRY).toEqual({
      title: "开始准备这场面试",
      detail: "真正的上传、岗位设定与准备结果生成都在准备工作区完成。",
      href: "/prepare",
      cta: "进入准备工作区",
    });
  });

  it("renders score dimensions in Chinese", () => {
    expect(formatDimensionLabel("technical_accuracy")).toBe("技术准确性");
    expect(formatDimensionLabel("relevance")).toBe("相关性");
    expect(formatDimensionLabel("depth")).toBe("深度");
    expect(formatDimensionLabel("evidence")).toBe("证据");
    expect(formatDimensionLabel("clarity")).toBe("表达清晰度");
  });

  it("renders session statuses in Chinese", () => {
    expect(formatSessionStatus("starting")).toBe("正在生成问题");
    expect(formatSessionStatus("in_progress")).toBe("进行中");
    expect(formatSessionStatus("ready_to_finish")).toBe("可生成复盘");
    expect(formatSessionStatus("finished")).toBe("已完成");
  });
});
