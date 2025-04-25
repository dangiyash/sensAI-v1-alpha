"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navigation = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Learn/Assess a Topic", href: "/languages" },
    { name: "Current Learning Path", href: "/tutor" },
    { name: "Recent Evaluation", href: "/learning-path" },
    { name: "History", href: "/history" }
  ];

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (session) {
      router.push("/dashboard");
    } else {
      router.push("/");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return children;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`fixed left-0 top-1/2 -translate-y-1/2 z-50 bg-white dark:bg-gray-800 p-2 rounded-r-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 ${
            isSidebarOpen ? 'translate-x-64' : 'translate-x-0'
          }`}
        >
          {isSidebarOpen ? (
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>

        {/* Sidebar */}
        <div
          className={`w-64 flex-shrink-0 border-r border-gray-200 bg-white shadow-lg transition-all duration-300 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-64'
          }`}
        >
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-gray-200">
              <a href="#" onClick={handleLogoClick} className="group">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <span className="text-3xl font-semibold tracking-tighter text-gray-950 dark:text-gray-700">
                      Sens
                    </span>
                    <span className="text-3xl font-bold text-blue-900 dark:text-blue-300">
                      AI
                    </span>
                  </div>
                  <div className="h-5 w-5 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-blue-700 dark:from-blue-300 dark:to-blue-400 rounded-full opacity-10"></div>
                    <div className="absolute inset-0.5 bg-white dark:bg-gray-900 rounded-full"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="h-2.5 w-2.5 text-blue-900 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </a>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                        : "text-gray-700 hover:bg-gradient-to-r hover:from-cyan-400/10 hover:to-blue-500/10 hover:text-cyan-600 hover:shadow-[0_0_10px_rgba(34,211,238,0.3)] hover:translate-x-1"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* User profile and sign out */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img
                    className="h-8 w-8 rounded-full ring-2 ring-cyan-400"
                    src={session.user?.image || "https://ui-avatars.com/api/?name=User"}
                    alt=""
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {session.user?.name}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="text-gray-500 hover:text-cyan-500 transition-colors duration-300 hover:shadow-[0_0_10px_rgba(34,211,238,0.3)] p-1 rounded-full"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className={`flex-1 overflow-auto transition-all duration-300 ${
          isSidebarOpen ? 'ml-0' : '-ml-64'
        }`}>
          <main className="h-full p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 