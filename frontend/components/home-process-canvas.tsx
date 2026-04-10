import React from "react";
import styles from "./home-process-canvas.module.css";

const PROCESS_STAGES = [
  {
    label: "Resume Parse",
    detail: "skills, highlights, risk points",
  },
  {
    label: "Job Fit Mapping",
    detail: "role focus, gaps, opening angle",
  },
  {
    label: "Dynamic Follow-up",
    detail: "depth, evidence, tradeoff pressure",
  },
  {
    label: "Structured Review",
    detail: "strengths, gaps, next drills",
  },
] as const;

export function HomeProcessCanvas() {
  return (
    <div className={styles.canvas} aria-label="AI interview process canvas">
      <div className={styles.frame}>
        <div className={styles.header}>
          <span>AI Interviewer</span>
          <span>Silver Precision</span>
        </div>
        <div className={styles.stageList}>
          {PROCESS_STAGES.map((stage, index) => (
            <article className={styles.stage} key={stage.label}>
              <div className={styles.stageIndex}>0{index + 1}</div>
              <div>
                <h3>{stage.label}</h3>
                <p>{stage.detail}</p>
              </div>
              <div className={styles.signal} aria-hidden="true" />
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
