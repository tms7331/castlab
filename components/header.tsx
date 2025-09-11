"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import LoginButton from "@/app/components/LoginButton";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          {/* Logo and Login */}
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">C</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-wider">
                CastLab
              </h1>
            </Link>
            <LoginButton />
          </div>
          
          {/* Navigation Links */}
          <ul className="flex justify-center md:justify-end gap-2 md:gap-4 items-center">
            <li>
              <Button asChild variant="ghost" size="sm">
                <Link href="/">Experiments</Link>
              </Button>
            </li>
            <li>
              <Button asChild variant="ghost" size="sm">
                <Link href="/completed-experiments">Completed</Link>
              </Button>
            </li>
            <li>
              <Button asChild variant="ghost" size="sm">
                <Link href="/about">About</Link>
              </Button>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}