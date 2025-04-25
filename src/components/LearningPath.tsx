"use client";
import { useState } from "react";

interface LearningPathItem {
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  concept: string;
}

interface LearningPathProps {
  items: LearningPathItem[];
  language: string;
  progress: number;
  setProgress: (progress: number) => void;
}

export default function LearningPath({ items, language, progress, setProgress }: LearningPathProps) {
  const [selectedContent, setSelectedContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [generatingContent, setGeneratingContent] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleItemClick = async (item: LearningPathItem) => {
    if (completedItems.has(item.title)) return;
    
    setLoading(true);
    setGeneratingContent(true);
    setError(null);
    
    try {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: item.title, language }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to generate content");
      }

      setSelectedContent(data.content);
      
      // Mark item as completed and update progress
      setCompletedItems(prev => {
        const newSet = new Set(prev);
        newSet.add(item.title);
        return newSet;
      });
      
      // Update progress
      const newProgress = (completedItems.size + 1) / items.length * 100;
      setProgress(newProgress);
    } catch (error) {
      console.error("Error generating content:", error);
      setError(error instanceof Error ? error.message : "Failed to generate content. Please try again.");
    } finally {
      setLoading(false);
      setGeneratingContent(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Learning Progress</h2>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">{Math.round(progress)}% Complete</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">Your Learning Path</h2>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  completedItems.has(item.title)
                    ? "bg-green-50 border-green-200"
                    : "bg-white border-gray-200 hover:border-blue-500"
                }`}
                onClick={() => handleItemClick(item)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                  {completedItems.has(item.title) && (
                    <span className="text-green-500">✓</span>
                  )}
                </div>
                <div className="mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    item.difficulty === "beginner" ? "bg-green-100 text-green-800" :
                    item.difficulty === "intermediate" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {item.difficulty}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">{item.concept}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Learning Content</h2>
          {error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          ) : generatingContent ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-gray-50 rounded-lg">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-gray-800">Generating Learning Content</p>
                <p className="text-sm text-gray-500">This may take a few moments...</p>
                <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : selectedContent ? (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: selectedContent }} />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">Click on a learning path item to view its content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 