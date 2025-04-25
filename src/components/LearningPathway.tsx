"use client";

import { useState, useEffect } from "react";
import { CheckCircle, ChevronDown, ChevronUp, FileText, Youtube, Code, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Topic {
  id: string;
  title: string;
  completed: boolean;
  articleLink?: string;
  youtubeLink?: string;
  practiceLink?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  starred?: boolean;
}

interface Step {
  id: string;
  title: string;
  topics: Topic[];
}

interface PathwayData {
  steps: Step[];
}

export default function LearningPathway() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pathwayData, setPathwayData] = useState<PathwayData | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [topic, setTopic] = useState("");

  const generatePathway = async () => {
    if (!topic) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate pathway");
      }

      const data = await response.json();
      setPathwayData(data);
      
      // Expand the first step by default
      if (data.steps && data.steps.length > 0) {
        setExpandedSteps({ [data.steps[0].id]: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const toggleTopicCompletion = (stepId: string, topicId: string) => {
    if (!pathwayData) return;

    setPathwayData((prevData) => {
      if (!prevData) return prevData;

      return {
        ...prevData,
        steps: prevData.steps.map((step) => {
          if (step.id === stepId) {
            return {
              ...step,
              topics: step.topics.map((topic) => {
                if (topic.id === topicId) {
                  return {
                    ...topic,
                    completed: !topic.completed,
                  };
                }
                return topic;
              }),
            };
          }
          return step;
        }),
      };
    });
  };

  const toggleStar = (stepId: string, topicId: string) => {
    if (!pathwayData) return;

    setPathwayData((prevData) => {
      if (!prevData) return prevData;

      return {
        ...prevData,
        steps: prevData.steps.map((step) => {
          if (step.id === stepId) {
            return {
              ...step,
              topics: step.topics.map((topic) => {
                if (topic.id === topicId) {
                  return {
                    ...topic,
                    starred: !topic.starred,
                  };
                }
                return topic;
              }),
            };
          }
          return step;
        }),
      };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      {/* Input Section */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Generate Learning Pathway
          </h1>
          <div className="flex gap-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a topic (e.g., JavaScript, Machine Learning)"
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={generatePathway}
              disabled={loading || !topic}
              className={cn(
                "px-4 py-2 rounded-md text-white",
                loading
                  ? "bg-gray-400 dark:bg-gray-600"
                  : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              )}
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      </div>

      {/* Pathway Content */}
      {pathwayData && (
        <div className="max-w-4xl mx-auto space-y-6">
          {pathwayData.steps.map((step) => (
            <div
              key={step.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
            >
              {/* Step Header */}
              <div
                className="flex justify-between items-center p-4 cursor-pointer border-b border-gray-200 dark:border-gray-700"
                onClick={() => toggleStep(step.id)}
              >
                <h3 className="text-gray-900 dark:text-white font-medium">
                  {step.title}
                </h3>
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  {expandedSteps[step.id] ? (
                    <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
              </div>

              {/* Step Content */}
              {expandedSteps[step.id] && (
                <div className="p-4">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <th className="p-4">Status</th>
                        <th className="p-4">Topic</th>
                        <th className="p-4">Resources</th>
                        <th className="p-4">Difficulty</th>
                        <th className="p-4">Revision</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {step.topics.map((topic) => (
                        <tr key={topic.id}>
                          <td className="p-4">
                            <button
                              onClick={() => toggleTopicCompletion(step.id, topic.id)}
                              className="focus:outline-none"
                            >
                              <CheckCircle
                                className={cn(
                                  "w-5 h-5",
                                  topic.completed
                                    ? "text-green-500 fill-current"
                                    : "text-gray-300 dark:text-gray-600"
                                )}
                              />
                            </button>
                          </td>
                          <td className="p-4 text-gray-900 dark:text-white">
                            {topic.title}
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-3">
                              {topic.articleLink && (
                                <a
                                  href={topic.articleLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                >
                                  <FileText className="w-5 h-5" />
                                </a>
                              )}
                              {topic.youtubeLink && (
                                <a
                                  href={topic.youtubeLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                >
                                  <Youtube className="w-5 h-5" />
                                </a>
                              )}
                              {topic.practiceLink && (
                                <a
                                  href={topic.practiceLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                                >
                                  <Code className="w-5 h-5" />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                {
                                  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200":
                                    topic.difficulty === "Easy",
                                  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200":
                                    topic.difficulty === "Medium",
                                  "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200":
                                    topic.difficulty === "Hard",
                                }
                              )}
                            >
                              {topic.difficulty}
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => toggleStar(step.id, topic.id)}
                              className="focus:outline-none"
                            >
                              <Star
                                className={cn(
                                  "w-5 h-5",
                                  topic.starred
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300 dark:text-gray-600"
                                )}
                              />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 