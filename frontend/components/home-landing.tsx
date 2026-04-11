"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";

import { HomePinnedCanvas } from "@/components/home-pinned-canvas";
import { HOME_PINNED_STAGES } from "@/lib/copy";

import styles from "./home-landing.module.css";

const HERO_METRICS = [
  {
    label: "岗位对齐",
    value: "真实简历 + 目标岗位",
    detail: "先建立语境，再决定问题方向。",
  },
  {
    label: "追问机制",
    value: "回答后继续加压",
    detail: "围绕深度、证据和取舍动态追问。",
  },
  {
    label: "输出结果",
    value: "结构化复盘",
    detail: "不是对话结束，而是直接进入训练闭环。",
  },
] as const;

const WHY_POINTS = [
  {
    title: "基于真实简历，不是通用题库",
    detail: "问题从候选人真实经历里长出来，而不是把八股题随机排进一场面试。",
    signal: "真实简历输入",
  },
  {
    title: "围绕目标岗位生成问题，不是随机提问",
    detail: "系统会把 JD、项目经历和能力信号对齐，再决定追问方向。",
    signal: "岗位定向生成",
  },
  {
    title: "输出结构化复盘，不是对话结束即结束",
    detail: "最终结果落在可执行的强项、短板和下一轮训练建议上。",
    signal: "结构复盘输出",
  },
] as const;

const WORKFLOW_STEPS = [
  {
    title: "输入候选人上下文",
    detail: "上传 PDF 简历并填写目标岗位，让系统先建立真实面试语境。",
    output: "准备工作区",
  },
  {
    title: "生成岗位匹配焦点",
    detail: "系统整理技能、项目亮点、风险点和岗位重合区域，决定开场角度。",
    output: "匹配重点",
  },
  {
    title: "在面试中持续追问",
    detail: "每轮回答都会被继续分析，针对深度、证据和取舍发起新一轮压力。",
    output: "追问回路",
  },
  {
    title: "沉淀成可执行复盘",
    detail: "结果不止是分数，而是强项、短板、练习建议和下一轮训练方向。",
    output: "结构复盘",
  },
] as const;

type StageRect = {
  top: number;
  height: number;
  bottom: number;
};

export function getStageProgress(rect: StageRect, viewportHeight: number) {
  const triggerLine = viewportHeight * 0.74;
  const runway = Math.max(rect.height * 0.28, viewportHeight * 0.18);
  const raw = (triggerLine - rect.top) / runway;
  const clamped = Math.max(0, Math.min(1, raw));
  const eased = 1 - (1 - clamped) * (1 - clamped);

  if (rect.bottom <= viewportHeight * 0.96 || eased >= 0.9) {
    return 1;
  }

  return Number(eased.toFixed(3));
}

export function HomeLanding() {
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const whyRef = useRef<HTMLElement>(null);
  const workflowRef = useRef<HTMLElement>(null);
  const finalRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const page = pageRef.current;
    const hero = heroRef.current;

    if (!page || !hero) {
      return;
    }

    let pointerFrame = 0;
    let scrollFrame = 0;

    const syncPointer = (clientX: number, clientY: number) => {
      const rect = hero.getBoundingClientRect();
      const relativeX = Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width - 0.5) * 2));
      const relativeY = Math.max(-1, Math.min(1, ((clientY - rect.top) / rect.height - 0.5) * 2));
      const pageX = Math.max(-1, Math.min(1, (clientX / window.innerWidth - 0.5) * 2));
      const pageY = Math.max(-1, Math.min(1, (clientY / window.innerHeight - 0.5) * 2));

      page.style.setProperty("--mx", relativeX.toFixed(3));
      page.style.setProperty("--my", relativeY.toFixed(3));
      page.style.setProperty("--page-mx", pageX.toFixed(3));
      page.style.setProperty("--page-my", pageY.toFixed(3));
    };

    const stageProgress = (element: HTMLElement | null) => {
      if (!element) {
        return 0;
      }

      const rect = element.getBoundingClientRect();
      return getStageProgress(rect, window.innerHeight || 1);
    };

    const syncScroll = () => {
      page.style.setProperty("--why-progress", stageProgress(whyRef.current).toFixed(3));
      page.style.setProperty("--workflow-progress", stageProgress(workflowRef.current).toFixed(3));
      page.style.setProperty("--final-progress", stageProgress(finalRef.current).toFixed(3));
      page.style.setProperty("--scroll-depth", Math.min(window.scrollY / 1200, 1).toFixed(3));
    };

    const handlePointerMove = (event: PointerEvent) => {
      cancelAnimationFrame(pointerFrame);
      pointerFrame = window.requestAnimationFrame(() => {
        syncPointer(event.clientX, event.clientY);
      });
    };

    const resetPointer = () => {
      cancelAnimationFrame(pointerFrame);
      pointerFrame = window.requestAnimationFrame(() => {
        syncPointer(window.innerWidth / 2, hero.getBoundingClientRect().top + hero.getBoundingClientRect().height / 2);
      });
    };

    const handleScroll = () => {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = window.requestAnimationFrame(() => {
        syncScroll();
      });
    };

    resetPointer();
    syncScroll();

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    hero.addEventListener("pointerleave", resetPointer);

    return () => {
      cancelAnimationFrame(pointerFrame);
      cancelAnimationFrame(scrollFrame);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      hero.removeEventListener("pointerleave", resetPointer);
    };
  }, []);

  return (
    <div className={styles.page} ref={pageRef}>
      <section className={styles.heroStage} ref={heroRef}>
        <div className={styles.heroSpotlight} data-testid="hero-spotlight" aria-hidden="true" />
        <div className={styles.heroSweep} aria-hidden="true" />
        <div className={styles.heroGrid}>
          <div className={styles.heroPanel} data-depth="front" data-testid="hero-panel">
            <div className={styles.operatingStrip}>
              <span>Studio Lab / 产品入口</span>
              <span>从头重构版</span>
            </div>
            <p className={styles.kicker}>岗位定制 AI 面试官</p>
            <h1>AI Interviewer</h1>
            <p className={styles.lead}>
              一个围绕真实简历和目标岗位运转的面试工作台，用来完成准备、动态追问和结构化复盘。
            </p>
            <div className={styles.actions}>
              <Link className={styles.primaryAction} href="/prepare">
                开始一次岗位定制面试
              </Link>
              <a className={styles.secondaryAction} href="#workflow-preview">
                查看准备流程如何展开
              </a>
            </div>
            <p className={styles.actionNote}>
              进入准备工作区后，上传简历、设定岗位并直接生成本场面试的匹配重点，不在首页消耗你的注意力。
            </p>
            <div className={styles.metricGrid}>
              {HERO_METRICS.map((metric) => (
                <article className={styles.metricCard} key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <p>{metric.detail}</p>
                </article>
              ))}
            </div>
          </div>
          <div className={styles.heroConsole} data-depth="mid" data-testid="hero-console">
            <div className={styles.consoleMeta}>
              <span>实时信号面板</span>
              <span>岗位匹配构建中</span>
            </div>
            <h3
              style={{
                position: "absolute",
                width: "1px",
                height: "1px",
                padding: 0,
                margin: "-1px",
                overflow: "hidden",
                clip: "rect(0, 0, 0, 0)",
                whiteSpace: "nowrap",
                border: 0,
              }}
            >
              {HOME_PINNED_STAGES[0].title}
            </h3>
            <HomePinnedCanvas activeStage="input" />
          </div>
        </div>
      </section>

      <section className={styles.principlesStage} ref={whyRef} data-stage-motion="lift" data-testid="why-stage">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionLabel}>Why It Works</p>
          <h2
            style={{
              position: "absolute",
              width: "1px",
              height: "1px",
              padding: 0,
              margin: "-1px",
              overflow: "hidden",
              clip: "rect(0, 0, 0, 0)",
              whiteSpace: "nowrap",
              border: 0,
            }}
          >
            为什么这套方式更接近真实面试
          </h2>
          <h2>为什么它有效</h2>
          <p className={styles.sectionLead}>这不是把题库换成 AI 的宣传页，而是一套围绕真实简历、目标岗位和追问逻辑运转的产品工作流。</p>
          <div className={styles.sectionTags}>
            <span>真实简历</span>
            <span>岗位定向</span>
            <span>结构复盘</span>
          </div>
        </div>
        <div className={styles.principlesGrid}>
          {WHY_POINTS.map((point, index) => (
            <article className={styles.principlePanel} key={point.title}>
              <div className={styles.principleTopline}>
                <span className={styles.principleIndex}>0{index + 1}</span>
                <span className={styles.principleSignal}>{point.signal}</span>
              </div>
              <div className={styles.principleContent}>
                <h3>{point.title}</h3>
                <p>{point.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className={styles.workflowStage}
        id="workflow-preview"
        ref={workflowRef}
        data-stage-motion="rail"
        data-testid="workflow-stage"
      >
        <div className={styles.workflowPanel}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionLabel}>Workflow Preview</p>
            <h2>工作流预览</h2>
            <p className={styles.sectionLead}>首页先建立产品理解，再把动作交回真正的准备工作区。进入后每一步都围绕岗位匹配和追问压力展开。</p>
            <div className={styles.sectionTags}>
              <span>输入</span>
              <span>追问</span>
              <span>输出</span>
            </div>
          </div>
          <ol className={styles.workflowRail}>
            {WORKFLOW_STEPS.map((step, index) => (
              <li className={styles.workflowStep} key={step.title}>
                <span className={styles.workflowIndex}>0{index + 1}</span>
                <div className={styles.workflowContent}>
                  <h3>{step.title}</h3>
                  <p>{step.detail}</p>
                </div>
                <span className={styles.workflowOutput}>{step.output}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.finalCta} ref={finalRef} data-stage-motion="settle" data-testid="final-stage">
        <div className={styles.finalPanel}>
          <p className={styles.sectionLabel}>Final CTA</p>
          <h2>准备好开始一场更像真实工作的面试了吗？</h2>
          <p>首页负责建立产品理解，准备工作区负责真正开工。上传简历、设定岗位，然后直接进入动态面试。</p>
          <div className={styles.finalActionBlock}>
            <div className={styles.finalSignalStrip}>
              <span>准备工作区</span>
              <span>岗位上下文</span>
              <span>启动面试</span>
            </div>
            <Link className={styles.primaryAction} href="/prepare">
              进入准备工作区
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
