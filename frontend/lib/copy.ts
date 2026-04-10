export const NAV_ITEMS = [
  { href: "/", label: "首页" },
  { href: "/prepare", label: "准备面试" },
  { href: "/interview", label: "面试中" },
  { href: "/report", label: "复盘报告" },
] as const;

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
