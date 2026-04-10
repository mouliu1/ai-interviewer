import { Suspense } from "react";

import { ReportFlow } from "@/components/report-flow";

export default function ReportPage() {
  return (
    <Suspense fallback={<section className="panel empty-panel"><div className="empty-state"><p>正在加载复盘页面...</p></div></section>}>
      <ReportFlow />
    </Suspense>
  );
}
