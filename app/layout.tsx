import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "./providers/AuthProvider";
import { FarcasterProvider } from "./providers/FarcasterProvider";
import { WagmiProvider } from "@/lib/wagmi/WagmiProvider";
import { Header } from "@/components/header";
import { GridPattern } from "@/components/ui/grid-pattern";
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
          <GridPattern
            squares={[
              [4, 4],
              [5, 1],
              [8, 2],
              [5, 3],
              [5, 5],
              [10, 10],
              [12, 15],
              [15, 10],
              [10, 15],
              [15, 10],
              [10, 15],
              [15, 10],
            ]}
            className="fixed inset-0 -z-10 [mask-image:radial-gradient(100vw_circle_at_center,white,transparent)] inset-x-0 inset-y-[-30%] h-[200%] skew-y-12 fill-gray-900/8 stroke-gray-900/8 dark:fill-gray-100/8 dark:stroke-gray-100/8"
          />
          <div className="relative z-10 flex min-h-screen flex-col">
            <WagmiProvider>
              <AuthProvider>
                <FarcasterProvider>
                  <Header />
                  <main className="flex-1">
                    {children}
                  </main>
                </FarcasterProvider>
              </AuthProvider>
            </WagmiProvider>
            <Analytics />
          </div>
          <Toaster position="bottom-right" />
        </PostHogProvider>
      </body>
    </html>
  );
}
