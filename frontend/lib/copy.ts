export const NAV_ITEMS = [
  { href: "/", label: "首页" },
  { href: "/prepare", label: "准备面试" },
  { href: "/interview", label: "面试中" },
  { href: "/report", label: "复盘报告" },
] as const;

export const HOME_PINNED_STAGES = [
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
] as const;

export const HOME_PROOF_POINTS = [
  "基于真实简历，而不是随机题库",
  "围绕目标岗位，而不是泛化提问",
  "输出结构复盘，而不是对话结束即结束",
] as const;

export const HOME_PREPARE_ENTRY = {
  title: "开始准备这场面试",
  detail: "真正的上传、岗位设定与准备结果生成都在准备工作区完成。",
  href: "/prepare",
  cta: "进入准备工作区",
} as const;

const DIMENSION_LABELS: Record<string, string> = {
  technical_accuracy: "技术准确性",
  relevance: "相关性",
  depth: "深度",
  evidence: "证据",
  clarity: "表达清晰度",
};

const SESSION_STATUS_LABELS: Record<string, string> = {
  starting: "正在生成问题",
  in_progress: "进行中",
  ready_to_finish: "可生成复盘",
  finished: "已完成",
};

const BACKEND_ERROR_LABELS: Record<string, string> = {
  "JD text is required.": "请输入岗位 JD。",
  "Target role is required.": "请输入目标岗位。",
  "Resume PDF could not be extracted.": "简历 PDF 无法解析，请更换文件后重试。",
  "Session not found.": "未找到当前面试会话。",
  "Prepare result not found.": "当前准备结果不存在，请重新开始。",
  "Report not found.": "未找到复盘报告。",
  "Interview session is ready to finish.": "当前面试已达到结束条件，请直接生成复盘。",
  "Interview session is already finished.": "当前面试已经结束。",
  "Interview session is not ready to finish.": "当前面试尚未达到生成复盘的条件。",
};

export function formatDimensionLabel(key: string): string {
  return DIMENSION_LABELS[key] ?? key.replaceAll("_", " ");
}

export function formatSessionStatus(status: string): string {
  return SESSION_STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

export function formatBackendError(message: string): string {
  return BACKEND_ERROR_LABELS[message] ?? message;
}

export function formatReportTitle(title: string): string {
  return title === "AI Interview Review" ? "AI 面试复盘报告" : title;
}
