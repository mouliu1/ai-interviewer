"use client";

import React, { useEffect, useRef, useState } from "react";

import { HomePinnedCanvas } from "@/components/home-pinned-canvas";
import { HOME_PINNED_STAGES } from "@/lib/copy";

import styles from "./home-landing.module.css";

type HomePinnedStageId = (typeof HOME_PINNED_STAGES)[number]["id"];
export type NarrativeStageRect = {
  top: number;
  height: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getNarrativeProgress(rect: NarrativeStageRect, viewportHeight: number) {
  const safeViewportHeight = viewportHeight || 1;

  if (rect.height <= 0) {
    return 0;
  }

  const start = safeViewportHeight * 0.12;
  const track = Math.max(rect.height - safeViewportHeight * 0.72, 1);

  return clamp((start - rect.top) / track, 0, 1);
}

export function resolveActiveStage(progress: number): HomePinnedStageId {
  if (progress < 0.34) {
    return "input";
  }

  if (progress < 0.67) {
    return "focus";
  }

  return "followup";
}

export function HomeLanding() {
  const narrativeRef = useRef<HTMLElement>(null);
  const [activeStage, setActiveStage] = useState<HomePinnedStageId>("input");

  useEffect(() => {
    const narrative = narrativeRef.current;

    if (!narrative) {
      return;
    }

    let frameId = 0;

    const syncStage = () => {
      const rect = narrative.getBoundingClientRect();
      const nextStage = resolveActiveStage(
        getNarrativeProgress(
          {
            top: rect.top,
            height: rect.height,
          },
          window.innerHeight,
        ),
      );
      setActiveStage((currentStage) => (currentStage === nextStage ? currentStage : nextStage));
    };

    const scheduleSync = () => {
      cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(syncStage);
    };

    syncStage();

    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
    };
  }, []);

  return (
    <section className={styles.page}>
      <section
        className={styles.narrative}
        ref={narrativeRef}
        data-testid="pinned-narrative"
        data-active-stage={activeStage}
      >
        <div className={styles.layout}>
          <div className={styles.storyColumn}>
            <div className={styles.storySticky}>
              <div className={styles.storyIntro}>
                <p className={styles.eyebrow}>Pinned Narrative</p>
                <h1>AI Interviewer</h1>
                <p className={styles.lead}>
                  一个围绕真实简历、目标岗位和追问节奏展开的面试训练容器。首页只保留这条叙事主线，让准备、聚焦和复盘如何衔接一眼可读。
                </p>
              </div>

              <div className={styles.stageList}>
                {HOME_PINNED_STAGES.map((stage) => {
                  const isActive = stage.id === activeStage;

                  return (
                    <article
                      key={stage.id}
                      className={styles.stageCard}
                      aria-current={isActive ? "step" : undefined}
                      data-active={isActive ? "true" : "false"}
                      data-testid={`story-stage-${stage.id}`}
                    >
                      <p className={styles.stageEyebrow}>{stage.eyebrow}</p>
                      <h2>{stage.title}</h2>
                      <p className={styles.stageBody}>{stage.body}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={styles.canvasColumn}>
            <div className={styles.canvasSticky}>
              <HomePinnedCanvas activeStage={activeStage} />
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
