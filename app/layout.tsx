import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { FarcasterProvider } from "./providers/FarcasterProvider";
import LoginButton from "./components/LoginButton";
import { WagmiProvider } from "@/lib/wagmi/WagmiProvider";

export const metadata: Metadata = {
  title: "CastLab - Fund Weird Science",
  description: "Crowdfunding platform for unconventional scientific experiments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <FarcasterProvider>
          <WagmiProvider>
            <header className="sticky top-0 z-50 bg-gradient-to-br from-[#005577] via-[#0077a3] to-[#0088bb] shadow-lg backdrop-blur-md">
            <nav className="container mx-auto px-4 py-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                  <Link href="/" className="text-2xl md:text-3xl font-bold text-[#a8e6f0] text-center md:text-left tracking-wider drop-shadow-lg">
                    CastLab
                  </Link>
                  <LoginButton />
                </div>
                <ul className="flex justify-center md:justify-end gap-2 md:gap-4 items-center">
                  <li>
                    <Link href="/" className="nav-link">
                      Experiments
                    </Link>
                  </li>
                  <li>
                    <Link href="/completed-experiments" className="nav-link">
                      Completed Experiments
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="nav-link">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="/donors" className="nav-link">
                      Donors
                    </Link>
                  </li>
                </ul>
              </div>
            </nav>
          </header>
          <main className="min-h-screen bg-gradient-to-b from-[#e8f5f7] to-[#d0e7eb]">
            {children}
          </main>
          </WagmiProvider>
        </FarcasterProvider>
      </body>
    </html>
  );
}
