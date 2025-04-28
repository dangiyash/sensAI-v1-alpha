"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
//import QueryForm from "@/components/QueryForm";
 //import PythonAssessment from "@/components/PythonAssesment";

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
       <p>hei</p>
    </div>
  );
}
