export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/5">
      <div className="relative px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Hero Content */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-balance leading-tight">
              Fund <span className="text-primary">Weird Science</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Real experiments. Real results. Really fun.
            </p>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 md:gap-12 pt-8">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary">127</div>
              <div className="text-sm text-muted-foreground">Active Experiments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary">$89k</div>
              <div className="text-sm text-muted-foreground">Total Funded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary">42</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}