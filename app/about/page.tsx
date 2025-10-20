import { NavigationPills } from "@/components/navigation-pills";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="relative px-4 py-2">
          <div className="max-w-sm mx-auto text-center space-y-4">
            <NavigationPills />

            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-balance leading-tight">
                About <span className="text-primary">CastLab</span>
              </h1>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-8">
        <div className="max-w-sm mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Is this real?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
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

          <Card>
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Science should be fun. CastLab lets you crowdfund science on the questions you actually care about. We&apos;re here to fuel curiosity one experiment at a time, balancing scientific rigor with playful exploration.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Browse experiments</h3>
                <p className="text-muted-foreground text-sm">
                  Scroll through a feed of fun, high-signal questions people want answered. Each of them has been carefully designed by scientists to produce real, trustworthy results.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Back what you love</h3>
                <p className="text-muted-foreground text-sm">
                  Fund experiments you care about. Studies launch once they meet their minimum funding goal, but the more support a study gets, the stronger evidence we can gather. So contribute to the ones that you want to see good evidence for! You can withdraw your contribution anytime before a study reaches its goal.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Make bets</h3>
                <p className="text-muted-foreground text-sm">
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
