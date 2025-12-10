"use client";

import Image from "next/image";
import Link from "next/link";
import LoginButton from "@/components/LoginButton";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border/50">
      <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 py-3 md:py-4 max-w-7xl mx-auto w-full">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="relative w-8 h-8 md:w-10 md:h-10">
            <Image
              src="/icon.png"
              alt="CastLab Logo"
              fill
              className="rounded-lg object-cover"
              sizes="(max-width: 768px) 32px, 40px"
              priority
            />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">CastLab</h1>
        </Link>

        {/* User Profile & Actions - using LoginButton instead */}
        <div className="flex items-center gap-3">
          <LoginButton />
        </div>
      </div>
    </header>
  );
}