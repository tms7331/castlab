import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { FarcasterProvider } from "./providers/FarcasterProvider";
import { WagmiProvider } from "@/lib/wagmi/WagmiProvider";
import { Header } from "@/components/header";
import { BiologicalBackground } from "@/components/biological-background";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { PostHogProvider } from "@/lib/analytics/PostHogProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "CastLab - Fund Fun Science",
  description: "Crowdfunding platform for fun science experiments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PostHogProvider>
          <BiologicalBackground />
          <div className="relative z-10 flex min-h-screen flex-col">
            <FarcasterProvider>
              <WagmiProvider>
                <Header />
                <main className="flex-1">
                  {children}
                </main>
              </WagmiProvider>
            </FarcasterProvider>
            <Analytics />
          </div>
          <Toaster position="bottom-right" />
        </PostHogProvider>
      </body>
    </html>
  );
}
