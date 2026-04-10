import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { NAV_ITEMS } from "@/lib/copy";

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
            <nav className="top-nav">
              {NAV_ITEMS.map((item) => (
                <Link href={item.href} key={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
