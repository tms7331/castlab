"use client";

import { ReactNode } from "react";

import { NavigationPills } from "@/components/navigation-pills";
import { cn } from "@/lib/utils";
import { LAYOUT } from "@/lib/constants/layout";

type NavigationHeroProps = {
  children?: ReactNode;
  /**
   * Tailwind spacing utility applied between the nav and the children.
   * Defaults to the spacing that the hero currently used.
   */
  contentSpacingClass?: string;
  /**
   * Additional classes for the padded container that wraps the nav + children.
   */
  paddingClass?: string;
  /**
   * Additional classes applied to the section container.
   */
  className?: string;
};

const DEFAULT_CONTENT_SPACING = "space-y-6 md:space-y-8";
const DEFAULT_PADDING_CLASSES = "pt-8 md:pt-12 pb-6 md:pb-10";

export function NavigationHero({
  children,
  contentSpacingClass = DEFAULT_CONTENT_SPACING,
  paddingClass = DEFAULT_PADDING_CLASSES,
  className,
}: NavigationHeroProps) {
  return (
    <section className={cn("relative overflow-hidden", className)}>
      <div
        className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_-5%,rgba(140,121,255,0.08),transparent_55%)] z-0"
        aria-hidden
      />
      <div
        className="absolute inset-x-0 top-10 h-14 bg-[radial-gradient(60%_120%_at_50%_50%,rgba(242,178,59,0.06),transparent_70%)] blur-lg z-0"
        aria-hidden
      />
      <div className={cn("relative z-10", LAYOUT.paddingX, paddingClass)}>
        <div className={cn("mx-auto text-center", LAYOUT.maxWidth, contentSpacingClass)}>
          <NavigationPills />

          {children}
        </div>
      </div>
    </section>
  );
}
