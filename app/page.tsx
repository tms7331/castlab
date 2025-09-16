import { Metadata } from "next";
import { getAppUrl } from "@/lib/utils/app-url";
import HomeClient from "./HomeClient";

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
          url: appUrl,
          name: "CastLab",
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
          url: appUrl,
          name: "CastLab",
          iconUrl: `${appUrl}/icon.png`,
          description: "Fund fun science experiments",
          aboutUrl: `${appUrl}/about`
        }
      }
    })
  }
};

export default function HomePage() {
  return <HomeClient />;
}