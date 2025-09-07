"use client";

import Link from "next/link";
import { useState } from "react";

export default function MyExperimentsPage() {
  // Mock data for user's funded experiments
  const [myExperiments] = useState([
    {
      id: 1,
      title: "What Rap Music Goes the Hardest, Objectively",
      amountFunded: 50,
      totalRaised: 325,
      goal: 500,
      status: "in_progress",
      fundedDate: "2024-01-05",
      hasResults: false
    },
    {
      id: 3,
      title: "Canine Classical Music Discrimination",
      amountFunded: 25,
      totalRaised: 156,
      goal: 800,
      status: "in_progress",
      fundedDate: "2024-01-12",
      hasResults: false
    },
    {
      id: 6,
      title: "The Mathematics of Perfect Pizza",
      amountFunded: 100,
      totalRaised: 3200,
      goal: 3000,
      status: "completed",
      fundedDate: "2023-12-15",
      hasResults: true
    }
  ]);

  const handleWithdraw = (experimentId: number) => {
    // Handle withdrawal logic
    alert(`Withdrawal requested for experiment ${experimentId}`);
  };

  const handleViewResults = (experimentId: number) => {
    // Handle view results logic
    alert(`Viewing results for experiment ${experimentId}`);
  };

  const totalInvested = myExperiments.reduce((sum, exp) => sum + exp.amountFunded, 0);
  const activeInvestments = myExperiments.filter(exp => exp.status === "in_progress").length;
  const completedInvestments = myExperiments.filter(exp => exp.status === "completed").length;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-[#005577] mb-8">My Experiments</h1>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="experiment-card text-center">
            <p className="text-2xl font-bold text-[#00a8cc]">${totalInvested}</p>
            <p className="text-sm text-[#0a3d4d]">Total Invested</p>
          </div>
          <div className="experiment-card text-center">
            <p className="text-2xl font-bold text-[#00a8cc]">{activeInvestments}</p>
            <p className="text-sm text-[#0a3d4d]">Active Experiments</p>
          </div>
          <div className="experiment-card text-center">
            <p className="text-2xl font-bold text-[#00a8cc]">{completedInvestments}</p>
            <p className="text-sm text-[#0a3d4d]">Completed</p>
          </div>
        </div>

        {/* Experiments List */}
        <div className="space-y-4">
          {myExperiments.length === 0 ? (
            <div className="experiment-card text-center py-12">
              <p className="text-lg text-[#0a3d4d] mb-4">You haven't funded any experiments yet</p>
              <Link href="/" className="btn-primary">
                Explore Experiments
              </Link>
            </div>
          ) : (
            myExperiments.map((exp) => (
              <div key={exp.id} className="experiment-card">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-grow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Link href={`/experiments/${exp.id}`}>
                          <h3 className="text-lg md:text-xl font-semibold text-[#005577] hover:text-[#0077a3] transition-colors cursor-pointer">
                            {exp.title}
                          </h3>
                        </Link>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-[#0a3d4d]">
                          <span>
                            Your contribution: <span className="font-semibold text-[#00a8cc]">${exp.amountFunded}</span>
                          </span>
                          <span>
                            Total raised: ${exp.totalRaised} / ${exp.goal}
                          </span>
                          <span>
                            Funded on: {new Date(exp.fundedDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        exp.status === 'completed' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {exp.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="progress-bar h-2">
                        <div 
                          className="progress-fill"
                          style={{ width: `${Math.min((exp.totalRaised / exp.goal) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-[#0077a3] mt-1">
                        {Math.round((exp.totalRaised / exp.goal) * 100)}% funded
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      {exp.hasResults ? (
                        <button 
                          onClick={() => handleViewResults(exp.id)}
                          className="px-4 py-2 bg-gradient-to-r from-[#00c9a7] to-[#00a8cc] text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                        >
                          View Results
                        </button>
                      ) : (
                        <button 
                          disabled
                          className="px-4 py-2 bg-gray-200 text-gray-500 font-medium rounded-lg cursor-not-allowed"
                        >
                          Results Pending
                        </button>
                      )}
                      
                      {exp.status === 'in_progress' && (
                        <button 
                          onClick={() => handleWithdraw(exp.id)}
                          className="px-4 py-2 border border-red-500 text-red-500 font-medium rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-[#e8f5f7] rounded-lg">
          <p className="text-sm text-[#0a3d4d]">
            <strong>Note:</strong> Withdrawals are only available for experiments still in funding. 
            Once an experiment is fully funded and research begins, contributions cannot be withdrawn. 
            Results will be available once the experiment is completed.
          </p>
        </div>
      </div>
    </div>
  );
}