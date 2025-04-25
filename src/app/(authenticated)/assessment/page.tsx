"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

interface Question {
  id: number;
  question: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  concept: string;
  options?: string[];
}

export default function AssessmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);

  const language = searchParams.get("language") || "python";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/generate-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch questions");
        }

        const data = await response.json();
        setQuestions(data.questions || []);
      } catch (error) {
        console.error("Error fetching questions:", error);
        setError("Failed to load questions. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, [language]);

  const handleAnswerChange = (id: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvaluating(true);
    setError(null);

    try {
      // Check if all questions are answered
      const unansweredQuestions = questions.filter(q => !answers[q.id]);
      if (unansweredQuestions.length > 0) {
        throw new Error(`Please answer all questions before submitting. Questions ${unansweredQuestions.map(q => q.id).join(', ')} are unanswered.`);
      }

      // Create a simple assessment result
      const assessmentResult = {
        skillGap: {
          title: "Basic Assessment Results",
          detail: "Based on your answers, we've identified areas for improvement."
        },
        learningPath: [
          {
            title: "Start Learning",
            description: "Begin your learning journey with our interactive tutor",
            importance: "Get hands-on experience with real-world examples",
            examples: ["Interactive coding exercises", "Step-by-step tutorials"],
            resources: [
              {
                title: "Interactive Tutor",
                url: `/tutor?language=${language}`,
                type: "Interactive",
                description: "Learn through hands-on practice"
              }
            ]
          }
        ]
      };

      // Store the result in localStorage
      localStorage.setItem("assessmentResult", JSON.stringify(assessmentResult));
      
      // Redirect to learning path with the result
      router.push(`/learning-path?language=${language}`);
    } catch (error) {
      console.error("Error submitting answers:", error);
      setError(error instanceof Error ? error.message : "Failed to submit answers. Please try again.");
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextQuestion = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePreviousQuestion = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {language.charAt(0).toUpperCase() + language.slice(1)} Assessment
        </h1>
        <p className="text-gray-600">
          Test your knowledge and get personalized learning recommendations
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-md">
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
      ) : questions.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg shadow-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">No questions available.</p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>
            <span className="ml-4 text-sm text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
            </span>
          </div>

          {/* Question card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                questions[currentQuestion].difficulty === "beginner"
                  ? "bg-green-100 text-green-800"
                  : questions[currentQuestion].difficulty === "intermediate"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}>
                {questions[currentQuestion].difficulty}
              </span>
              <span className="text-sm text-gray-500">
                {questions[currentQuestion].concept}
              </span>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {questions[currentQuestion].question}
            </h3>

            <textarea
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              rows={6}
              value={answers[questions[currentQuestion].id] || ""}
              onChange={(e) => handleAnswerChange(questions[currentQuestion].id, e.target.value)}
              placeholder="Type your answer here..."
            />
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handlePreviousQuestion}
              disabled={currentQuestion === 0}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentQuestion === questions.length - 1 ? (
              <button
                type="submit"
                disabled={evaluating}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {evaluating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Evaluating...
                  </span>
                ) : (
                  "Submit Assessment"
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextQuestion}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Next
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
} 