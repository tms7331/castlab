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
    label: "Live",
    href: "/",
    isActive: (pathname) => pathname === "/" || pathname.startsWith("/experiments"),
    activeClassName: "bg-primary text-primary-foreground border border-primary/30 shadow-[0_6px_16px_rgba(24,22,60,0.12)]",
    inactiveClassName: "bg-muted text-muted-foreground border border-border/70 hover:bg-muted/80",
  },
  {
    label: "Completed",
    href: "/completed-experiments",
    isActive: (pathname) => pathname.startsWith("/completed-experiments"),
    activeClassName:
      "bg-[var(--tertiary)] text-card-foreground border border-[color-mix(in_oklch,var(--tertiary)_70%,var(--background)_30%)] shadow-[0_6px_16px_rgba(24,22,60,0.12)]",
    inactiveClassName: "bg-muted text-muted-foreground border border-border/70 hover:bg-muted/80",
  },
  {
    label: "About",
    href: "/about",
    isActive: (pathname) => pathname.startsWith("/about"),
    activeClassName:
      "bg-secondary text-secondary-foreground border border-secondary/70 shadow-[0_6px_16px_rgba(24,22,60,0.12)]",
    inactiveClassName: "bg-muted text-muted-foreground border border-border/70 hover:bg-muted/80",
  },
];

const baseClasses =
  "min-w-[96px] md:min-w-[120px] rounded-lg px-4 md:px-5 py-2 md:py-2.5 text-sm md:text-base font-medium transition-colors duration-200 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 border";

export function NavigationPills() {
  const pathname = usePathname() ?? "/";

  return (
    <nav className="mb-4 md:mb-6 flex flex-wrap justify-center gap-2 md:gap-3" aria-label="Primary">
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
              active ? tab.activeClassName : tab.inactiveClassName
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
