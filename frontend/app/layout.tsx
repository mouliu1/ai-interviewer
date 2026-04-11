import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteNav } from "@/components/site-nav";

import "./globals.css";

export const metadata: Metadata = {
  title: "AI Interviewer",
  description: "围绕目标岗位完成准备、模拟面试与结构化复盘。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="site-shell">
          <header className="site-header">
            <div className="brand-block">
              <div className="brand-orb" />
              <div>
                <div className="site-mark">AI Interviewer</div>
                <p className="site-subtitle">岗位定制 AI 面试官</p>
              </div>
            </div>
            <div className="header-controls">
              <div className="header-status">
                <span className="header-status-dot" />
                <span>工作区就绪</span>
              </div>
              <SiteNav />
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
