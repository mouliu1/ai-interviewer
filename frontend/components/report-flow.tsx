"use client";

import React from "react";
import { startTransition, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { formatBackendError, formatDimensionLabel, formatReportTitle } from "@/lib/copy";
import { getReport } from "@/lib/frontend-api";
import { loadAppSnapshot, updateAppSnapshot } from "@/lib/session-store";
import type { ReportResponse } from "@/lib/types";

export function ReportFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const snapshot = loadAppSnapshot();
  const storedReport = snapshot?.report;
  const sessionId = searchParams.get("sessionId") ?? storedReport?.sessionId ?? null;
  const [report, setReport] = useState<ReportResponse | null>(
    storedReport?.detail && storedReport.sessionId === sessionId ? storedReport.detail : null,
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(!report);

  useEffect(() => {
    async function loadReport() {
      if (!sessionId) {
        setErrorMessage("当前没有可查看的面试会话，请先完成一次面试。");
        setIsLoading(false);
        return;
      }

      if (report) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await getReport(sessionId);
        setReport(response);
        updateAppSnapshot({
          report: {
            sessionId,
            reportId: response.report_header.session_id,
            overallScore: response.overall_score ?? 0,
            summary: response.final_summary,
            detail: response,
          },
        });
      } catch (error) {
        setErrorMessage(error instanceof Error ? formatBackendError(error.message) : "加载复盘失败，请稍后重试。");
      } finally {
        setIsLoading(false);
      }
    }

    void loadReport();
  }, [report, sessionId]);

  if (!sessionId) {
    return (
      <section className="panel empty-panel">
        <div className="panel-header">
          <div>
            <div className="panel-eyebrow">复盘</div>
            <h2>当前没有可查看的面试</h2>
          </div>
        </div>
        <div className="empty-state">
          <p>请先完成一轮面试，再查看对应的复盘结果。</p>
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

  if (isLoading) {
    return (
      <section className="panel empty-panel">
        <div className="panel-header">
          <div>
            <div className="panel-eyebrow">复盘</div>
            <h2>正在加载报告</h2>
          </div>
        </div>
        <div className="empty-state">
          <p>正在准备完整的评估结果，请稍候。</p>
        </div>
      </section>
    );
  }

  if (!report) {
    return (
      <section className="panel empty-panel">
        <div className="panel-header">
          <div>
            <div className="panel-eyebrow">复盘</div>
            <h2>当前无法显示复盘</h2>
          </div>
        </div>
        <div className="stack-lg">
          <div className="notice error">{errorMessage || "当前无法加载复盘报告。"}</div>
          <div className="actions">
            <button
              className="button primary"
              onClick={() => {
                startTransition(() => {
                  router.push(`/interview?sessionId=${sessionId}`);
                });
              }}
              type="button"
            >
              返回面试
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
              重新开始
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="page-grid">
      <section className="hero-card hero-card-full report-hero">
        <div className="report-score-orb">
          <span>{report.overall_score ?? "--"}</span>
          <small>总分</small>
        </div>
        <div className="report-hero-copy">
          <div className="eyebrow">最终复盘</div>
          <h1>{formatReportTitle(report.report_header.title)}</h1>
          <p className="hero-copy">{report.final_summary}</p>
        </div>
      </section>

      <section className="panel panel-wide">
        <div className="panel-header">
          <div>
            <div className="panel-eyebrow">评分维度</div>
            <h2>分项拆解</h2>
          </div>
          <div className="status-pill success">已完成</div>
        </div>

        <div className="report-dimension-grid">
          {Object.entries(report.dimension_breakdown).map(([dimension, score]) => (
            <article className="dimension-card" key={dimension}>
              <span className="mini-label">{formatDimensionLabel(dimension)}</span>
              <strong>{score}/5</strong>
              <div className="dimension-meter">
                <span className="dimension-fill" style={{ width: `${(score / 5) * 100}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-eyebrow">亮点</div>
            <h2>表现较强的部分</h2>
          </div>
        </div>
        <ul className="report-list">
          {report.strength_cards.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-eyebrow">短板</div>
            <h2>重点补强的部分</h2>
          </div>
        </div>
        <ul className="report-list report-list-warning">
          {report.gap_cards.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-eyebrow">改进动作</div>
            <h2>下一步建议</h2>
          </div>
        </div>
        <ul className="report-list">
          {report.action_items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-eyebrow">追练问题</div>
            <h2>建议继续练习</h2>
          </div>
        </div>
        <ul className="report-list">
          {report.recommended_questions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
