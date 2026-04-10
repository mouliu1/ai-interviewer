import React from "react";
import Link from "next/link";

import { HomeProcessCanvas } from "@/components/home-process-canvas";

import styles from "./home-landing.module.css";

const WHY_POINTS = [
  {
    title: "基于真实简历，不是通用题库",
    detail: "问题从候选人真实经历里长出来，而不是把八股题随机排进一场面试。",
  },
  {
    title: "围绕目标岗位生成问题，不是随机提问",
    detail: "系统会把 JD、项目经历和能力信号对齐，再决定追问方向。",
  },
  {
    title: "输出结构化复盘，不是对话结束即结束",
    detail: "最终结果落在可执行的强项、短板和下一轮训练建议上。",
  },
] as const;

const WORKFLOW_STEPS = [
  "上传 PDF 简历并填写目标岗位",
  "生成岗位匹配重点与开场问题",
  "在面试中持续追问和拉深",
  "结束后得到结构化复盘报告",
] as const;

export function HomeLanding() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>岗位定制 AI 面试官</p>
          <h1>把一次岗位面试拆成可观察、可追问、可复盘的过程。</h1>
          <p className={styles.lead}>
            从真实简历与目标岗位出发，让准备、追问和复盘都变成一条清晰可见的 AI 工作流。
          </p>
          <div className={styles.actions}>
            <Link className={styles.primaryAction} href="/prepare">
              开始一次岗位定制面试
            </Link>
            <a className={styles.secondaryAction} href="#workflow-preview">
              查看工作流如何展开
            </a>
          </div>
        </div>
        <HomeProcessCanvas />
      </section>

      <section className={styles.storySection}>
        <p className={styles.sectionLabel}>Why It Works</p>
        <h2>为什么它有效</h2>
        <div className={styles.pointList}>
          {WHY_POINTS.map((point) => (
            <article className={styles.point} key={point.title}>
              <h3>{point.title}</h3>
              <p>{point.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.storySection} id="workflow-preview">
        <p className={styles.sectionLabel}>Workflow Preview</p>
        <h2>工作流预览</h2>
        <ol className={styles.workflowList}>
          {WORKFLOW_STEPS.map((step) => (
            <li className={styles.workflowStep} key={step}>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.finalCta}>
        <p className={styles.sectionLabel}>Final CTA</p>
        <h2>准备好开始一场更像真实工作的面试了吗？</h2>
        <p>在准备页中完成上传、岗位设置与面试启动。</p>
        <Link className={styles.primaryAction} href="/prepare">
          进入准备页
        </Link>
      </section>
    </div>
  );
}
