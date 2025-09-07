import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

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
        <header className="sticky top-0 z-50 bg-gradient-to-br from-[#005577] via-[#0077a3] to-[#0088bb] shadow-lg backdrop-blur-md">
          <nav className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <Link href="/" className="text-2xl md:text-3xl font-bold text-[#a8e6f0] text-center md:text-left mb-4 md:mb-0 tracking-wider drop-shadow-lg">
                CastLab
              </Link>
              <ul className="flex justify-center md:justify-end gap-2 md:gap-4">
                <li>
                  <Link href="/" className="nav-link">
                    Experiments
                  </Link>
                </li>
                <li>
                  <Link href="/my-experiments" className="nav-link">
                    My Experiments
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
                <li>
                  <Link href="/suggest" className="nav-link">
                    Suggest
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </header>
        <main className="min-h-screen bg-gradient-to-b from-[#e8f5f7] to-[#d0e7eb]">
          {children}
        </main>
      </body>
    </html>
  );
}
