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
  activeIndicatorClassName?: string;
};

const tabs: TabConfig[] = [
  {
    label: "Experiments",
    href: "/",
    isActive: (pathname) => pathname === "/" || pathname.startsWith("/experiments"),
    activeClassName:
      "bg-[linear-gradient(130deg,#1d0d5f_0%,#3421a0_55%,#5534d4_100%)] text-white shadow-[0_12px_30px_rgba(24,6,91,0.42)] border border-[#3a27a8]/70 scale-[1.04]",
    inactiveClassName:
      "bg-[linear-gradient(130deg,#18065b_0%,#25126f_85%,#160a4b_100%)] text-white/90 border border-[#18065b]/35",
    activeIndicatorClassName:
      "after:opacity-100 after:bg-[#5144de] after:shadow-[0_4px_10px_rgba(81,68,222,0.45)] after:border after:border-[rgba(119,104,255,0.8)]",
  },
  {
    label: "Completed",
    href: "/completed-experiments",
    isActive: (pathname) => pathname.startsWith("/completed-experiments"),
    activeClassName:
      "bg-[linear-gradient(135deg,#c9bbff_0%,#a995ff_60%,#8d79f6_100%)] text-white shadow-[0_12px_30px_rgba(137,121,246,0.48)] border border-[#9f8dff]/65 scale-[1.04]",
    inactiveClassName:
      "bg-[linear-gradient(135deg,#e1d9ff_0%,#cfc0ff_100%)] text-[#2d1c6a]/90 border border-[#c9befc]/35",
    activeIndicatorClassName:
      "after:opacity-100 after:bg-[#b3a4ff] after:shadow-[0_4px_10px_rgba(159,140,255,0.35)] after:border after:border-[rgba(210,201,255,0.8)]",
  },
  {
    label: "About",
    href: "/about",
    isActive: (pathname) => pathname.startsWith("/about"),
    activeClassName:
      "bg-[linear-gradient(140deg,rgba(255,255,255,0.95)_0%,rgba(243,236,255,0.92)_60%,rgba(228,220,255,0.9)_100%)] text-foreground border border-primary/45 shadow-[0_10px_28px_rgba(85,60,190,0.22)] scale-[1.04]",
    inactiveClassName:
      "bg-[linear-gradient(140deg,rgba(255,255,255,0.88)_0%,rgba(247,243,255,0.88)_100%)] text-foreground/80 border border-border/70 backdrop-blur",
    activeIndicatorClassName:
      "after:opacity-100 after:bg-[#8a74ee] after:shadow-[0_4px_10px_rgba(137,118,243,0.3)] after:border after:border-[rgba(184,173,255,0.8)]",
  },
];

const baseClasses =
  "relative min-w-[96px] overflow-visible rounded-md px-4 py-2 text-sm font-semibold transition-all duration-150 touch-manipulation active:scale-95 active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 after:pointer-events-none after:absolute after:top-[calc(100%+6px)] after:left-1/2 after:h-[6px] after:w-[76%] after:-translate-x-1/2 after:rounded-full after:opacity-0 after:transition-all after:duration-200 after:content-[''] after:bg-transparent after:shadow-none";

const inactiveStateClass = "opacity-80";

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
              active && tab.activeIndicatorClassName,
              active ? tab.activeClassName : tab.inactiveClassName,
              !active && inactiveStateClass
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
