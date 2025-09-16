import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/utils/app-url";
import ExperimentClient from "./ExperimentClient";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const appUrl = getAppUrl();

  // Fetch experiment data - convert id to number
  const { data: experiment } = await supabase
    .from("events")
    .select("*")
    .eq("experiment_id", parseInt(id, 10))
    .single();

  if (!experiment) {
    return {
      title: "Experiment Not Found - CastLab",
      other: {
        "fc:miniapp": JSON.stringify({
          version: "1",
          imageUrl: `${appUrl}/castlab1200.png`,
          button: {
            title: "Launch CastLab",
            action: {
              type: "launch_frame",
              url: appUrl
            }
          }
        })
      }
    };
  }

  // Use the experiment's image or fallback to default
  const imageUrl = experiment.image_url || `${appUrl}/castlab1200.png`;

  // Try using just the path, not the full URL
  const experimentPath = `/experiments/${id}`;
  const experimentUrl = `${appUrl}${experimentPath}`;

  return {
    title: `${experiment.title} - CastLab`,
    description: experiment.summary || experiment.one_liner || "Fund this experiment on CastLab",
    openGraph: {
      title: experiment.title,
      description: experiment.summary || experiment.one_liner,
      images: [imageUrl],
      url: experimentUrl,
    },
    other: {
      // Configure the mini app embed for this specific experiment
      "fc:miniapp": JSON.stringify({
        version: "1",
        imageUrl: imageUrl,
        button: {
          title: "View Experiment",
          action: {
            type: "launch_miniapp",  // Changed to launch_miniapp
            name: experiment.title,
            url: experimentUrl
          }
        }
      }),
      // Also add frame metadata for better compatibility
      "fc:frame": JSON.stringify({
        version: "1",
        imageUrl: imageUrl,
        button: {
          title: "View Experiment",
          action: {
            type: "launch_frame",
            name: experiment.title.length > 32 ? `${experiment.title.slice(0, 29)}...` : experiment.title,  // name goes inside action
            url: experimentUrl
          }
        }
      })
    }
  };
}

export default async function ExperimentPage() {
  return <ExperimentClient />;
}