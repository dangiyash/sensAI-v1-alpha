"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getHistory, clearHistory, HistoryItem } from "@/utils/history";
import { Clock, Trash2 } from "lucide-react";

export default function HistoryPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
    setHistory(getHistory());
  }, [status, router]);

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Learning Path</h1>
        <button
          onClick={handleClearHistory}
          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-800"
        >
          <Trash2 className="w-4 h-4" />
          Clear History
        </button>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No history found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {item.language}
                  </h2>
                  <p className="text-gray-600">{item.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(item.timestamp).toLocaleString('en-US', {
                      month: 'numeric',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                      hour12: true
                    })}
                  </span>
                  <button
                    onClick={() => router.push(item.path)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    View Path
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 