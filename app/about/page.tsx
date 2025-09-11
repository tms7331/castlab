export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-[#005577] mb-8">About CastLab</h1>
        
        <div className="experiment-card mb-8">
          <h2 className="text-2xl font-bold text-[#005577] mb-4">Our Mission</h2>
          <p className="text-[#0a3d4d]">
            Science should be fun. CastLab lets you crowdfund science on the questions you actually care about. We&apos;re here to fuel curiosity one experiment at a time, balancing scientific rigor with playful exploration.
          </p>
        </div>

        <div className="experiment-card mb-8">
          <h2 className="text-2xl font-bold text-[#005577] mb-4">How It Works</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-[#005577] mb-2">Browse experiments</h3>
              <p className="text-[#0a3d4d]">
                Scroll through a feed of fun, high-signal questions people want answered. Each of them has been carefully designed by scientists to produce real, trustworthy results.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-[#005577] mb-2">Back what you love</h3>
              <p className="text-[#0a3d4d]">
                Fund experiments you care about. Studies launch once they meet their minimum funding goal, but the more support a study gets, the stronger evidence we can gather. So contribute to the ones that you want to see good evidence for! You can withdraw your contribution anytime before a study reaches its goal.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-[#005577] mb-2">See the results</h3>
              <p className="text-[#0a3d4d]">
                Once funded, experiments get run by the team at Cosimo Research, an independent scientific research service. They design the protocol, execute the experiment, analyze the data, and share updates along the way. Check out their past work and follow along at{" "}
                <a 
                  href="https://www.cosimoresearch.com/journal" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#00a8cc] hover:underline"
                >
                  https://www.cosimoresearch.com/journal
                </a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}