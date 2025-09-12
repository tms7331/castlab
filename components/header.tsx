"use client";

import Image from "next/image";
import LoginButton from "@/app/components/LoginButton";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border/50">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8">
            <Image 
              src="/icon.png" 
              alt="CastLab Logo" 
              fill
              className="rounded-lg object-cover"
              sizes="32px"
              priority
            />
          </div>
          <h1 className="text-xl font-bold text-foreground">CastLab</h1>
        </div>

        {/* User Profile & Actions - using LoginButton instead */}
        <div className="flex items-center gap-3">
          <LoginButton />
        </div>
      </div>
    </header>
  );
}