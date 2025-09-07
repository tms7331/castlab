import Link from "next/link";

export default function ExperimentsListPage() {
  const allExperiments = [
    {
      id: 1,
      title: "Quantum Entanglement in Biological Systems",
      researcher: "Dr. Sarah Chen",
      description: "Investigating quantum coherence in photosynthetic complexes to understand energy transfer efficiency in plant cells under various environmental conditions.",
      goal: 50000,
      raised: 32500,
      backers: 127,
      daysLeft: 14,
      tags: ["Quantum Biology", "Photosynthesis", "Biophysics"],
      status: "active"
    },
    {
      id: 2,
      title: "Mycelium Networks as Computing Substrates",
      researcher: "Prof. Alex Rivera",
      description: "Exploring the computational capabilities of fungal networks for bio-inspired distributed computing and environmental sensing applications.",
      goal: 35000,
      raised: 28900,
      backers: 89,
      daysLeft: 7,
      tags: ["Mycology", "Biocomputing", "Networks"],
      status: "active"
    },
    {
      id: 3,
      title: "Sonoluminescence Energy Harvesting",
      researcher: "Dr. James Liu",
      description: "Developing methods to capture and utilize light emissions from collapsing bubbles in water for sustainable micro-energy generation.",
      goal: 42000,
      raised: 15600,
      backers: 64,
      daysLeft: 21,
      tags: ["Acoustics", "Energy", "Cavitation"],
      status: "active"
    },
    {
      id: 4,
      title: "Magnetic Field Effects on Plant Growth",
      researcher: "Dr. Maria Gonzalez",
      description: "Studying how varying magnetic field strengths influence seed germination rates and plant development in controlled environments.",
      goal: 25000,
      raised: 25000,
      backers: 203,
      daysLeft: 0,
      tags: ["Botany", "Magnetism", "Agriculture"],
      status: "funded"
    },
    {
      id: 5,
      title: "DIY Quantum Random Number Generator",
      researcher: "Prof. Tom Anderson",
      description: "Building an affordable quantum random number generator using commercially available components for cryptographic applications.",
      goal: 15000,
      raised: 8200,
      backers: 45,
      daysLeft: 28,
      tags: ["Quantum", "Cryptography", "DIY"],
      status: "active"
    }
  ];

  const activeExperiments = allExperiments.filter(exp => exp.status === "active");
  const fundedExperiments = allExperiments.filter(exp => exp.status === "funded");

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl md:text-5xl font-bold text-[#005577] mb-8">All Experiments</h1>
      
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 mb-6">
          <button className="tag hover:bg-[#00a8cc]/20 transition-colors">All</button>
          <button className="tag hover:bg-[#00a8cc]/20 transition-colors">Physics</button>
          <button className="tag hover:bg-[#00a8cc]/20 transition-colors">Biology</button>
          <button className="tag hover:bg-[#00a8cc]/20 transition-colors">Chemistry</button>
          <button className="tag hover:bg-[#00a8cc]/20 transition-colors">Computer Science</button>
          <button className="tag hover:bg-[#00a8cc]/20 transition-colors">Environmental</button>
        </div>
      </div>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[#005577] mb-6">Active Campaigns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeExperiments.map((exp) => (
            <div key={exp.id} className="experiment-card">
              <Link href={`/experiments/${exp.id}`}>
                <h3 className="card-title hover:text-[#0077a3] transition-colors cursor-pointer">{exp.title}</h3>
              </Link>
              <p className="text-sm text-[#0077a3] mb-2">by {exp.researcher}</p>
              <p className="card-description">{exp.description}</p>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#005577] font-medium">
                    ${exp.raised.toLocaleString()} raised
                  </span>
                  <span className="text-[#0077a3]">
                    {Math.round((exp.raised / exp.goal) * 100)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${(exp.raised / exp.goal) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-sm text-[#0a3d4d] mb-4">
                <span>{exp.backers} backers</span>
                <span className={exp.daysLeft <= 7 ? "text-red-600 font-semibold" : ""}>
                  {exp.daysLeft} days left
                </span>
              </div>

              <div className="mb-4">
                {exp.tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>

              <Link href={`/experiments/${exp.id}`} className="w-full btn-primary text-sm block text-center">
                View Details
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-[#005577] mb-6">Successfully Funded</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fundedExperiments.map((exp) => (
            <div key={exp.id} className="experiment-card opacity-90">
              <div className="absolute top-4 right-4 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Funded!
              </div>
              <Link href={`/experiments/${exp.id}`}>
                <h3 className="card-title hover:text-[#0077a3] transition-colors cursor-pointer">{exp.title}</h3>
              </Link>
              <p className="text-sm text-[#0077a3] mb-2">by {exp.researcher}</p>
              <p className="card-description">{exp.description}</p>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#005577] font-medium">
                    ${exp.raised.toLocaleString()} raised
                  </span>
                  <span className="text-green-600 font-semibold">100%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill bg-green-500"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-sm text-[#0a3d4d] mb-4">
                <span>{exp.backers} backers</span>
                <span className="text-green-600">Completed</span>
              </div>

              <div className="mb-4">
                {exp.tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>

              <button className="w-full bg-gray-200 text-gray-600 font-semibold py-3 px-8 rounded-lg cursor-not-allowed">
                View Results
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}