import Link from "next/link";

export default function ExperimentsPage() {
  const experiments = [
    {
      id: 1,
      title: "What Rap Music Goes the Hardest, Objectively",
      oneLiner: "Kendrick vs Drake – which goes the hardest",
      raised: 325,
      goal: 500
    },
    {
      id: 2,
      title: "The Science of Talking to Plants",
      oneLiner: "Do plants actually grow better when you talk to them?",
      raised: 890,
      goal: 1200
    },
    {
      id: 3,
      title: "Canine Classical Music Discrimination",
      oneLiner: "Can dogs distinguish between Beethoven and Bach?",
      raised: 156,
      goal: 800
    },
    {
      id: 4,
      title: "The Optimal Programming Soundtrack",
      oneLiner: "Does coding productivity increase with Lo-fi hip hop vs Death Metal?",
      raised: 2100,
      goal: 2500
    },
    {
      id: 5,
      title: "Teaching Fungi to Play Video Games",
      oneLiner: "Can mushrooms learn to play Pong?",
      raised: 450,
      goal: 1500
    },
    {
      id: 6,
      title: "The Mathematics of Perfect Pizza",
      oneLiner: "Is there a scientifically optimal pizza topping combination?",
      raised: 3200,
      goal: 3000
    }
  ];

  return (
    <>
      <section className="hero-section">
        <div className="container mx-auto px-4">
          <h1 className="hero-title">Fund Weird Science</h1>
          <p className="hero-subtitle">
            Real experiments. Real results. Really fun.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-4">
          {experiments.map((exp) => (
            <Link key={exp.id} href={`/experiments/${exp.id}`}>
              <div className="experiment-card hover:scale-[1.02] cursor-pointer">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h3 className="text-lg md:text-xl font-semibold text-[#005577] flex-grow">
                    {exp.title}
                  </h3>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-sm text-[#0a3d4d]">
                      <span className="font-semibold text-[#00a8cc]">${exp.raised}</span>
                      <span className="text-[#0a3d4d]/60"> / ${exp.goal}</span>
                    </div>
                    
                    <div className="w-24">
                      <div className="progress-bar h-2">
                        <div 
                          className="progress-fill"
                          style={{ width: `${Math.min((exp.raised / exp.goal) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}