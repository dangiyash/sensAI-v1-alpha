"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface ProgressData {
  completedAssessments: number;
  totalAssessments: number;
  averageScore: number;
  languages: {
    name: string;
    progress: number;
    lastAssessment: string;
  }[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch from your backend
    // For now, we'll use mock data
    const mockProgress: ProgressData = {
      completedAssessments: 3,
      totalAssessments: 5,
      averageScore: 75,
      languages: [
        {
          name: "Python",
          progress: 60,
          lastAssessment: "2024-03-15",
        },
        {
          name: "C++",
          progress: 40,
          lastAssessment: "2024-03-10",
        },
        {
          name: "C",
          progress: 20,
          lastAssessment: "2024-03-05",
        },
      ],
    };

    setProgress(mockProgress);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome back, {session?.user?.name}! Here's your learning progress.
        </p>

        {/* Overview Cards */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3 relative">
          <div className="bg-white overflow-hidden shadow rounded-lg blur-sm">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Completed Assessments
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {progress?.completedAssessments}/{progress?.totalAssessments}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg blur-sm">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Average Score
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {progress?.averageScore}%
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg blur-sm">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Languages Learned
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {progress?.languages.length}
              </dd>
            </div>
          </div>

          {/* Coming Soon Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-lg shadow-xl text-center">
              <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4">
                Coming Soon
              </h2>
              <p className="text-gray-600">
                We're working on something amazing for your dashboard!
              </p>
            </div>
          </div>
        </div>

        {/* Language Progress */}
        <div className="mt-8 relative">
          <h2 className="text-lg font-medium text-gray-900">Language Progress</h2>
          <div className="mt-4 space-y-6 blur-sm">
            {progress?.languages.map((language) => (
              <div key={language.name} className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      {language.name}
                    </h3>
                    <span className="text-sm text-gray-500">
                      Last assessment: {language.lastAssessment}
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                            Progress
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-blue-600">
                            {language.progress}%
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                        <div
                          style={{ width: `${language.progress}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 