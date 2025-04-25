'use client';

import { useState } from 'react';

export default function Assessment() {
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const questions = [
    {
      id: 1,
      concept: "Learning Goal",
      text: "What is your learning goal?",
      options: [
        "No knowledge",
        "Basic understanding",
        "Intermediate knowledge",
        "Advanced knowledge"
      ]
    },
    {
      id: 2,
      concept: "Time Commitment",
      text: "How much time can you dedicate?",
      options: [
        "Less than 1 hour per week",
        "1-3 hours per week",
        "3-5 hours per week",
        "More than 5 hours per week"
      ]
    }
  ];

  const handleSubmit = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Store assessment data in localStorage
      const assessmentData = {
        language: "Custom",
        answers: questions.map((q) => ({
          concept: q.concept,
          answer: answers[q.id],
          options: q.options
        })),
        customLanguage: JSON.parse(localStorage.getItem("customLanguage") || "{}")
      };

      localStorage.setItem("currentAssessment", JSON.stringify(assessmentData));

      const response = await fetch("/api/evaluate-answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assessmentData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit assessment");
      }

      const data = await response.json();
      setResults(data);
      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Learning Assessment</h1>
      
      {!isSubmitted ? (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">{questions[currentQuestion].text}</h2>
            <div className="space-y-2">
              {questions[currentQuestion].options.map((option, index) => (
                <label key={index} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${questions[currentQuestion].id}`}
                    value={option}
                    checked={answers[questions[currentQuestion].id] === option}
                    onChange={(e) => setAnswers({ ...answers, [questions[currentQuestion].id]: e.target.value })}
                    className="form-radio"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            {currentQuestion > 0 && (
              <button
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Previous
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!answers[questions[currentQuestion].id]}
              className={`px-4 py-2 rounded-lg ${
                !answers[questions[currentQuestion].id]
                  ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {currentQuestion < questions.length - 1 ? "Next" : "Submit"}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Assessment Submitted!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your learning path is being generated. You can view it in the Tutor section.
          </p>
          <a
            href="/tutor"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Tutor
          </a>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}