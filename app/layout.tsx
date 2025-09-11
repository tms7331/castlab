import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { FarcasterProvider } from "./providers/FarcasterProvider";
import { WagmiProvider } from "@/lib/wagmi/WagmiProvider";
import { Header } from "@/components/header";

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <FarcasterProvider>
          <WagmiProvider>
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
          </WagmiProvider>
        </FarcasterProvider>
      </body>
    </html>
  );
}
