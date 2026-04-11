import React from "react";

import { HOME_PINNED_STAGES } from "@/lib/copy";

import styles from "./home-pinned-canvas.module.css";

export type HomePinnedStageId = (typeof HOME_PINNED_STAGES)[number]["id"];

type HomePinnedCanvasProps = {
  activeStage: HomePinnedStageId;
};

export function HomePinnedCanvas({ activeStage }: HomePinnedCanvasProps) {
  const activeStageData = HOME_PINNED_STAGES.find((stage) => stage.id === activeStage) ?? HOME_PINNED_STAGES[0];

  return (
    <section className={styles.canvas} aria-label="AI Interviewer pinned canvas">
      <div className={styles.surface} data-active-stage={activeStageData.id}>
        <div className={styles.grid} aria-hidden="true" />
        <div className={styles.orbLarge} aria-hidden="true" />
        <div className={styles.orbSmall} aria-hidden="true" />

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

        <div className={styles.flow} aria-hidden="true">
          <span className={styles.flowLine} />
          <span className={styles.flowDot} />
          <span className={styles.flowDot} />
          <span className={styles.flowDot} />
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

        <div className={styles.abstractCluster} aria-hidden="true">
          <span className={styles.ribbon} />
          <span className={styles.tileLarge} />
          <span className={styles.tileSmall} />
        </div>
      </div>
    </section>
  );
}
