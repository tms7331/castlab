"use client";

import { useState } from "react";

export default function SuggestPage() {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    hypothesis: "",
    methodology: "",
    budget: "",
    timeline: "",
    researcher: "",
    email: "",
    farcaster: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    alert("Thank you for your submission! We'll review your experiment proposal and get back to you soon.");
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-[#005577] mb-4 text-center">
          Suggest an Experiment
        </h1>
        
        <p className="text-center text-[#0a3d4d] mb-8">
          Have a scientific question that needs answering? Submit your experiment proposal 
          and let the community help bring it to life.
        </p>

        <form onSubmit={handleSubmit} className="experiment-card">
          <div className="space-y-6">
            <div>
              <label className="block text-[#005577] font-semibold mb-2">
                Experiment Title *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                placeholder="Give your experiment a compelling title"
              />
            </div>

            <div>
              <label className="block text-[#005577] font-semibold mb-2">
                Category *
              </label>
              <select
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
              >
                <option value="">Select a category</option>
                <option value="physics">Physics</option>
                <option value="biology">Biology</option>
                <option value="chemistry">Chemistry</option>
                <option value="computer-science">Computer Science</option>
                <option value="environmental">Environmental Science</option>
                <option value="neuroscience">Neuroscience</option>
                <option value="materials">Materials Science</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[#005577] font-semibold mb-2">
                Description *
              </label>
              <textarea
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                placeholder="Describe your experiment and its significance"
              />
            </div>

            <div>
              <label className="block text-[#005577] font-semibold mb-2">
                Hypothesis
              </label>
              <textarea
                name="hypothesis"
                value={formData.hypothesis}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                placeholder="What do you expect to discover?"
              />
            </div>

            <div>
              <label className="block text-[#005577] font-semibold mb-2">
                Methodology
              </label>
              <textarea
                name="methodology"
                value={formData.methodology}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                placeholder="How will the experiment be conducted?"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[#005577] font-semibold mb-2">
                  Estimated Budget ($) *
                </label>
                <input
                  type="number"
                  name="budget"
                  required
                  value={formData.budget}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                  placeholder="10000"
                />
              </div>

              <div>
                <label className="block text-[#005577] font-semibold mb-2">
                  Timeline (weeks) *
                </label>
                <input
                  type="number"
                  name="timeline"
                  required
                  value={formData.timeline}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                  placeholder="12"
                />
              </div>
            </div>

            <div className="border-t border-[#00a8cc]/20 pt-6">
              <h3 className="text-xl font-bold text-[#005577] mb-4">Contact Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[#005577] font-semibold mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    name="researcher"
                    required
                    value={formData.researcher}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                    placeholder="Dr. Jane Smith"
                  />
                </div>

                <div>
                  <label className="block text-[#005577] font-semibold mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                    placeholder="jane.smith@university.edu"
                  />
                </div>

                <div>
                  <label className="block text-[#005577] font-semibold mb-2">
                    Farcaster Handle
                  </label>
                  <input
                    type="text"
                    name="farcaster"
                    value={formData.farcaster}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-[#00a8cc]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a8cc] bg-white/50"
                    placeholder="@janesmith"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <button type="submit" className="btn-primary">
                Submit Proposal
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}