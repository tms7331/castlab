import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative px-4 py-2">
        <div className="max-w-sm mx-auto text-center space-y-4">
          {/* Navigation Pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <Link href="/">
              <button
                className="px-3 py-1 rounded-md text-sm font-medium transition-colors cursor-pointer"
                style={{
                  backgroundColor: "#18065b",
                  color: "#ffffff",
                  border: "none",
                }}
              >
                Experiments
              </button>
            </Link>
            <Link href="/completed-experiments">
              <button className="px-3 py-1 rounded-md text-sm font-medium bg-secondary text-secondary-foreground border-0 hover:bg-secondary/80 transition-colors cursor-pointer">
                Completed
              </button>
            </Link>
            <Link href="/about">
              <button className="px-3 py-1 rounded-md text-sm font-medium bg-background text-foreground border border-border hover:bg-muted transition-colors cursor-pointer">
                About
              </button>
            </Link>
          </div>

          {/* Hero Content */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-balance leading-tight">
              Fund <span className="text-primary">SCIENCE!</span>
            </h1>
            <p className="text-lg text-muted-foreground text-balance">Real experiments. Real results. Real fun.</p>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-6 pt-2 text-sm text-muted-foreground">
            <div className="text-center">
              <div className="font-semibold text-foreground">127</div>
              <div>Active</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-foreground">$89k</div>
              <div>Funded</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}