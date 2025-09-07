"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

export default function ExperimentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // Mock data with simplified format
  const experiments: { [key: string]: any } = {
    "1": {
      id: 1,
      title: "What Rap Music Goes the Hardest, Objectively",
      oneLiner: "Kendrick vs Drake – which goes the hardest",
      whyStudy: "Although Kendrick undeniably demolished Drake in their recent feud, which artist's music goes the hardest remains to be scientifically measured. Moreover, other overlooked artists may deserve a spot in the Big Three. A meta-analysis of 139 studies found that music significantly enhances physical performance (Terry et al, 2020), but the comparative impact of specific tracks remains untested. It's time for a data-driven rap battle.",
      approach: `Randomized crossover experiment with songs by Kendrick, Drake, and other artists selected via pilot survey
Outcomes: Number of pushups completed in 1 minute, number of boxing bag hits in 1 minute, and weight selection while listening to songs
Double-blind to avoid artist preference bias`,
      cost: 500,
      raised: 325,
      backers: 42
    },
    "2": {
      id: 2,
      title: "The Science of Talking to Plants",
      oneLiner: "Do plants actually grow better when you talk to them?",
      whyStudy: "The Royal Horticultural Society found that plants grew faster when played female voices versus male voices, but the study lacked proper controls. While plants can respond to sound vibrations (Appel & Cocroft, 2014), whether human speech specifically affects growth remains contentious. We need rigorous testing to settle this decades-old debate once and for all.",
      approach: `Controlled greenhouse experiment with 200 tomato seedlings divided into 4 groups
Groups: Positive speech, negative speech, non-speech sounds, and silence (control)
Automated speech delivery system for 30 minutes daily
Measurements: Height, biomass, fruit yield, and time to flowering over 12 weeks`,
      cost: 1200,
      raised: 890,
      backers: 67
    },
    "3": {
      id: 3,
      title: "Canine Classical Music Discrimination",
      oneLiner: "Can dogs distinguish between Beethoven and Bach?",
      whyStudy: "Dogs have shown preference for reggae and soft rock over other genres (Bowman et al, 2017), but no study has tested whether they can distinguish between classical composers. Given that dogs can detect cancer and predict seizures, their musical discrimination abilities remain surprisingly unexplored. This could revolutionize both animal cognition research and your dog's Spotify playlist.",
      approach: `Two-choice discrimination task with 30 dogs of various breeds
Training phase: Dogs learn to associate Beethoven with left door, Bach with right door for treats
Testing phase: Novel pieces from each composer to test generalization
Control: Contemporary classical music to ensure it's composer-specific, not era-specific`,
      cost: 800,
      raised: 156,
      backers: 23
    },
    "4": {
      id: 4,
      title: "The Optimal Programming Soundtrack",
      oneLiner: "Does coding productivity increase with Lo-fi hip hop vs Death Metal?",
      whyStudy: "While 'Lo-fi hip hop beats to study/relax to' has 1.3 billion views on YouTube, no controlled study has tested its effect on programming performance. Some developers swear by aggressive music for debugging, while others need calm beats. With the average developer spending 1,500 hours/year coding, optimizing the soundtrack could save the tech industry millions in productivity.",
      approach: `Within-subjects design with 50 professional developers over 2 weeks
Conditions: Lo-fi hip hop, death metal, classical, white noise, and silence
Tasks: Debugging exercises, algorithm implementation, and code review
Metrics: Lines of code, bug detection rate, time to completion, and self-reported flow state`,
      cost: 2500,
      raised: 2100,
      backers: 189
    },
    "5": {
      id: 5,
      title: "Teaching Fungi to Play Video Games",
      oneLiner: "Can mushrooms learn to play Pong?",
      whyStudy: "Fungi networks show electrical activity patterns similar to neurons, and slime molds can solve mazes and remember past events. If mushrooms can learn Pong—as neurons in a dish recently did (Kagan et al, 2022)—it would demonstrate that intelligence doesn't require a brain. Plus, we'd finally have a worthy opponent for that friend who's too good at retro games.",
      approach: `Interface oyster mushroom mycelium with microelectrode array
Training protocol: Electrical feedback when mycelium signals move virtual paddle correctly
Success criteria: Above-random paddle positioning after 100 games
Control: Random electrical stimulation to ensure learning, not just reactivity`,
      cost: 1500,
      raised: 450,
      backers: 38
    },
    "6": {
      id: 6,
      title: "The Mathematics of Perfect Pizza",
      oneLiner: "Is there a scientifically optimal pizza topping combination?",
      whyStudy: "Pizza is a $145 billion industry, yet topping optimization relies on tradition rather than science. Food pairing theory suggests compatible flavors share molecular compounds (Ahn et al, 2011), but this hasn't been systematically tested for pizza. Finding the optimal combination could end pizza arguments forever and create the ultimate crowd-pleaser.",
      approach: `Factorial design testing 10 toppings in various combinations
Phase 1: Chemical analysis of flavor compounds in each topping
Phase 2: Taste testing with 200 participants using blind ratings
Mathematical modeling to predict optimal combinations based on flavor compound overlap and human preferences`,
      cost: 3000,
      raised: 3200,
      backers: 245
    }
  };

  const experiment = experiments[id];

  if (!experiment) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="experiment-card max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-[#005577] mb-4">Experiment Not Found</h1>
          <p className="text-[#0a3d4d] mb-6">The experiment you're looking for doesn't exist.</p>
          <Link href="/" className="btn-primary">
            Back to Experiments
          </Link>
        </div>
      </div>
    );
  }

  const percentRaised = Math.round((experiment.raised / experiment.cost) * 100);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <Link href="/" className="text-[#0077a3] hover:text-[#005577] transition-colors mb-6 inline-block">
          ← Back to experiments
        </Link>

        {/* Main Card */}
        <div className="experiment-card">
          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-[#005577] mb-2">
            {experiment.title}
          </h1>
          <p className="text-lg text-[#0a3d4d] mb-6">
            {experiment.oneLiner}
          </p>

          {/* Image for Kendrick vs Drake experiment */}
          {experiment.id === 1 && (
            <div className="mb-6">
              <img
                src="/kvd.png"
                alt="Kendrick vs Drake"
                className="w-full rounded-lg shadow-lg"
              />
            </div>
          )}

          {/* Funding Progress */}
          <div className="mb-8 p-4 bg-[#e8f5f7] rounded-lg">
            <div className="flex justify-between items-end mb-3">
              <div>
                <span className="text-2xl font-bold text-[#00a8cc]">${experiment.raised}</span>
                <span className="text-[#0a3d4d]/60"> raised of ${experiment.cost} goal</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-[#005577]">{experiment.backers} backers</div>
              </div>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(percentRaised, 100)}%` }}
              />
            </div>
            <div className="text-sm text-[#0077a3] mt-1">{percentRaised}% funded</div>
          </div>

          {/* Why Study This */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#005577] mb-3">Why study this?</h2>
            <p className="text-[#0a3d4d] leading-relaxed">
              {experiment.whyStudy}
            </p>
          </div>

          {/* Experimental Approach */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#005577] mb-3">Experimental Approach</h2>
            <div className="text-[#0a3d4d] whitespace-pre-line leading-relaxed">
              {experiment.approach}
            </div>
          </div>

          {/* Cost */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#005577] mb-3">Cost</h2>
            <p className="text-2xl font-semibold text-[#00a8cc]">
              ${experiment.cost}
            </p>
          </div>

          {/* Fund Button */}
          <button className="w-full btn-primary">
            Fund This Experiment
          </button>
        </div>
      </div>
    </div>
  );
}