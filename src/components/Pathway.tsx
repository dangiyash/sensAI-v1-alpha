"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import QueryForm from "@/components/QueryForm";
 import PythonAssessment from "@/components/PythonAssesment";

export default function Dashboard() {
  const { data: session } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [aiReport, setAIReport] = useState<any>(null);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  if (!session) {
    return (
      <div className="p-8">
        <p>You must be logged in to view this page.</p>
        <button
          onClick={() => signIn()}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        {!evaluationResult && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Python
          </button>
        )}
        <button
          onClick={() => signOut()}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Sign Out
        </button>
      </header>

      {showForm && (
        <PythonAssessment
          onEvaluation={(result) => {
            setEvaluationResult(result);
            setShowForm(false);
          }}
        />
      )}

      {!evaluationResult && (
        <QueryForm onResult={(report) => setAIReport(report)} />
      )}

      {aiReport && (
        <div className="mt-8 border-t pt-4">
          <h2 className="text-xl font-bold mb-2">Your Personalized Report</h2>
          <p><strong>Report:</strong> {aiReport.report}</p>
          <p><strong>Roadmap:</strong> {aiReport.roadmap}</p>
          <p><strong>AI Mentor Content:</strong> {aiReport.mentorContent}</p>
        </div>
      )}

      {evaluationResult && (
        <div className="mt-8 border-t pt-4">
          <h2 className="text-xl font-bold mb-2">Python Assessment Results</h2>
          <p><strong>Skill Gaps:</strong> {evaluationResult.skillGap}</p>
        </div>
      )}
    </div>
  );
}
