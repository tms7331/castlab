export default function DonorsPage() {
  const topDonors = [
    { name: "vitalik.eth", amount: 125000, experiments: 23, avatar: "🦄" },
    { name: "dwr.eth", amount: 87500, experiments: 18, avatar: "🚀" },
    { name: "jessepollak", amount: 62300, experiments: 15, avatar: "⚡" },
    { name: "linda.eth", amount: 45000, experiments: 12, avatar: "🌟" },
    { name: "defi_whale", amount: 38900, experiments: 9, avatar: "🐋" },
  ];

  const recentDonors = [
    { name: "alice.eth", amount: 500, experiment: "Quantum Entanglement in Biological Systems", time: "2 hours ago" },
    { name: "bob.eth", amount: 1000, experiment: "Mycelium Networks as Computing Substrates", time: "5 hours ago" },
    { name: "charlie.eth", amount: 250, experiment: "Sonoluminescence Energy Harvesting", time: "1 day ago" },
    { name: "diana.eth", amount: 750, experiment: "Quantum Entanglement in Biological Systems", time: "2 days ago" },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl md:text-5xl font-bold text-[#005577] mb-8 text-center">
        Donors Emeritus
      </h1>
      
      <p className="text-center text-[#0a3d4d] mb-12 max-w-2xl mx-auto">
        Celebrating the visionaries who are making independent science possible. 
        Every contribution, no matter the size, pushes humanity forward.
      </p>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="experiment-card">
          <h2 className="text-2xl font-bold text-[#005577] mb-6">Top Contributors</h2>
          <div className="space-y-4">
            {topDonors.map((donor, index) => (
              <div key={donor.name} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#00c9a7] to-[#00a8cc] rounded-full flex items-center justify-center text-2xl">
                  {donor.avatar}
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-[#005577]">{donor.name}</p>
                      <p className="text-sm text-[#0a3d4d]">
                        {donor.experiments} experiments funded
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#00a8cc]">
                        ${donor.amount.toLocaleString()}
                      </p>
                      {index === 0 && (
                        <span className="text-xs bg-gradient-to-r from-[#00c9a7] to-[#00a8cc] text-white px-2 py-1 rounded-full">
                          Top Donor
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="experiment-card">
          <h2 className="text-2xl font-bold text-[#005577] mb-6">Recent Contributions</h2>
          <div className="space-y-4">
            {recentDonors.map((donor) => (
              <div key={`${donor.name}-${donor.time}`} className="border-l-4 border-[#00a8cc] pl-4">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-semibold text-[#005577]">{donor.name}</p>
                  <p className="font-medium text-[#00a8cc]">${donor.amount}</p>
                </div>
                <p className="text-sm text-[#0a3d4d] mb-1">
                  Funded: {donor.experiment}
                </p>
                <p className="text-xs text-[#0a3d4d]/60">{donor.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="experiment-card max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-[#005577] mb-4">Community Impact</h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-3xl font-bold text-[#00a8cc]">$2.3M</p>
            <p className="text-sm text-[#0a3d4d]">Total Raised</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#00a8cc]">47</p>
            <p className="text-sm text-[#0a3d4d]">Experiments Funded</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#00a8cc]">1,284</p>
            <p className="text-sm text-[#0a3d4d]">Active Donors</p>
          </div>
        </div>
        <button className="btn-primary">
          Join the Community
        </button>
      </div>
    </div>
  );
}