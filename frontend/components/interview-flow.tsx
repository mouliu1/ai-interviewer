"use client";

import React from "react";
import { startTransition, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { streamAnswerInterview, streamFinishInterview, streamStartInterview } from "@/lib/frontend-api";
import {
  buildQuestionPlanSummary,
  buildRoundTitle,
  getDimensionEntries,
} from "@/lib/interview-presenter";
import { formatDimensionLabel, formatSessionStatus } from "@/lib/copy";
import { loadAppSnapshot, updateAppSnapshot } from "@/lib/session-store";
import type { InterviewSnapshot, ReportResponse, StartInterviewResponse, TurnSummary } from "@/lib/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

type StreamedFinishPayload = {
  report_id: string;
  overall_score: number;
  report_summary: string;
  session_status: string;
  report: ReportResponse;
};

function buildTurnInsight(turn: TurnSummary): string {
  const parts: string[] = [];

  if (turn.strengths.length > 0) {
    parts.push(`系统先确认了你的优势：${turn.strengths.join("；")}。`);
  }

  if (turn.weaknesses.length > 0) {
    parts.push(`需要补强的地方是：${turn.weaknesses.join("；")}。`);
  }

  if (turn.session_status === "ready_to_finish") {
    parts.push("当前轮次已经达到结束条件，接下来可以直接生成复盘报告。");
  }

  return parts.join("\n\n") || "系统正在整理本轮回答的重点。";
}

export function InterviewFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bootstrapRef = useRef(false);
  const [interview, setInterview] = useState<InterviewSnapshot | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [latestTurn, setLatestTurn] = useState<TurnSummary | null>(null);
  const [latestAnsweredRound, setLatestAnsweredRound] = useState<number | null>(null);
  const [stageMessage, setStageMessage] = useState("");
  const [insightTargetText, setInsightTargetText] = useState("");
  const [insightDisplayText, setInsightDisplayText] = useState("");
  const [questionTargetText, setQuestionTargetText] = useState("");
  const [questionDisplayText, setQuestionDisplayText] = useState("");
  const [queuedQuestionText, setQueuedQuestionText] = useState("");

  useEffect(() => {
    const requestedSessionId = searchParams.get("sessionId");
    const requestedPrepareId = searchParams.get("prepareId");
    const snapshot = loadAppSnapshot();
    const storedInterview = snapshot?.interview;

    if (!storedInterview) {
      setInterview(null);
      return;
    }

    const sessionMatches = requestedSessionId ? storedInterview.sessionId === requestedSessionId : true;
    const prepareMatches = requestedPrepareId ? storedInterview.prepareId === requestedPrepareId : true;

    if (sessionMatches && prepareMatches) {
      setInterview(storedInterview);
      setLatestTurn(null);
      setLatestAnsweredRound(null);
      return;
    }

    setInterview(null);
  }, [searchParams]);

  useEffect(() => {
    setInsightDisplayText("");
  }, [insightTargetText]);

  useEffect(() => {
    if (!insightTargetText) {
      return;
    }

    let frame = 0;
    const timer = window.setInterval(() => {
      frame += 10;
      setInsightDisplayText(insightTargetText.slice(0, frame));
      if (frame >= insightTargetText.length) {
        window.clearInterval(timer);
      }
    }, 14);

    return () => {
      window.clearInterval(timer);
    };
  }, [insightTargetText]);

  useEffect(() => {
    if (!queuedQuestionText) {
      return;
    }

    if (insightTargetText && insightDisplayText !== insightTargetText) {
      return;
    }

    setQuestionTargetText(queuedQuestionText);
    setQueuedQuestionText("");
  }, [insightDisplayText, insightTargetText, queuedQuestionText]);

  useEffect(() => {
    setQuestionDisplayText("");
  }, [questionTargetText]);

  useEffect(() => {
    if (!questionTargetText) {
      return;
    }

    let frame = 0;
    const timer = window.setInterval(() => {
      frame += 6;
      setQuestionDisplayText(questionTargetText.slice(0, frame));
      if (frame >= questionTargetText.length) {
        window.clearInterval(timer);
      }
    }, 18);

    return () => {
      window.clearInterval(timer);
    };
  }, [questionTargetText]);

  useEffect(() => {
    if (!interview || interview.sessionId || interview.sessionStatus !== "starting" || !interview.prepareId || bootstrapRef.current) {
      return;
    }

    bootstrapRef.current = true;
    setIsBootstrapping(true);
    setErrorMessage("");
    setStageMessage("正在生成开场问题");
    setInsightTargetText("系统正在结合你的真实简历与目标岗位，整理本轮切入点。");
    setQuestionTargetText("");
    setQuestionDisplayText("");

    const streamResult: { start?: StartInterviewResponse; plan?: unknown } = {};

    void (async () => {
      try {
        await streamStartInterview(
          {
            prepare_id: interview.prepareId as string,
            mode: "standard",
            planned_round_count: interview.plannedRoundCount,
          },
          async (eventPayload) => {
            const data = eventPayload.data;

            if (eventPayload.event === "status" && isRecord(data)) {
              setStageMessage(String(data["message"] ?? "正在生成开场问题"));
              return;
            }

            if (eventPayload.event === "stage_result" && isRecord(data)) {
              const payload = data["payload"];
              streamResult.plan = payload;
              setInsightTargetText(buildQuestionPlanSummary(payload));

              if (isRecord(payload) && Array.isArray(payload["opening_questions"]) && payload["opening_questions"][0]) {
                setQueuedQuestionText(String(payload["opening_questions"][0]));
              }
              return;
            }

            if (eventPayload.event === "final" && isRecord(data)) {
              streamResult.start = data as StartInterviewResponse;
            }
          },
        );

        if (!streamResult.start) {
          throw new Error("未生成可用的开场问题。");
        }

        const finalStart = streamResult.start;
        const nextInterview: InterviewSnapshot = {
          ...interview,
          sessionId: finalStart.session_id,
          currentQuestion: finalStart.first_question,
          plannedRoundCount: finalStart.planned_round_count,
          currentRound: 1,
          remainingRounds: Math.max(finalStart.planned_round_count - 1, 0),
          sessionStatus: finalStart.session_status,
          focusDimensions: finalStart.focus_dimensions,
        };

        if (!streamResult.plan) {
          setInsightTargetText(
            buildQuestionPlanSummary({
              focus_dimensions: finalStart.focus_dimensions,
              opening_questions: [finalStart.first_question],
            }),
          );
          setQueuedQuestionText(finalStart.first_question);
        }

        setInterview(nextInterview);
        updateAppSnapshot({ interview: nextInterview });
        setStageMessage("当前问题已生成");
      } catch (error) {
        bootstrapRef.current = false;
        setErrorMessage(error instanceof Error ? error.message : "启动面试失败，请稍后重试。");
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, [interview]);

  async function handleAnswerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!interview?.sessionId) {
      return;
    }

    const answeredRound = interview.currentRound;
    setIsSubmitting(true);
    setErrorMessage("");
    setStageMessage("正在分析本轮回答");
    setInsightTargetText("系统正在结合你的回答，更新本轮判断。");
    setQuestionTargetText("");
    setQueuedQuestionText("");
    setLatestTurn(null);

    const streamResult: { turn?: TurnSummary } = {};

    try {
      await streamAnswerInterview(interview.sessionId, answerText, async (eventPayload) => {
        const data = eventPayload.data;

        if (eventPayload.event === "status" && isRecord(data)) {
          setStageMessage(String(data["message"] ?? "正在分析本轮回答"));
          return;
        }

        if (eventPayload.event === "stage_result" && isRecord(data) && isRecord(data["payload"])) {
          const payload = data["payload"] as TurnSummary;
          setInsightTargetText(buildTurnInsight(payload));
          if (payload.next_question) {
            setQueuedQuestionText(payload.next_question);
          }
          return;
        }

        if (eventPayload.event === "final" && isRecord(data)) {
          streamResult.turn = data as TurnSummary;
        }
      });

      if (!streamResult.turn) {
        throw new Error("未收到本轮结果，请重试。");
      }
      const finalTurn = streamResult.turn;

      const nextInterview: InterviewSnapshot = {
        ...interview,
        currentQuestion: finalTurn.next_question,
        currentRound: finalTurn.current_round,
        remainingRounds: finalTurn.remaining_rounds,
        sessionStatus: finalTurn.session_status,
        lastTurn: finalTurn,
      };

      if (!insightTargetText || insightTargetText === "系统正在结合你的回答，更新本轮判断。") {
        setInsightTargetText(buildTurnInsight(finalTurn));
      }
      if (finalTurn.next_question) {
        setQueuedQuestionText(finalTurn.next_question);
      }

      setInterview(nextInterview);
      setLatestTurn(finalTurn);
      setLatestAnsweredRound(answeredRound);
      setAnswerText("");
      updateAppSnapshot({
        interview: nextInterview,
      });
      setStageMessage(finalTurn.session_status === "ready_to_finish" ? "本轮完成，可以生成复盘" : "已进入下一轮");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "提交回答失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleFinish() {
    if (!interview?.sessionId) {
      return;
    }

    setIsFinishing(true);
    setErrorMessage("");
    setStageMessage("正在生成复盘报告");
    setInsightTargetText("系统正在汇总整场面试的表现，并整理最终建议。");
    setQuestionTargetText("");
    setQueuedQuestionText("");

    const streamResult: { finish?: StreamedFinishPayload } = {};

    try {
      await streamFinishInterview(interview.sessionId, async (eventPayload) => {
        const data = eventPayload.data;

        if (eventPayload.event === "status" && isRecord(data)) {
          setStageMessage(String(data["message"] ?? "正在生成复盘报告"));
          return;
        }

        if (eventPayload.event === "stage_result" && isRecord(data) && isRecord(data["payload"])) {
          const payload = data["payload"] as ReportResponse;
          setInsightTargetText(payload.final_summary || "系统正在整理最终复盘。");
          return;
        }

        if (eventPayload.event === "final" && isRecord(data)) {
          streamResult.finish = data as StreamedFinishPayload;
        }
      });

      if (!streamResult.finish) {
        throw new Error("复盘结果为空，请稍后重试。");
      }
      const finalPayload = streamResult.finish;

      updateAppSnapshot({
        interview: {
          ...interview,
          sessionStatus: finalPayload.session_status,
        },
        report: {
          sessionId: interview.sessionId,
          reportId: finalPayload.report_id,
          overallScore: finalPayload.overall_score,
          summary: finalPayload.report_summary,
          detail: finalPayload.report,
        },
      });

      startTransition(() => {
        router.push(`/report?sessionId=${interview.sessionId}`);
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "生成复盘失败，请稍后重试。");
    } finally {
      setIsFinishing(false);
    }
  }

  const readyToFinish = interview?.sessionStatus === "ready_to_finish" || interview?.sessionStatus === "finished";
  const progressValue = interview ? Math.min(interview.currentRound / interview.plannedRoundCount, 1) : 0;
  const currentQuestionText = questionDisplayText || interview?.currentQuestion || "系统正在生成当前问题...";
  const displayedInsightText =
    insightDisplayText ||
    insightTargetText ||
    "系统会先整理本轮切入点，再逐步展开当前问题与反馈。";
  const latestRoundTitle = buildRoundTitle(latestAnsweredRound ?? 1);
  const dimensionEntries = latestTurn ? getDimensionEntries(latestTurn.turn_score_summary.dimension_scores) : [];
  const focusChips = useMemo(() => (interview?.focusDimensions ?? []).map((dimension) => formatDimensionLabel(dimension)), [interview]);

  if (!interview) {
    return (
      <section className="panel empty-panel">
        <div className="panel-header">
          <div>
            <div className="panel-eyebrow">面试</div>
            <h2>当前没有进行中的面试</h2>
          </div>
        </div>
        <div className="empty-state">
          <p>请先前往准备页上传简历并填写目标岗位，再开始一场新的面试。</p>
          <button
            className="button primary"
            onClick={() => {
              startTransition(() => {
                router.push("/prepare");
              });
            }}
            type="button"
          >
            前往准备页
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="page-grid interview-grid">
      <section className="hero-card interview-hero">
        <div className="eyebrow">实时面试</div>
        <h1>问题、追问与反馈会围绕你的真实项目持续收紧。</h1>
        <p className="hero-copy">
          面试页会先整理本轮切入点，再逐步展开当前问题。每轮结束后，系统会把维度分数、优势和不足直接反馈给你。
        </p>
        <div className="session-strip">
          <div>
            <span className="stat-label">当前状态</span>
            <strong>{formatSessionStatus(interview.sessionStatus)}</strong>
          </div>
          <div>
            <span className="stat-label">轮次进度</span>
            <strong>
              {Math.min(interview.currentRound, interview.plannedRoundCount)} / {interview.plannedRoundCount}
            </strong>
          </div>
          <div>
            <span className="stat-label">剩余轮次</span>
            <strong>{interview.remainingRounds}</strong>
          </div>
        </div>
        <div className="progress-track">
          <span className="progress-fill" style={{ width: `${progressValue * 100}%` }} />
        </div>
      </section>

      <section className="panel interview-main">
        <div className="panel-header">
          <div>
            <div className="panel-eyebrow">当前问题</div>
            <h2>{readyToFinish ? "当前面试已进入复盘阶段" : "围绕当前问题作答"}</h2>
          </div>
          <div className={readyToFinish ? "status-pill success" : "status-pill"}>{formatSessionStatus(interview.sessionStatus)}</div>
        </div>

        <div className="interview-stage-grid">
          <article className="side-card emphasis">
            <div className="panel-label-row">
              <span className="mini-label">问题脉络</span>
              <span className="status-inline">{stageMessage || "等待开始"}</span>
            </div>
            <div className="summary-card">
              <p className="summary-text">{displayedInsightText}</p>
            </div>
          </article>

          <div className="workspace-main stack-lg">
            <article className="question-stage question-stage-large">
              <span className="mini-label">当前问题</span>
              <p>{currentQuestionText}</p>
            </article>

            <article className="side-card">
              <span className="mini-label">本场关注维度</span>
              <div className="chip-row">
                {focusChips.map((dimension) => (
                  <span className="chip static" key={dimension}>
                    {dimension}
                  </span>
                ))}
              </div>
            </article>

            {!readyToFinish ? (
              <form className="stack-lg" onSubmit={handleAnswerSubmit}>
                <label className="field">
                  <span className="field-label">你的回答</span>
                  <textarea
                    className="textarea"
                    disabled={isBootstrapping}
                    onChange={(event) => setAnswerText(event.target.value)}
                    placeholder="围绕项目背景、设计选择、验证方式和效果结果来回答，会更贴近真实技术面。"
                    rows={9}
                    value={answerText}
                  />
                </label>

                {errorMessage ? <div className="notice error">{errorMessage}</div> : null}

                <div className="actions">
                  <button
                    className="button primary"
                    disabled={isBootstrapping || isSubmitting || !interview.sessionId || !answerText.trim()}
                    type="submit"
                  >
                    {isSubmitting ? "正在分析回答..." : isBootstrapping ? "正在生成当前问题..." : "提交回答"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="ready-shell">
                <div className="notice success">当前会话已达到结束条件，可以开始生成复盘报告。</div>
                <div className="actions">
                  <button className="button primary" disabled={isFinishing} onClick={handleFinish} type="button">
                    {isFinishing ? "正在生成复盘..." : "生成复盘报告"}
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => {
                      startTransition(() => {
                        router.push("/prepare");
                      });
                    }}
                    type="button"
                  >
                    开始新的面试
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="panel panel-wide feedback-panel">
        <div className="panel-header">
          <div>
            <div className="panel-eyebrow">{latestTurn ? latestRoundTitle : "本轮反馈"}</div>
            <h2>评分与反馈</h2>
          </div>
        </div>

        {latestTurn ? (
          <div className="feedback-shell">
            <div className="score-card score-card-large">
              <span className="score-number">{latestTurn.turn_score_summary.score}</span>
              <span className="score-label">{latestRoundTitle}得分</span>
            </div>

            <div className="feedback-detail-grid">
              <article className="side-card">
                <span className="mini-label">维度拆解</span>
                <div className="stack-sm block-space">
                  {dimensionEntries.map(([dimension, score]) => (
                    <div className="dimension-row" key={dimension}>
                      <span>{formatDimensionLabel(dimension)}</span>
                      <div className="dimension-meter">
                        <span className="dimension-fill" style={{ width: `${(score / 5) * 100}%` }} />
                      </div>
                      <strong>{score}/5</strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className="side-card">
                <span className="mini-label">系统反馈</span>
                <div className="feedback-columns block-space">
                  <div className="feedback-group">
                    <span className="feedback-heading">优势</span>
                    <ul className="bullet-list">
                      {latestTurn.strengths.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="feedback-group">
                    <span className="feedback-heading feedback-heading-warning">待改进</span>
                    <ul className="bullet-list">
                      {latestTurn.weaknesses.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>提交第一轮回答后，这里会显示当轮维度分数、优势和待改进点。</p>
          </div>
        )}
      </section>
    </div>
  );
}
