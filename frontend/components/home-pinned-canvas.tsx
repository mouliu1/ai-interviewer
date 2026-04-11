import React from "react";

import { HOME_PINNED_STAGES } from "@/lib/copy";

import styles from "./home-pinned-canvas.module.css";

export type HomePinnedStageId = (typeof HOME_PINNED_STAGES)[number]["id"];

type HomePinnedCanvasProps = {
  activeStage: HomePinnedStageId;
};

const SCENE_DETAILS: Record<HomePinnedStageId, { title: string; signal: string; metric: string; note: string }> = {
  input: {
    title: "上下文建模",
    signal: "简历片段、岗位要求与经历信号开始汇聚",
    metric: "Context Intake",
    note: "系统先建立输入语境，再决定后续聚焦方向。",
  },
  focus: {
    title: "焦点对齐",
    signal: "岗位重点、能力缺口和风险点被压缩到同一视野",
    metric: "Focus Match",
    note: "信号收束成匹配焦点，准备进入真正的追问压力。",
  },
  followup: {
    title: "追问回路",
    signal: "回答、追问与复盘输出进入闭环回路",
    metric: "Loop Output",
    note: "系统不只给问题，而是持续把回答推回训练闭环。",
  },
};

const SCENE_ORDER = ["input", "focus", "followup"] as const;

export function HomePinnedCanvas({ activeStage }: HomePinnedCanvasProps) {
  const activeStageData = HOME_PINNED_STAGES.find((stage) => stage.id === activeStage) ?? HOME_PINNED_STAGES[0];

  return (
    <section className={styles.canvas} aria-label="AI Interviewer pinned canvas">
      <div className={styles.surface} data-active-stage={activeStageData.id}>
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <span className={styles.kicker}>Pinned canvas</span>
            <p className={styles.title}>Stage-driven interview framing</p>
          </div>
          <div className={styles.activeBadge}>
            <span className={styles.activeLabel}>Active stage</span>
            <strong>{activeStageData.canvasLabel}</strong>
          </div>
        </header>

        <div className={styles.sceneStack} aria-hidden="true">
          {SCENE_ORDER.map((sceneId) => {
            const scene = SCENE_DETAILS[sceneId];
            const isActive = sceneId === activeStageData.id;

            return (
              <section
                key={sceneId}
                className={`${styles.scene} ${styles[`scene${sceneId[0].toUpperCase()}${sceneId.slice(1)}` as keyof typeof styles]}`}
                data-testid={`canvas-scene-${sceneId}`}
                data-active={isActive ? "true" : "false"}
              >
                <div className={styles.sceneGlow} />
                <div className={styles.sceneGrid} />
                <div className={styles.sceneCore} />
                <div className={styles.sceneHud}>
                  <span>{scene.metric}</span>
                  <strong>{scene.title}</strong>
                  <p>{scene.signal}</p>
                </div>
                <div className={styles.sceneNote}>{scene.note}</div>
                <div className={styles.sceneSignalRail}>
                  <span />
                  <span />
                  <span />
                </div>
              </section>
            );
          })}
        </div>

        <ol className={styles.stageRail}>
          {HOME_PINNED_STAGES.map((stage, index) => {
            const isActive = stage.id === activeStageData.id;

            return (
              <li
                key={stage.id}
                className={styles.stageItem}
                data-active={isActive ? "true" : "false"}
                aria-current={isActive ? "step" : undefined}
              >
                <span className={styles.stageIndex}>{String(index + 1).padStart(2, "0")}</span>
                <div className={styles.stageCopy}>
                  <p className={styles.stageEyebrow}>{stage.eyebrow}</p>
                  <h3 className={styles.stageLabel}>{stage.canvasLabel}</h3>
                  <p className={styles.stageBody}>{stage.body}</p>
                </div>
                <span className={styles.stageAccent} aria-hidden="true" />
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
