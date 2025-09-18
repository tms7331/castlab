"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type TabConfig = {
  label: string;
  href: string;
  isActive: (pathname: string) => boolean;
  activeClassName: string;
  inactiveClassName: string;
};

const tabs: TabConfig[] = [
  {
    label: "Experiments",
    href: "/",
    isActive: (pathname) => pathname === "/" || pathname.startsWith("/experiments"),
    activeClassName:
      "bg-[linear-gradient(130deg,#18065b_0%,#3a27a8_55%,#5534d4_100%)] text-white shadow-lg shadow-[rgba(24,6,91,0.35)] border border-[#3a27a8]/70 scale-105 ring-2 ring-white/80 ring-offset-2 ring-offset-white",
    inactiveClassName:
      "bg-[linear-gradient(130deg,#18065b_0%,#261275_85%,#1d0d5f_100%)] text-white/95 border border-[#18065b]/40",
  },
  {
    label: "Completed",
    href: "/completed-experiments",
    isActive: (pathname) => pathname.startsWith("/completed-experiments"),
    activeClassName:
      "bg-[linear-gradient(135deg,#c9bbff_0%,#a995ff_60%,#8d79f6_100%)] text-white shadow-lg shadow-[rgba(137,121,246,0.35)] border border-[#9f8dff]/60 scale-105 ring-2 ring-white/70 ring-offset-2 ring-offset-white",
    inactiveClassName:
      "bg-[linear-gradient(135deg,#e1d9ff_0%,#cfc0ff_100%)] text-[#2d1c6a] border border-[#c9befc]/45",
  },
  {
    label: "About",
    href: "/about",
    isActive: (pathname) => pathname.startsWith("/about"),
    activeClassName:
      "bg-[linear-gradient(140deg,rgba(255,255,255,0.95)_0%,rgba(243,236,255,0.92)_60%,rgba(228,220,255,0.9)_100%)] text-foreground border border-primary/60 shadow-lg shadow-primary/20 scale-105 ring-2 ring-primary/30 ring-offset-2 ring-offset-white",
    inactiveClassName:
      "bg-[linear-gradient(140deg,rgba(255,255,255,0.88)_0%,rgba(247,243,255,0.88)_100%)] text-foreground border border-border backdrop-blur",
  },
];

const baseClasses =
  "min-w-[96px] rounded-md px-4 py-2 text-sm font-semibold transition-all duration-150 touch-manipulation active:scale-95 active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

export function NavigationPills() {
  const pathname = usePathname() ?? "/";

  return (
    <nav className="mb-4 flex flex-wrap justify-center gap-2" aria-label="Primary">
      {tabs.map((tab) => {
        const active = tab.isActive(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              baseClasses,
              active ? tab.activeClassName : tab.inactiveClassName,
              !active && "opacity-95"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
