# Homepage Pinned Canvas Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `/` homepage into a white-surface pinned-canvas narrative that uses one abstract AI visual, fast stage handoffs, and a clean `/prepare` entry.

**Architecture:** Keep `/prepare` and the shared shell unchanged, but replace the current multi-section homepage implementation with a smaller homepage container that orchestrates three story stages, a dedicated abstract canvas component, a quieter proof section, and a final entry section. Motion should be scroll-state driven and reduced-motion safe; large text must never depend on blur or long-lived transforms for readability.

**Tech Stack:** Next.js App Router, React 19, TypeScript, CSS Modules, Vitest, Testing Library

---

## File Structure

### Keep

- `frontend/app/page.tsx`
  - Still mounts the homepage container.
- `frontend/app/layout.tsx`
  - Shared shell and navigation remain in place.

### Modify

- `frontend/lib/copy.ts`
  - Add homepage narrative copy arrays and labels so content stays centralized.
- `frontend/lib/copy.test.ts`
  - Assert the new homepage copy exports stay intact.
- `frontend/components/home-landing.tsx`
  - Reduce this file to homepage orchestration, stage state, pinned layout, proof section, and final CTA.
- `frontend/components/home-landing.module.css`
  - Replace the current section-by-section styling with pinned-canvas layout, white-surface narrative styling, and fast readable transitions.
- `frontend/components/home-landing.test.tsx`
  - Replace old four-section assertions with pinned narrative, proof section, CTA, and motion guard coverage.

### Create

- `frontend/components/home-pinned-canvas.tsx`
  - Own the abstract AI canvas visual and stage-driven rendering.
- `frontend/components/home-pinned-canvas.module.css`
  - Own the canvas layers, signal fields, stage highlights, and reduced-motion fallback styling.
- `frontend/components/home-pinned-canvas.test.tsx`
  - Verify the abstract canvas renders the three narrative stages and stage labels.

### Delete

- `frontend/components/home-process-canvas.tsx`
  - Old silver dashboard visual; no longer matches the approved design.
- `frontend/components/home-process-canvas.module.css`
  - Styling tied to the old dashboard visual.
- `frontend/components/home-process-canvas.test.tsx`
  - Test coverage for the replaced component.

---

### Task 1: Freeze the New Homepage Narrative in Copy and Tests

**Files:**
- Modify: `frontend/lib/copy.ts`
- Modify: `frontend/lib/copy.test.ts`
- Modify: `frontend/components/home-landing.test.tsx`

- [ ] **Step 1: Write the failing tests for the new copy contract**

Add these assertions to `frontend/lib/copy.test.ts`:

```ts
import {
  HOME_PINNED_STAGES,
  HOME_PROOF_POINTS,
  HOME_PREPARE_ENTRY,
} from "@/lib/copy";

it("exports the three pinned homepage story stages", () => {
  expect(HOME_PINNED_STAGES).toHaveLength(3);
  expect(HOME_PINNED_STAGES.map((stage) => stage.id)).toEqual([
    "input",
    "focus",
    "followup",
  ]);
});

it("exports proof points and final entry copy for the redesigned homepage", () => {
  expect(HOME_PROOF_POINTS).toHaveLength(3);
  expect(HOME_PREPARE_ENTRY.href).toBe("/prepare");
  expect(HOME_PREPARE_ENTRY.title).toBe("开始准备这场面试");
});
```

Replace the old section expectations in `frontend/components/home-landing.test.tsx` with:

```ts
it("renders the pinned narrative, proof section, and final prepare entry", () => {
  render(<HomeLanding />);

  expect(screen.getByRole("heading", { name: "AI Interviewer" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "输入真实语境" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "为什么这套方式更接近真实面试" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "进入准备工作区" })).toHaveAttribute("href", "/prepare");
});
```

- [ ] **Step 2: Run the targeted tests and verify they fail**

Run:

```bash
cd /home/liumou/my_project/AI_Interviewer/frontend
npm run test -- lib/copy.test.ts components/home-landing.test.tsx
```

Expected: FAIL with missing exports such as `HOME_PINNED_STAGES` and missing new headings in `HomeLanding`.

- [ ] **Step 3: Add the new homepage copy exports**

Update `frontend/lib/copy.ts` with concrete homepage data:

```ts
export const HOME_PINNED_STAGES = [
  {
    id: "input",
    eyebrow: "Stage 01",
    title: "输入真实语境",
    body: "上传简历和目标岗位后，系统先建立这场面试的真实上下文，而不是直接吐出一组泛化题目。",
    canvasLabel: "Context Build",
  },
  {
    id: "focus",
    eyebrow: "Stage 02",
    title: "形成匹配焦点",
    body: "系统把 JD、项目经历和能力信号对齐，决定应该先问什么、继续追什么、风险点落在哪里。",
    canvasLabel: "Fit Focus",
  },
  {
    id: "followup",
    eyebrow: "Stage 03",
    title: "进入追问与复盘闭环",
    body: "回答之后不是结束，而是继续追问并最终沉淀成结构化复盘，直接回到训练闭环。",
    canvasLabel: "Follow-up Loop",
  },
] as const;

export const HOME_PROOF_POINTS = [
  "基于真实简历，而不是随机题库",
  "围绕目标岗位，而不是泛化提问",
  "输出结构复盘，而不是对话结束即结束",
] as const;

export const HOME_PREPARE_ENTRY = {
  title: "开始准备这场面试",
  detail: "真正的上传、岗位设定与准备结果生成都在准备工作区完成。",
  href: "/prepare",
  cta: "进入准备工作区",
} as const;
```

- [ ] **Step 4: Re-run the targeted tests and verify the copy test passes while the landing test still fails**

Run:

```bash
cd /home/liumou/my_project/AI_Interviewer/frontend
npm run test -- lib/copy.test.ts components/home-landing.test.tsx
```

Expected: `lib/copy.test.ts` PASS, `components/home-landing.test.tsx` still FAIL because the page markup is still old.

- [ ] **Step 5: Commit the copy contract**

```bash
git -C /home/liumou/my_project/AI_Interviewer add frontend/lib/copy.ts frontend/lib/copy.test.ts frontend/components/home-landing.test.tsx
git -C /home/liumou/my_project/AI_Interviewer commit -m "test: lock homepage pinned narrative copy"
```

---

### Task 2: Replace the Old Dashboard Canvas with a Stage-Driven Abstract Canvas

**Files:**
- Create: `frontend/components/home-pinned-canvas.tsx`
- Create: `frontend/components/home-pinned-canvas.module.css`
- Create: `frontend/components/home-pinned-canvas.test.tsx`
- Delete: `frontend/components/home-process-canvas.tsx`
- Delete: `frontend/components/home-process-canvas.module.css`
- Delete: `frontend/components/home-process-canvas.test.tsx`

- [ ] **Step 1: Write the failing test for the new abstract canvas**

Create `frontend/components/home-pinned-canvas.test.tsx`:

```tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomePinnedCanvas } from "@/components/home-pinned-canvas";

describe("HomePinnedCanvas", () => {
  it("renders the abstract canvas and all narrative stage labels", () => {
    render(<HomePinnedCanvas activeStage="focus" />);

    expect(screen.getByRole("region", { name: "AI Interviewer pinned canvas" })).toBeInTheDocument();
    expect(screen.getByText("Context Build")).toBeInTheDocument();
    expect(screen.getByText("Fit Focus")).toBeInTheDocument();
    expect(screen.getByText("Follow-up Loop")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the canvas test and verify it fails**

Run:

```bash
cd /home/liumou/my_project/AI_Interviewer/frontend
npm run test -- components/home-pinned-canvas.test.tsx
```

Expected: FAIL because `home-pinned-canvas.tsx` does not exist.

- [ ] **Step 3: Implement the minimal stage-driven canvas**

Create `frontend/components/home-pinned-canvas.tsx`:

```tsx
import React from "react";

import { HOME_PINNED_STAGES } from "@/lib/copy";

import styles from "./home-pinned-canvas.module.css";

type HomePinnedCanvasProps = {
  activeStage: (typeof HOME_PINNED_STAGES)[number]["id"];
};

export function HomePinnedCanvas({ activeStage }: HomePinnedCanvasProps) {
  return (
    <section className={styles.canvas} aria-label="AI Interviewer pinned canvas" data-stage={activeStage}>
      <div className={styles.field} />
      <div className={styles.grid} />
      <div className={styles.core} />
      <div className={styles.rings} aria-hidden="true" />
      <div className={styles.stageRail}>
        {HOME_PINNED_STAGES.map((stage) => (
          <article
            key={stage.id}
            className={styles.stageTag}
            data-active={stage.id === activeStage ? "true" : "false"}
          >
            <span>{stage.eyebrow}</span>
            <strong>{stage.canvasLabel}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
```

Create `frontend/components/home-pinned-canvas.module.css` with a white-surface abstract visual:

```css
.canvas {
  position: relative;
  min-height: 38rem;
  border-radius: 32px;
  background:
    radial-gradient(circle at 50% 40%, rgba(95, 126, 214, 0.18), transparent 18rem),
    linear-gradient(180deg, #fbfcff 0%, #eef3fb 100%);
  border: 1px solid rgba(86, 110, 153, 0.12);
  overflow: hidden;
}

.stageTag[data-active="true"] {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(84, 112, 180, 0.24);
}
```

- [ ] **Step 4: Re-run the canvas test and delete the old component files**

Run:

```bash
cd /home/liumou/my_project/AI_Interviewer/frontend
npm run test -- components/home-pinned-canvas.test.tsx
```

Expected: PASS.

Then delete the old dashboard files:

```bash
rm /home/liumou/my_project/AI_Interviewer/frontend/components/home-process-canvas.tsx
rm /home/liumou/my_project/AI_Interviewer/frontend/components/home-process-canvas.module.css
rm /home/liumou/my_project/AI_Interviewer/frontend/components/home-process-canvas.test.tsx
```

- [ ] **Step 5: Commit the canvas replacement**

```bash
git -C /home/liumou/my_project/AI_Interviewer add frontend/components/home-pinned-canvas.tsx frontend/components/home-pinned-canvas.module.css frontend/components/home-pinned-canvas.test.tsx
git -C /home/liumou/my_project/AI_Interviewer add -u frontend/components/home-process-canvas.tsx frontend/components/home-process-canvas.module.css frontend/components/home-process-canvas.test.tsx
git -C /home/liumou/my_project/AI_Interviewer commit -m "feat: replace homepage process dashboard with pinned canvas"
```

---

### Task 3: Rebuild `HomeLanding` as a Pinned Narrative Container

**Files:**
- Modify: `frontend/components/home-landing.tsx`
- Modify: `frontend/components/home-landing.module.css`
- Modify: `frontend/components/home-landing.test.tsx`
- Use: `frontend/components/home-pinned-canvas.tsx`

- [ ] **Step 1: Write the failing landing test for pinned-stage behavior**

Add this test to `frontend/components/home-landing.test.tsx`:

```tsx
it("marks the pinned narrative shell and starts from the input stage", () => {
  render(<HomeLanding />);

  expect(screen.getByTestId("pinned-narrative")).toHaveAttribute("data-active-stage", "input");
  expect(screen.getByTestId("story-stage-input")).toHaveAttribute("data-active", "true");
});
```

- [ ] **Step 2: Run the landing test and verify it fails**

Run:

```bash
cd /home/liumou/my_project/AI_Interviewer/frontend
npm run test -- components/home-landing.test.tsx
```

Expected: FAIL because the current landing still renders the old multi-section structure.

- [ ] **Step 3: Rewrite `HomeLanding` around one pinned narrative shell**

Replace the old arrays, `getStageProgress`, and multi-section JSX in `frontend/components/home-landing.tsx` with a smaller stage-driven container:

```tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { HomePinnedCanvas } from "@/components/home-pinned-canvas";
import { HOME_PINNED_STAGES } from "@/lib/copy";

import styles from "./home-landing.module.css";

export function resolveActiveStage(progress: number) {
  if (progress < 0.34) return "input";
  if (progress < 0.67) return "focus";
  return "followup";
}

export function HomeLanding() {
  const storyRef = useRef<HTMLElement>(null);
  const [activeStage, setActiveStage] = useState<(typeof HOME_PINNED_STAGES)[number]["id"]>("input");

  useEffect(() => {
    const node = storyRef.current;
    if (!node) return;

    const sync = () => {
      const rect = node.getBoundingClientRect();
      const travelled = Math.min(Math.max((window.innerHeight - rect.top) / (rect.height || 1), 0), 1);
      setActiveStage(resolveActiveStage(travelled));
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  return (
    <div className={styles.page}>
      <section ref={storyRef} className={styles.storyStage} data-testid="pinned-narrative" data-active-stage={activeStage}>
        <div className={styles.storyCopy}>
          <p className={styles.kicker}>岗位定制 AI 面试官</p>
          <h1>AI Interviewer</h1>
          {HOME_PINNED_STAGES.map((stage) => (
            <article key={stage.id} data-testid={`story-stage-${stage.id}`} data-active={stage.id === activeStage ? "true" : "false"}>
              <span>{stage.eyebrow}</span>
              <h2>{stage.title}</h2>
              <p>{stage.body}</p>
            </article>
          ))}
        </div>
        <div className={styles.storyCanvas}>
          <HomePinnedCanvas activeStage={activeStage} />
        </div>
      </section>
```

- [ ] **Step 4: Replace the layout CSS with a pinned white-surface narrative**

Rewrite `frontend/components/home-landing.module.css` around the new structure:

```css
.storyStage {
  position: relative;
  display: grid;
  grid-template-columns: minmax(20rem, 30rem) minmax(0, 1fr);
  min-height: 260svh;
  gap: clamp(2rem, 5vw, 5rem);
}

.storyCopy,
.storyCanvas {
  position: sticky;
  top: 7rem;
}

.storyCopy article {
  opacity: 0.22;
  transform: translateY(1.25rem);
  transition: opacity 140ms ease, transform 140ms ease;
}

.storyCopy article[data-active="true"] {
  opacity: 1;
  transform: translateY(0);
}
```

- [ ] **Step 5: Re-run the landing test and commit the pinned shell**

Run:

```bash
cd /home/liumou/my_project/AI_Interviewer/frontend
npm run test -- components/home-landing.test.tsx components/home-pinned-canvas.test.tsx
```

Expected: PASS.

Commit:

```bash
git -C /home/liumou/my_project/AI_Interviewer add frontend/components/home-landing.tsx frontend/components/home-landing.module.css frontend/components/home-landing.test.tsx
git -C /home/liumou/my_project/AI_Interviewer commit -m "feat: rebuild homepage as pinned canvas narrative"
```

---

### Task 4: Add the Quiet Proof Section, Final Entry, and Motion Safety

**Files:**
- Modify: `frontend/components/home-landing.tsx`
- Modify: `frontend/components/home-landing.module.css`
- Modify: `frontend/components/home-landing.test.tsx`

- [ ] **Step 1: Write failing tests for proof content and motion safety**

Add these tests to `frontend/components/home-landing.test.tsx`:

```tsx
it("renders the quieter proof section with all proof points", () => {
  render(<HomeLanding />);

  expect(screen.getByRole("heading", { name: "为什么这套方式更接近真实面试" })).toBeInTheDocument();
  expect(screen.getByText("基于真实简历，而不是随机题库")).toBeInTheDocument();
  expect(screen.getByText("围绕目标岗位，而不是泛化提问")).toBeInTheDocument();
  expect(screen.getByText("输出结构复盘，而不是对话结束即结束")).toBeInTheDocument();
});

it("does not rely on blur-based section reveals", () => {
  render(<HomeLanding />);
  expect(screen.getByTestId("pinned-narrative")).toHaveAttribute("data-motion-mode", "sharp");
});
```

- [ ] **Step 2: Run the landing test and verify it fails**

Run:

```bash
cd /home/liumou/my_project/AI_Interviewer/frontend
npm run test -- components/home-landing.test.tsx
```

Expected: FAIL because the proof section heading and `data-motion-mode="sharp"` are not rendered yet.

- [ ] **Step 3: Add proof and final entry markup to `HomeLanding`**

Extend the JSX in `frontend/components/home-landing.tsx`:

```tsx
      </section>

      <section className={styles.proofStage}>
        <div className={styles.proofIntro}>
          <p className={styles.sectionLabel}>Transition Proof</p>
          <h2>为什么这套方式更接近真实面试</h2>
        </div>
        <div className={styles.proofList}>
          {HOME_PROOF_POINTS.map((point) => (
            <p key={point}>{point}</p>
          ))}
        </div>
      </section>

      <section className={styles.prepareEntry}>
        <div>
          <p className={styles.sectionLabel}>Prepare Entry</p>
          <h2>{HOME_PREPARE_ENTRY.title}</h2>
          <p>{HOME_PREPARE_ENTRY.detail}</p>
        </div>
        <Link className={styles.primaryAction} href={HOME_PREPARE_ENTRY.href}>
          {HOME_PREPARE_ENTRY.cta}
        </Link>
      </section>
    </div>
  );
}
```

Set the container attribute in the opening section:

```tsx
<section
  ref={storyRef}
  className={styles.storyStage}
  data-testid="pinned-narrative"
  data-active-stage={activeStage}
  data-motion-mode="sharp"
>
```

- [ ] **Step 4: Add proof/entry styling and reduced-motion support**

Add the corresponding CSS:

```css
.proofStage,
.prepareEntry {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: clamp(1.5rem, 4vw, 4rem);
  padding: clamp(2rem, 5vw, 4rem) 0;
}

.prepareEntry {
  align-items: center;
  border-top: 1px solid rgba(74, 92, 128, 0.12);
}

@media (prefers-reduced-motion: reduce) {
  .storyCopy article,
  .storyCanvas,
  .proofStage,
  .prepareEntry {
    transition: none;
    transform: none;
  }
}
```

- [ ] **Step 5: Re-run homepage tests and commit the finished structure**

Run:

```bash
cd /home/liumou/my_project/AI_Interviewer/frontend
npm run test -- components/home-landing.test.tsx lib/copy.test.ts components/home-pinned-canvas.test.tsx
```

Expected: PASS.

Commit:

```bash
git -C /home/liumou/my_project/AI_Interviewer add frontend/components/home-landing.tsx frontend/components/home-landing.module.css frontend/components/home-landing.test.tsx
git -C /home/liumou/my_project/AI_Interviewer commit -m "feat: add homepage proof and prepare entry sections"
```

---

### Task 5: Run Full Frontend Verification and Restore the Review Server

**Files:**
- Verify only: `frontend/app/page.tsx`, `frontend/components/*`, `frontend/lib/copy.ts`

- [ ] **Step 1: Run the full frontend test suite**

Run:

```bash
cd /home/liumou/my_project/AI_Interviewer/frontend
npm run test
```

Expected: PASS for the full Vitest suite.

- [ ] **Step 2: Run a production build**

Run:

```bash
cd /home/liumou/my_project/AI_Interviewer/frontend
npm run build
```

Expected: PASS with `/`, `/prepare`, `/interview`, and `/report` building successfully.

- [ ] **Step 3: Start the stable review server instead of `next dev`**

Run:

```bash
cd /home/liumou/my_project/AI_Interviewer/frontend
npm run start -- --hostname 127.0.0.1 --port 3003
```

Expected: Next production server starts on `http://127.0.0.1:3003`.

- [ ] **Step 4: Verify the homepage and prepare entry endpoints**

Run:

```bash
curl --noproxy '*' -I http://127.0.0.1:3003/
curl --noproxy '*' -I http://127.0.0.1:3003/prepare
```

Expected:

```txt
HTTP/1.1 200 OK
```

for both routes.

- [ ] **Step 5: Commit any final polish if needed**

```bash
git -C /home/liumou/my_project/AI_Interviewer status --short
```

If verification-only, do not create another commit. If small verification-triggered fixes were required, commit them with:

```bash
git -C /home/liumou/my_project/AI_Interviewer add frontend/components/home-landing.tsx frontend/components/home-landing.module.css frontend/components/home-pinned-canvas.tsx frontend/components/home-pinned-canvas.module.css frontend/components/home-landing.test.tsx frontend/components/home-pinned-canvas.test.tsx frontend/lib/copy.ts frontend/lib/copy.test.ts
git -C /home/liumou/my_project/AI_Interviewer commit -m "fix: polish pinned canvas homepage review pass"
```
