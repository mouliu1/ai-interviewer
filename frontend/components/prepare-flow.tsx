"use client";

import React from "react";
import { startTransition, useDeferredValue, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { streamPrepareInterview } from "@/lib/frontend-api";
import { buildPendingInterviewSnapshot } from "@/lib/interview-presenter";
import { clearAppSnapshot, updateAppSnapshot } from "@/lib/session-store";
import type { PrepareResponse } from "@/lib/types";

const ROUND_OPTIONS = [2, 3, 4];

const PREPARE_STAGE_LABELS: Record<string, string> = {
  resume_parse: "正在解析简历",
  jd_parse: "正在分析目标岗位",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function PrepareFlow() {
  const router = useRouter();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumePreviewUrl, setResumePreviewUrl] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [plannedRounds, setPlannedRounds] = useState(3);
  const [prepareResult, setPrepareResult] = useState<PrepareResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPreparing, setIsPreparing] = useState(false);
  const [activeStage, setActiveStage] = useState("");
  const [stageMessage, setStageMessage] = useState("");
  const [stageDrafts, setStageDrafts] = useState<Record<string, string>>({});
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [summaryTargetText, setSummaryTargetText] = useState("");
  const [summaryDisplayText, setSummaryDisplayText] = useState("");

  useEffect(() => {
    updateAppSnapshot({ prepare: undefined });
  }, []);

  useEffect(() => {
    setSummaryDisplayText("");
  }, [summaryTargetText]);

  useEffect(() => {
    if (!summaryTargetText) {
      return;
    }

    let frame = 0;
    const timer = window.setInterval(() => {
      frame += 10;
      setSummaryDisplayText(summaryTargetText.slice(0, frame));
      if (frame >= summaryTargetText.length) {
        window.clearInterval(timer);
      }
    }, 14);

    return () => {
      window.clearInterval(timer);
    };
  }, [summaryTargetText]);

  useEffect(() => {
    if (!resumeFile) {
      setResumePreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(resumeFile);
    setResumePreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [resumeFile]);

  const currentStreamText = activeStage ? stageDrafts[activeStage] ?? "" : "";
  const deferredStreamText = useDeferredValue(currentStreamText);
  const candidateProjects = prepareResult?.candidate_profile.projects ?? [];
  const primaryProject = candidateProjects[0];

  const matchingSummary = useMemo(() => {
    if (!prepareResult) {
      return "生成准备结果后，这里会展示岗位匹配重点、候选人技能和面试关注方向。";
    }
    return prepareResult.fit_focus_preview.length
      ? `当前面试会重点围绕 ${prepareResult.fit_focus_preview.join("、")} 等方向展开。`
      : "系统已完成当前面试准备。";
  }, [prepareResult]);

  const humanReadableSummary = useMemo(() => {
    if (summaryDisplayText) {
      return summaryDisplayText;
    }
    if (prepareResult) {
      return [
        prepareResult.resume_summary_preview,
        prepareResult.fit_focus_preview.length ? `匹配重点：${prepareResult.fit_focus_preview.join("、")}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");
    }
    return stageMessage ? `${stageMessage}...` : "生成准备结果后，这里会以自然语言方式展示简历摘要与岗位匹配重点。";
  }, [prepareResult, stageMessage, summaryDisplayText]);

  async function handlePrepareSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!resumeFile) {
      setErrorMessage("请先选择一份 PDF 简历。");
      return;
    }

    setIsPreparing(true);
    setPrepareResult(null);
    setErrorMessage("");
    setActiveStage("resume_parse");
    setStageMessage(PREPARE_STAGE_LABELS.resume_parse);
    setStageDrafts({});
    setSummaryTargetText("");
    setSummaryDisplayText("");

    const formData = new FormData();
    formData.append("resume_file", resumeFile);
    formData.append("target_role", targetRole);

    const streamResult: { prepare?: PrepareResponse } = {};

    try {
      await streamPrepareInterview(formData, async (eventPayload) => {
        const data = eventPayload.data;

        if (eventPayload.event === "status" && isRecord(data)) {
          const stage = String(data["stage"] ?? "");
          setActiveStage(stage);
          const message = String(data["message"] ?? PREPARE_STAGE_LABELS[stage] ?? "正在处理中");
          setStageMessage(message);
          setSummaryTargetText(`${message}...`);
          return;
        }

        if (eventPayload.event === "token" && isRecord(data)) {
          const stage = String(data["stage"] ?? activeStage);
          const delta = String(data["delta"] ?? "");
          setActiveStage(stage);
          setStageDrafts((current) => ({
            ...current,
            [stage]: `${current[stage] ?? ""}${delta}`,
          }));
          return;
        }

        if (eventPayload.event === "final" && isRecord(data)) {
          streamResult.prepare = data as PrepareResponse;
        }
      });

      if (!streamResult.prepare) {
        throw new Error("准备结果为空，请重试。");
      }

      const finalPrepare = streamResult.prepare;
      setPrepareResult(finalPrepare);
      setStageMessage("准备完成");
      setSummaryTargetText(
        [finalPrepare.resume_summary_preview, `匹配重点：${finalPrepare.fit_focus_preview.join("、")}`].join("\n\n"),
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "面试准备失败，请稍后重试。");
    } finally {
      setIsPreparing(false);
    }
  }

  async function handleStartInterview() {
    if (!prepareResult) {
      return;
    }

    setErrorMessage("");
    updateAppSnapshot({
      prepare: prepareResult,
      interview: buildPendingInterviewSnapshot(prepareResult.prepare_id, plannedRounds),
      report: undefined,
    });

    startTransition(() => {
      router.push(`/interview?prepareId=${prepareResult.prepare_id}`);
    });
  }

  function resetCurrentFlow() {
    setResumeFile(null);
    setPrepareResult(null);
    setErrorMessage("");
    setStageMessage("");
    setActiveStage("");
    setStageDrafts({});
    setTargetRole("");
    setIsPreviewExpanded(false);
    clearAppSnapshot();
  }

  return (
    <div className="page-grid prepare-page-grid">
      <section className="panel panel-left prepare-intro">
        <div className="panel-header">
          <div>
            <div className="panel-eyebrow">Prepare</div>
            <h1>准备本场面试</h1>
            <p className="hero-copy prepare-copy">上传简历、输入目标岗位并生成准备结果，然后进入正式面试。</p>
          </div>
          <div className="status-pill">{prepareResult ? "已生成" : "待准备"}</div>
        </div>
      </section>

      <section className="panel panel-right prepare-summary">
        <div className="mini-stat-list">
          <div className="mini-stat">
            <span className="stat-label">输入</span>
            <strong>PDF 简历</strong>
          </div>
          <div className="mini-stat">
            <span className="stat-label">目标</span>
            <strong>岗位定向问题</strong>
          </div>
          <div className="mini-stat">
            <span className="stat-label">输出</span>
            <strong>准备结果与开场问题</strong>
          </div>
        </div>
      </section>

      <section className="panel panel-wide">
        <div className="panel-header">
          <div>
            <div className="panel-eyebrow">步骤一</div>
            <h2 aria-hidden="true">准备本场面试</h2>
          </div>
          <div className="status-pill">{prepareResult ? "已生成" : "待准备"}</div>
        </div>

        <form className="stack-lg" onSubmit={handlePrepareSubmit}>
          <div className="upload-row">
            <label className="upload-zone">
              <span className="field-label">简历 PDF</span>
              <span className="upload-headline">{resumeFile?.name ?? "选择你的 PDF 简历"}</span>
              <span className="upload-caption">上传完成后可直接预览，方便在准备阶段持续对照简历内容。</span>
              <input
                accept="application/pdf"
                className="file-input file-input-hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setResumeFile(file);
                  setPrepareResult(null);
                }}
                type="file"
              />
            </label>

            <div className="compact-card">
              <span className="field-label">面试轮数</span>
              <div className="chip-row">
                {ROUND_OPTIONS.map((roundOption) => (
                  <button
                    className={roundOption === plannedRounds ? "chip selected" : "chip"}
                    key={roundOption}
                    onClick={(event) => {
                      event.preventDefault();
                      setPlannedRounds(roundOption);
                    }}
                    type="button"
                  >
                    {roundOption} 轮
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="field">
            <span className="field-label">目标岗位</span>
            <input
              className="text-input"
              onChange={(event) => {
                setTargetRole(event.target.value);
                setPrepareResult(null);
              }}
              placeholder="例如：AI 应用工程师 / Python 后端工程师"
              value={targetRole}
            />
          </label>

          <article className="document-panel">
            <div className="panel-label-row">
              <span className="mini-label">简历预览</span>
              {resumeFile ? <span className="filename-badge">{resumeFile.name}</span> : null}
            </div>
            <div
              className={resumePreviewUrl ? "document-preview zoomable" : "document-preview"}
              onDoubleClick={() => {
                if (resumePreviewUrl) {
                  setIsPreviewExpanded(true);
                }
              }}
              role={resumePreviewUrl ? "button" : undefined}
              tabIndex={resumePreviewUrl ? 0 : -1}
            >
              {resumePreviewUrl ? (
                <iframe className="pdf-frame" src={resumePreviewUrl} title="简历预览" />
              ) : (
                <div className="document-placeholder">
                  <p>上传简历后可在这里直接预览 PDF，避免准备阶段失去上下文。</p>
                </div>
              )}
            </div>
          </article>

          {errorMessage ? <div className="notice error">{errorMessage}</div> : null}

          <div className="actions">
            <button className="button primary" disabled={isPreparing} type="submit">
              {isPreparing ? "正在生成准备结果..." : "生成准备结果"}
            </button>
            <button className="button secondary" onClick={resetCurrentFlow} type="button">
              重新开始
            </button>
          </div>
        </form>
      </section>

      <section className="panel panel-wide">
        <div className="panel-header">
          <div>
            <div className="panel-eyebrow">准备结果</div>
            <h2>岗位匹配与面试重点</h2>
          </div>
          <div className="status-pill muted">{prepareResult ? "已就绪" : "等待生成"}</div>
        </div>

        <div className="result-grid">
          <article className="side-card emphasis">
            <div className="panel-label-row">
              <span className="mini-label">简历摘要</span>
              <span className="status-inline">{stageMessage || "等待生成"}</span>
            </div>
            <div className="summary-card">
              <p className="summary-text">{humanReadableSummary}</p>
            </div>
          </article>

          <article className="side-card">
            <span className="mini-label">当前摘要</span>
            <p>{matchingSummary}</p>
          </article>

          {prepareResult ? (
            <>
              <article className="side-card">
                <span className="mini-label">匹配重点</span>
                <div className="chip-row">
                  {prepareResult.fit_focus_preview.map((focusItem) => (
                    <span className="chip static" key={focusItem}>
                      {focusItem}
                    </span>
                  ))}
                </div>
              </article>

              <article className="side-card">
                <span className="mini-label">候选人技能</span>
                <div className="chip-row">
                  {(prepareResult.candidate_profile.skills ?? []).map((skill) => (
                    <span className="chip static" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              </article>

              <article className="side-card">
                <span className="mini-label">核心项目</span>
                <p>{primaryProject?.name ?? "未提取到核心项目"}</p>
                <ul className="bullet-list">
                  {(primaryProject?.highlights ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="side-card action-card">
                <span className="mini-label">下一步</span>
                <p>准备完成后，即可进入面试环节并开始动态追问。</p>
                <button className="button primary button-full" onClick={handleStartInterview} type="button">
                  开始面试
                </button>
              </article>
            </>
          ) : null}
        </div>
      </section>

      {isPreviewExpanded ? (
        <div
          className="preview-overlay"
          onClick={() => setIsPreviewExpanded(false)}
          role="button"
          tabIndex={0}
        >
          <div
            className="preview-dialog"
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={() => setIsPreviewExpanded(false)}
            role="dialog"
            tabIndex={-1}
          >
            <div className="panel-label-row">
              <span className="mini-label">放大预览</span>
              <button className="button secondary" onClick={() => setIsPreviewExpanded(false)} type="button">
                关闭
              </button>
            </div>
            <iframe className="pdf-frame pdf-frame-expanded" src={resumePreviewUrl} title="放大简历预览" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
