"use client";

import Link from "next/link";

export function NavigationPills() {
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-4">
      <Link href="/">
        <button
          className="px-3 py-1 rounded-md text-sm font-medium transition-colors cursor-pointer"
          style={{
            backgroundColor: "#18065b",
            color: "#ffffff",
            border: "none",
          }}
        >
          Experiments
        </button>
      </Link>
      <Link href="/completed-experiments">
        <button className="px-3 py-1 rounded-md text-sm font-medium bg-secondary text-secondary-foreground border-0 hover:bg-secondary/80 transition-colors cursor-pointer">
          Completed
        </button>
      </Link>
      <Link href="/about">
        <button className="px-3 py-1 rounded-md text-sm font-medium bg-background text-foreground border border-border hover:bg-muted transition-colors cursor-pointer">
          About
        </button>
      </Link>
    </div>
  );
}