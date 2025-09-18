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
      "bg-[#18065b] text-white shadow-lg shadow-[#18065b]/35 border border-[#18065b]/70 scale-105 ring-2 ring-white/80 ring-offset-2 ring-offset-[#18065b]/60",
    inactiveClassName:
      "bg-[#18065b] text-white border border-[#18065b]/40",
  },
  {
    label: "Completed",
    href: "/completed-experiments",
    isActive: (pathname) => pathname.startsWith("/completed-experiments"),
    activeClassName:
      "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/35 border border-secondary/60 scale-105 ring-2 ring-white/80 ring-offset-2 ring-offset-secondary/60",
    inactiveClassName:
      "bg-secondary text-secondary-foreground border border-secondary/40",
  },
  {
    label: "About",
    href: "/about",
    isActive: (pathname) => pathname.startsWith("/about"),
    activeClassName:
      "bg-background text-foreground border border-primary/70 shadow-lg shadow-primary/20 scale-105 ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
    inactiveClassName:
      "bg-background text-foreground border border-border",
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
