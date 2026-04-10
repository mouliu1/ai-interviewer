import React from "react";
import Link from "next/link";

export function HomeLanding() {
  return (
    <section>
      <h1>AI Interviewer</h1>
      <p>把一次岗位面试拆成可观察、可追问、可复盘的过程。</p>
      <Link href="/prepare">开始一次岗位定制面试</Link>
    </section>
  );
}
