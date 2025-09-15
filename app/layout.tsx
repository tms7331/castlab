import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { FarcasterProvider } from "./providers/FarcasterProvider";
import { WagmiProvider } from "@/lib/wagmi/WagmiProvider";
import { Header } from "@/components/header";
import { getAppUrl } from "@/lib/utils/app-url";
import { Analytics } from "@vercel/analytics/next";

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

const appUrl = getAppUrl();

export const metadata: Metadata = {
  title: "CastLab - Fund Fun Science",
  description: "Crowdfunding platform for fun science experiments",
  other: {
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl: `${appUrl}/castlab1200.png`,
      button: {
        title: "Launch CastLab",
        action: {
          type: "launch_frame",
          name: "CastLab",
          url: appUrl,
          iconUrl: `${appUrl}/icon.png`,
          description: "Fund fun science experiments",
          aboutUrl: `${appUrl}/about`
        }
      }
    }),
    "fc:frame": JSON.stringify({
      version: "1",
      imageUrl: `${appUrl}/castlab1200.png`,
      button: {
        title: "Launch CastLab",
        action: {
          type: "launch_frame",
          name: "CastLab",
          url: appUrl,
          iconUrl: `${appUrl}/icon.png`,
          description: "Fund fun science experiments",
          aboutUrl: `${appUrl}/about`
        }
      }
    })
  }
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
            <main>
              {children}
            </main>
          </WagmiProvider>
        </FarcasterProvider>
        <Analytics />
      </body>
    </html>
  );
}
