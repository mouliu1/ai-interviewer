"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/lib/copy";

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="top-nav" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const isActive = isActivePath(pathname, item.href);
        return (
          <Link aria-current={isActive ? "page" : undefined} href={item.href} key={item.href}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
