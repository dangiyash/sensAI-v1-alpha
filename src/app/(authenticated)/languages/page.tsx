"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function LanguagesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'explore' | 'make'>('explore');
  const [searchQuery, setSearchQuery] = useState("");
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [customLanguage, setCustomLanguage] = useState({
    name: "",
    description: "",
    concepts: ""
  });
  const [error, setError] = useState("");
  const [customTopics, setCustomTopics] = useState<any[]>([]);
  const [generatingConcepts, setGeneratingConcepts] = useState(false);

  // Load custom topics from localStorage on component mount
  useEffect(() => {
    const storedTopics = localStorage.getItem("customTopics");
    if (storedTopics) {
      setCustomTopics(JSON.parse(storedTopics));
    }
  }, []);

  // Filter custom topics based on search query
  const filteredCustomTopics = customTopics.filter(topic =>
    topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generateConcepts = async () => {
    if (!customLanguage.name.trim() || !customLanguage.description.trim()) {
      setError("Name and description are required to generate concepts");
      return;
    }

    setGeneratingConcepts(true);
    const [error, setError] = useState<string | null>(null);

    try {
      const response = await fetch("/api/generate-concepts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: customLanguage.name,
          description: customLanguage.description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to generate concepts");
      }

      if (!data.concepts || !Array.isArray(data.concepts) || data.concepts.length === 0) {
        throw new Error("No concepts were generated");
      }

      setCustomLanguage((prev) => ({
        ...prev,
        concepts: data.concepts.join(", "),
      }));
    } catch (err) {
      console.error("Error generating concepts:", err);
      setError(err instanceof Error ? err.message : "Failed to generate concepts. Please try again.");
    } finally {
      setGeneratingConcepts(false);
    }
  };

  const handleTopicSelect = (topic: any) => {
    setSelectedTopic(topic);
    setShowChoiceModal(true);
  };

  const handlePathChoice = (goToAssessment: boolean) => {
    if (selectedTopic) {
      localStorage.setItem("customLanguage", JSON.stringify({
        name: selectedTopic.name,
        description: selectedTopic.description,
        concepts: selectedTopic.concepts
      }));
      router.push(goToAssessment 
        ? `/assessment?language=${encodeURIComponent(selectedTopic.name.toLowerCase())}`
        : `/tutor?language=${encodeURIComponent(selectedTopic.name.toLowerCase())}`
      );
    }
    setShowChoiceModal(false);
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    router.push("/");
    return null;
  }

  const handleCustomSubmit = () => {
    if (!customLanguage.name.trim()) {
      setError("Language name is required");
      return;
    }
    if (!customLanguage.description.trim()) {
      setError("Description is required");
      return;
    }
    if (!customLanguage.concepts.trim()) {
      setError("Please generate concepts first");
      return;
    }

    // Store custom language data in localStorage
    const newCustomLanguage = {
      ...customLanguage,
      concepts: customLanguage.concepts.split(',').map(concept => concept.trim())
    };
    localStorage.setItem("customLanguage", JSON.stringify(newCustomLanguage));
    
    // Update custom topics list
    const updatedTopics = [...customTopics, newCustomLanguage];
    setCustomTopics(updatedTopics);
    localStorage.setItem("customTopics", JSON.stringify(updatedTopics));

    // Show choice modal instead of direct navigation
    setSelectedTopic(newCustomLanguage);
    setShowChoiceModal(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Hi {session?.user?.name || 'there'}, What do you want to Learn?
      </h1>

      {/* Toggle Tabs */}
      <div className="relative mb-8">
        <div className="flex bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setActiveTab('explore')}
            className={`relative flex-1 py-3 px-6 text-center font-medium transition-colors duration-200 z-10 ${
              activeTab === 'explore'
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Explore Topics
          </button>
          <button
            onClick={() => setActiveTab('make')}
            className={`relative flex-1 py-3 px-6 text-center font-medium transition-colors duration-200 z-10 ${
              activeTab === 'make'
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Make Your Own
          </button>
        </div>
        <div 
          className={`absolute top-1 h-[calc(100%-2px)] w-1/2 rounded-full transition-all duration-300 ease-in-out ${
            activeTab === 'explore' ? 'left-1' : 'left-[calc(50%+1px)]'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-full shadow-lg backdrop-blur-sm"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full"></div>
        </div>
      </div>

      {/* Choice Modal */}
      {showChoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              How would you like to proceed with {selectedTopic?.name}?
            </h2>
            <div className="space-y-4">
              <button
                onClick={() => handlePathChoice(true)}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
              >
                Take Assessment First
                <p className="text-sm text-blue-100 mt-1">
                  Get personalized recommendations based on your current knowledge
                </p>
              </button>
              <button
                onClick={() => handlePathChoice(false)}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
              >
                Go Directly to Tutor
                <p className="text-sm text-indigo-100 mt-1">
                  Start learning right away with our AI tutor
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explore Tab Content */}
      {activeTab === 'explore' && (
        <div>
          {/* Search Bar for Custom Topics */}
          {customTopics.length > 0 && (
            <div className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search your custom topics..."
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Custom Topics */}
          {filteredCustomTopics.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredCustomTopics.map((topic) => (
                <button
                  key={topic.name}
                  onClick={() => handleTopicSelect(topic)}
                  className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-105 text-white"
                >
                  <div className="text-4xl mb-4">✨</div>
                  <h2 className="text-xl font-semibold mb-2">
                    {topic.name}
                  </h2>
                  <p className="text-gray-100">
                    {topic.description}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Make Your Own Tab Content */}
      {activeTab === 'make' && (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Your Own Learning Path</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic Name</label>
              <input
                type="text"
                value={customLanguage.name}
                onChange={(e) => setCustomLanguage({ ...customLanguage, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your topic name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={customLanguage.description}
                onChange={(e) => setCustomLanguage({ ...customLanguage, description: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe what you want to learn"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key Concepts</label>
              <div className="flex gap-2">
                <textarea
                  value={customLanguage.concepts}
                  onChange={(e) => setCustomLanguage({ ...customLanguage, concepts: e.target.value })}
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter key concepts separated by commas"
                  rows={3}
                />
                <button
                  onClick={generateConcepts}
                  disabled={generatingConcepts}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingConcepts ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </div>
                  ) : (
                    "Generate automatically"
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <button
              onClick={handleCustomSubmit}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Learning Path
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 
