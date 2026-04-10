import { Suspense } from "react";

import { InterviewFlow } from "@/components/interview-flow";

export default function InterviewPage() {
  return (
    <Suspense fallback={<section className="panel empty-panel"><div className="empty-state"><p>正在加载面试页面...</p></div></section>}>
      <InterviewFlow />
    </Suspense>
  );
}
