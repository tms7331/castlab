export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-[#005577] mb-8">About FarSci</h1>
        
        <div className="experiment-card mb-8">
          <h2 className="text-2xl font-bold text-[#005577] mb-4">Our Mission</h2>
          <p className="text-[#0a3d4d] mb-4">
            FarSci is a decentralized crowdfunding platform designed to empower independent scientists and researchers. 
            We believe that groundbreaking discoveries shouldn&apos;t be limited by traditional funding constraints.
          </p>
          <p className="text-[#0a3d4d]">
            By leveraging the power of the Farcaster community, we&apos;re creating a new paradigm where curious minds 
            can directly support the scientific endeavors that excite them most.
          </p>
        </div>

        <div className="experiment-card mb-8">
          <h2 className="text-2xl font-bold text-[#005577] mb-4">How It Works</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#00c9a7] to-[#00a8cc] rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-[#005577] mb-1">Scientists Submit Proposals</h3>
                <p className="text-[#0a3d4d] text-sm">
                  Researchers outline their experiments, methodologies, and funding requirements.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#00c9a7] to-[#00a8cc] rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-[#005577] mb-1">Community Reviews & Funds</h3>
                <p className="text-[#0a3d4d] text-sm">
                  The Farcaster community evaluates proposals and contributes to projects they find compelling.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#00c9a7] to-[#00a8cc] rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-[#005577] mb-1">Research Progresses</h3>
                <p className="text-[#0a3d4d] text-sm">
                  Scientists conduct their experiments and share updates with their backers.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#00c9a7] to-[#00a8cc] rounded-full flex items-center justify-center text-white font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-[#005577] mb-1">Results Shared Openly</h3>
                <p className="text-[#0a3d4d] text-sm">
                  All findings are published openly, advancing human knowledge for everyone.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="experiment-card">
          <h2 className="text-2xl font-bold text-[#005577] mb-4">Why Farcaster?</h2>
          <p className="text-[#0a3d4d] mb-4">
            Farcaster&apos;s decentralized social protocol provides the perfect foundation for transparent, 
            community-driven scientific funding. With built-in identity verification and social graphs, 
            we can ensure accountability while maintaining the open, collaborative spirit of science.
          </p>
          <p className="text-[#0a3d4d]">
            Our integration with Farcaster Frames allows for seamless interaction with experiments 
            directly from your feed, making science funding as easy as liking a cast.
          </p>
        </div>
      </div>
    </div>
  );
}