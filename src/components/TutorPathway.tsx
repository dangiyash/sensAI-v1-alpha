"use client";

import { useState, useEffect } from "react";
import { Check, ChevronDown, ChevronRight, Star, Loader2 } from "lucide-react";
import { addToHistory } from "@/utils/history";

interface Topic {
  title: string;
  description: string;
  keyPrinciples: string[];
  applications: {
    title: string;
    description: string;
    example: string;
  }[];
  exercises: {
    title: string;
    description: string;
    difficulty: string;
  }[];
  resources: {
    title: string;
    type: string;
    url: string;
    description: string;
  }[];
}

interface PathwayData {
  topics: Topic[];
}

export default function TutorPathway() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pathwayData, setPathwayData] = useState<PathwayData | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [starredTopics, setStarredTopics] = useState<Set<string>>(new Set());
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [customLanguage, setCustomLanguage] = useState<any>(null);
  const [assessmentData, setAssessmentData] = useState<any>(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    try {
      const storedCustomLanguage = localStorage.getItem("customLanguage");
      if (storedCustomLanguage) {
        setCustomLanguage(JSON.parse(storedCustomLanguage));
      }

      const storedAssessment = localStorage.getItem("currentAssessment");
      if (storedAssessment) {
        setAssessmentData(JSON.parse(storedAssessment));
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error);
    }
  }, []);

  const generatePathway = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: customLanguage?.name || "Python",
          customLanguage,
          assessmentData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate learning path");
      }

      const data = await response.json();
      setPathwayData(data);

      // Store the generated pathway in localStorage
      localStorage.setItem("currentPathway", JSON.stringify(data));

      // Add to history if it's a custom language
      if (customLanguage) {
        addToHistory({
          language: customLanguage.name,
          description: customLanguage.description,
          path: `/tutor?language=${encodeURIComponent(customLanguage.name)}`
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const toggleTopicCompletion = (topicId: string) => {
    setCompletedTopics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  const toggleStar = (topicId: string) => {
    setStarredTopics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Learning Path</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Generate a personalized learning path based on your skill gaps and interests.
        </p>

        <div className="flex gap-4">
          <button
            onClick={generatePathway}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Learning Path"
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {pathwayData && (
        <div className="space-y-6">
          {pathwayData.topics.map((topic, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
            >
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => toggleStep(`step-${index}`)}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTopicCompletion(`topic-${index}`);
                    }}
                    className={`w-5 h-5 rounded border flex items-center justify-center ${
                      completedTopics.has(`topic-${index}`)
                        ? "bg-green-500 border-green-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {completedTopics.has(`topic-${index}`) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </button>
                  <h3 className="font-medium">{topic.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStar(`topic-${index}`);
                    }}
                    className={`p-1 rounded-full ${
                      starredTopics.has(`topic-${index}`)
                        ? "text-yellow-500"
                        : "text-gray-400 hover:text-yellow-500"
                    }`}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        starredTopics.has(`topic-${index}`) ? "fill-current" : ""
                      }`}
                    />
                  </button>
                  {expandedSteps.has(`step-${index}`) ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {expandedSteps.has(`step-${index}`) && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      {topic.description}
                    </p>

                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Key Principles:</h4>
                      <ul className="list-disc pl-4 space-y-1">
                        {topic.keyPrinciples.map((principle, i) => (
                          <li key={i} className="text-gray-600 dark:text-gray-400">
                            {principle}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Applications:</h4>
                      {topic.applications.map((app, i) => (
                        <div key={i} className="mb-3">
                          <h5 className="font-medium">{app.title}</h5>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">
                            {app.description}
                          </p>
                          <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-sm overflow-x-auto">
                            {app.example}
                          </pre>
                        </div>
                      ))}
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Exercises:</h4>
                      {topic.exercises.map((exercise, i) => (
                        <div
                          key={i}
                          className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium">{exercise.title}</h5>
                              <p className="text-gray-600 dark:text-gray-400">
                                {exercise.description}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                exercise.difficulty === "Beginner"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                  : exercise.difficulty === "Intermediate"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                              }`}
                            >
                              {exercise.difficulty}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Resources:</h4>
                      <div className="grid gap-3">
                        {topic.resources.map((resource, i) => (
                          <a
                            key={i}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-medium">{resource.title}</h5>
                                <p className="text-gray-600 dark:text-gray-400">
                                  {resource.description}
                                </p>
                              </div>
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
                                {resource.type}
                              </span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 