import { NavigationHero } from "@/components/navigation-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LAYOUT } from "@/lib/constants/layout";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <NavigationHero contentSpacingClass="space-y-5 md:space-y-7">
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-balance leading-tight">
            About CastLab
          </h1>
        </div>
      </NavigationHero>

      <section className={cn(LAYOUT.paddingX, "pt-4 md:pt-6 pb-12 md:pb-16")}>
        <div className="max-w-sm md:max-w-2xl lg:max-w-3xl mx-auto space-y-4 md:space-y-6">
          <Card className="md:p-2">
            <CardHeader>
              <CardTitle className="md:text-xl">Is this real?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground md:text-base md:leading-relaxed">
                Yes! The initial batch of experiments will be run by the team at Cosimo Research, an independent scientific research service. They design the protocol, execute the experiment, analyze the data, and share updates along the way. Check out their past work and follow along at{" "}
                <a
                  href="https://www.cosimoresearch.com/journal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  cosimoresearch.com/journal
                </a>.  In the future more researchers will be onboarded to run their own experiments.
              </p>
            </CardContent>
          </Card>

          <Card className="md:p-2">
            <CardHeader>
              <CardTitle className="md:text-xl">Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground md:text-base md:leading-relaxed">
                Science should be fun. CastLab lets you crowdfund science on the questions you actually care about. We&apos;re here to fuel curiosity one experiment at a time, balancing scientific rigor with playful exploration.
              </p>
            </CardContent>
          </Card>

          <Card className="md:p-2">
            <CardHeader>
              <CardTitle className="md:text-xl">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2 md:text-lg">Browse experiments</h3>
                <p className="text-muted-foreground text-sm md:text-base md:leading-relaxed">
                  Scroll through a feed of fun, high-signal questions people want answered. Each of them has been carefully designed by scientists to produce real, trustworthy results.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2 md:text-lg">Back what you love</h3>
                <p className="text-muted-foreground text-sm md:text-base md:leading-relaxed">
                  Fund experiments you care about. Studies launch once they meet their minimum funding goal, but the more support a study gets, the stronger evidence we can gather. So contribute to the ones that you want to see good evidence for! You can withdraw your contribution anytime before a study reaches its goal.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2 md:text-lg">Make bets</h3>
                <p className="text-muted-foreground text-sm md:text-base md:leading-relaxed">
                  Think you know how an experiment will turn out? Place a bet on the outcome you think is most likely. Results are determined using parimutuel betting: the total pool of bets is divided among those who guessed correctly, with payouts proportional to their stakes. If the experiment doesn&apos;t get run, you get your money back.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
