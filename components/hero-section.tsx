import { NavigationPills } from "@/components/navigation-pills";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative px-4 py-2">
        <div className="max-w-sm mx-auto text-center space-y-4">
          {/* Navigation Pills */}
          <NavigationPills />

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