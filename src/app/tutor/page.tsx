"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { ChevronRight, ChevronDown, Loader2, ChevronLeft, BookOpen, CheckCircle2, X } from "lucide-react";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import GuruAIChat from "@/components/GuruAIChat";

interface Chapter {
  id: string;
  title: string;
  description: string;
  content?: string | null;
  isExpanded?: boolean;
  isLoading?: boolean;
  expandedConcepts?: { [key: string]: any };
}

interface Module {
  id: string;
  title: string;
  description: string;
  chapters?: Chapter[];
  isExpanded?: boolean;
  isLoading?: boolean;
  isHighlighted?: boolean;
}

export default function TutorPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProgressSidebarOpen, setIsProgressSidebarOpen] = useState(true);
  const [completedChapters, setCompletedChapters] = useState<Set<string>>(new Set());
  const [showChat, setShowChat] = useState(false);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [showAskButton, setShowAskButton] = useState(false);
  const [askButtonPosition, setAskButtonPosition] = useState({ x: 0, y: 0 });
  const contentRef = useRef<HTMLDivElement>(null);
  const [showModuleButton, setShowModuleButton] = useState(false);
  const [isGeneratingModule, setIsGeneratingModule] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState<number | null>(null);
  const [moduleError, setModuleError] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState<number>(Date.now());
  const [currentQuestion, setCurrentQuestion] = useState<string | undefined>(undefined);

  // Load saved progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('completedChapters');
    if (savedProgress) {
      setCompletedChapters(new Set(JSON.parse(savedProgress)));
    }
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('completedChapters', JSON.stringify([...completedChapters]));
  }, [completedChapters]);

  // Add text selection handler
  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const text = selection.toString().trim();
        
        // Find the current module index
        const moduleElements = document.querySelectorAll('[data-module-id]');
        let currentIndex = -1;
        moduleElements.forEach((el, index) => {
          if (el.contains(range.commonAncestorContainer)) {
            currentIndex = index;
          }
        });

        setSelectedTopic(text);
        setCurrentModuleIndex(currentIndex);
        setSelectedText(text);
        setAskButtonPosition({
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY - 40
        });
        setShowAskButton(true);
        setShowModuleButton(true);
      } else {
        setShowAskButton(false);
        setShowModuleButton(false);
        setSelectedTopic(null);
        setCurrentModuleIndex(null);
        setSelectedText(null);
      }
    };

    document.addEventListener('mouseup', handleTextSelection);
    return () => document.removeEventListener('mouseup', handleTextSelection);
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/");
      return;
    }

    const loadInitialModules = async () => {
      try {
        const customLanguage = localStorage.getItem("customLanguage");
        if (!customLanguage) {
          router.push("/languages");
          return;
        }

        // Check if the custom language has changed
        const savedCustomLanguage = localStorage.getItem('lastCustomLanguage');
        if (savedCustomLanguage !== customLanguage) {
          // Clear old modules and progress if the topic has changed
          localStorage.removeItem('tutorModules');
          localStorage.removeItem('completedChapters');
          setCompletedChapters(new Set());
          localStorage.setItem('lastCustomLanguage', customLanguage);
        }

        // Try to load saved modules first
        const savedModules = localStorage.getItem('tutorModules');
        if (savedModules) {
          setModules(JSON.parse(savedModules));
          setIsLoading(false);
          return;
        }

        const { name, description, concepts } = JSON.parse(customLanguage);
        const response = await fetch("/api/generate-modules", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: name,
            description,
            concepts: concepts.join(", "),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate modules");
        }

        const data = await response.json();
        const newModules = data.modules.map((module: any) => ({
          ...module,
          id: Math.random().toString(36).substr(2, 9),
          isExpanded: false,
          isLoading: false,
          chapters: [],
          isHighlighted: false
        }));
        
        setModules(newModules);
        // Save modules to localStorage
        localStorage.setItem('tutorModules', JSON.stringify(newModules));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load modules");
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialModules();
  }, [session, status, router]);

  const handleModuleClick = async (moduleId: string) => {
    setModules(prevModules => 
      prevModules.map(module => {
        if (module.id === moduleId) {
          return {
            ...module,
            isExpanded: !module.isExpanded,
            isLoading: !module.isExpanded && !module.chapters?.length
          };
        }
        return module;
      })
    );

    const module = modules.find(m => m.id === moduleId);
    if (module && !module.chapters?.length && !module.isExpanded) {
      try {
        const response = await fetch("/api/tutor", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language: module.title,
            moduleTitle: module.title,
            moduleDescription: module.description,
            customLanguage: JSON.parse(localStorage.getItem("customLanguage") || "{}"),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to load module content");
        }

        const data = await response.json();
        
        const updatedModules = modules.map(m => {
          if (m.id === moduleId) {
            return {
              ...m,
              isExpanded: true,
              chapters: data.chapters.map((chapter: any) => ({
                id: Math.random().toString(36).substr(2, 9),
                title: chapter.title,
                description: chapter.description,
                isExpanded: false,
                isLoading: false,
                content: null
              })),
              isLoading: false
            };
          }
          return m;
        });

        setModules(updatedModules);
        // Save updated modules to localStorage
        localStorage.setItem('tutorModules', JSON.stringify(updatedModules));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load module content");
        setModules(prevModules =>
          prevModules.map(m => {
            if (m.id === moduleId) {
              return {
                ...m,
                isLoading: false,
                isExpanded: false
              };
            }
            return m;
          })
        );
      }
    }
  };

  const handleChapterClick = async (moduleId: string, chapterId: string) => {
    setModules(prevModules => 
      prevModules.map(module => {
        if (module.id === moduleId) {
          return {
            ...module,
            chapters: module.chapters?.map(chapter => {
              if (chapter.id === chapterId) {
                return {
                  ...chapter,
                  isExpanded: !chapter.isExpanded,
                  isLoading: !chapter.isExpanded && !chapter.content
                };
              }
              return chapter;
            })
          };
        }
        return module;
      })
    );

    const module = modules.find(m => m.id === moduleId);
    const chapter = module?.chapters?.find(c => c.id === chapterId);
    if (chapter && !chapter.content && !chapter.isExpanded) {
      try {
        const response = await fetch("/api/tutor", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language: module?.title,
            chapter: chapter.title,
            customLanguage: JSON.parse(localStorage.getItem("customLanguage") || "{}"),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to load chapter content");
        }

        const data = await response.json();
        
        setModules(prevModules =>
          prevModules.map(m => {
            if (m.id === moduleId) {
              return {
                ...m,
                chapters: m.chapters?.map(c => {
                  if (c.id === chapterId) {
                    return {
                      ...c,
                      content: data.content || JSON.stringify(data),
                      isLoading: false,
                      isExpanded: true
                    };
                  }
                  return c;
                })
              };
            }
            return m;
          })
        );

        // Save updated modules to localStorage
        const updatedModules = modules.map(m => {
          if (m.id === moduleId) {
            return {
              ...m,
              chapters: m.chapters?.map(c => {
                if (c.id === chapterId) {
                  return {
                    ...c,
                    content: data.content || JSON.stringify(data),
                    isLoading: false,
                    isExpanded: true
                  };
                }
                return c;
              })
            };
          }
          return m;
        });
        localStorage.setItem('tutorModules', JSON.stringify(updatedModules));
      } catch (err) {
        console.error("Error loading chapter content:", err);
        setError(err instanceof Error ? err.message : "Failed to load chapter content");
        setModules(prevModules =>
          prevModules.map(m => {
            if (m.id === moduleId) {
              return {
                ...m,
                chapters: m.chapters?.map(c => {
                  if (c.id === chapterId) {
                    return {
                      ...c,
                      isLoading: false,
                      isExpanded: false,
                      content: undefined
                    };
                  }
                  return c;
                })
              };
            }
            return m;
          })
        );
      }
    }
  };

  const handleConceptClick = async (moduleId: string, chapterId: string, concept: string) => {
    setModules(prevModules => 
      prevModules.map(module => {
        if (module.id === moduleId) {
          return {
            ...module,
            chapters: module.chapters?.map(chapter => {
              if (chapter.id === chapterId) {
                return {
                  ...chapter,
                  expandedConcepts: {
                    ...chapter.expandedConcepts,
                    [concept]: {
                      isLoading: true,
                      content: null
                    }
                  }
                };
              }
              return chapter;
            })
          };
        }
        return module;
      })
    );

    try {
      const customLanguage = localStorage.getItem("customLanguage");
      const currentModule = modules.find(m => m.id === moduleId);
      if (!currentModule) {
        throw new Error("Module not found");
      }
      const response = await fetch("/api/generate-concept-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: currentModule.title,
          concept,
          customLanguage: customLanguage ? JSON.parse(customLanguage) : null
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to load concept details");
      }

      const data = await response.json();
      
      setModules(prevModules =>
        prevModules.map(m => {
          if (m.id === moduleId) {
            return {
              ...m,
              chapters: m.chapters?.map(c => {
                if (c.id === chapterId) {
                  return {
                    ...c,
                    expandedConcepts: {
                      ...c.expandedConcepts,
                      [concept]: {
                        isLoading: false,
                        content: data
                      }
                    }
                  };
                }
                return c;
              })
            };
          }
          return m;
        })
      );
    } catch (err) {
      console.error("Error loading concept details:", err);
      setModules(prevModules =>
        prevModules.map(m => {
          if (m.id === moduleId) {
            return {
              ...m,
              chapters: m.chapters?.map(c => {
                if (c.id === chapterId) {
                  return {
                    ...c,
                    expandedConcepts: {
                      ...c.expandedConcepts,
                      [concept]: {
                        isLoading: false,
                        error: "Failed to load concept details"
                      }
                    }
                  };
                }
                return c;
              })
            };
          }
          return m;
        })
      );
    }
  };

  const toggleChapterCompletion = (moduleId: string, chapterId: string) => {
    const chapterKey = `${moduleId}-${chapterId}`;
    setCompletedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterKey)) {
        newSet.delete(chapterKey);
      } else {
        newSet.add(chapterKey);
      }
      return newSet;
    });
  };

  const getModuleProgress = (module: Module) => {
    if (!module.chapters?.length) return 0;
    const totalChapters = module.chapters.length;
    const completed = module.chapters.filter(
      chapter => completedChapters.has(`${module.id}-${chapter.id}`)
    ).length;
    return (completed / totalChapters) * 100;
  };

  const getTotalProgress = () => {
    if (modules.length === 0) return 0;
    
    // Only consider modules that have been generated (have chapters)
    const generatedModules = modules.filter(module => module.chapters && module.chapters.length > 0);
    if (generatedModules.length === 0) return 0;
    
    const totalChapters = generatedModules.reduce((acc, module) => acc + (module.chapters?.length || 0), 0);
    if (totalChapters === 0) return 0;
    
    const completedChaptersCount = generatedModules.reduce((acc, module) => {
      return acc + (module.chapters?.filter(
        chapter => completedChapters.has(`${module.id}-${chapter.id}`)
      ).length || 0);
    }, 0);
    
    return (completedChaptersCount / totalChapters) * 100;
  };

  const scrollToTop = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const handleCreateModule = async () => {
    if (!selectedTopic || currentModuleIndex === null) return;

    setIsGeneratingModule(true);
    setModuleError(null);
    try {
      const response = await fetch('/api/generate-module', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: selectedTopic,
          currentModuleTitle: modules[currentModuleIndex]?.title
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to generate module');
      }

      if (!data.module) {
        throw new Error('Invalid module data received');
      }

      const newModule = {
        ...data.module,
        id: Math.random().toString(36).substr(2, 9),
        isExpanded: false,
        isLoading: false,
        chapters: [],
        isHighlighted: true
      };

      // Insert the new module at the top
      const updatedModules = [newModule, ...modules];
      setModules(updatedModules);
      
      // Save to localStorage
      localStorage.setItem('tutorModules', JSON.stringify(updatedModules));

      // Scroll to top after a short delay to allow the new module to render
      setTimeout(scrollToTop, 100);
    } catch (error) {
      console.error('Error generating module:', error);
      setModuleError(error instanceof Error ? error.message : 'Failed to generate module');
    } finally {
      setIsGeneratingModule(false);
      setShowModuleButton(false);
      setSelectedTopic(null);
      setCurrentModuleIndex(null);
    }
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  const content = (
    <div className="flex h-full">
      {/* Main Content */}
      <div 
        className={`flex-1 transition-all duration-300 overflow-y-auto h-screen ${
          isProgressSidebarOpen ? 'mr-80' : 'mr-0'
        }`} 
        ref={contentRef}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Learning Modules</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Click on a module to view its chapters, then click on a chapter to view its content
            </p>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {moduleError && (
            <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6">
              <div className="flex items-center justify-between">
                <span>{moduleError}</span>
                <button
                  onClick={() => setModuleError(null)}
                  className="text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {modules.map((module) => (
              <div
                key={module.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${
                  module.isHighlighted ? 'border-2 border-green-500' : ''
                }`}
              >
                <div
                  className={`p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    module.isHighlighted ? 'bg-green-50 dark:bg-green-900/20' : ''
                  }`}
                  onClick={() => handleModuleClick(module.id)}
                >
                  <div>
                    <h3 className={`font-medium ${
                      module.isHighlighted ? 'text-green-700 dark:text-green-400' : ''
                    }`}>
                      {module.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{module.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {module.isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        <span className="text-sm text-gray-500">Generating chapters...</span>
                      </div>
                    ) : module.isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {module.isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    {module.isLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                          <span className="text-sm text-gray-500">Generating chapters...</span>
                        </div>
                      </div>
                    ) : module.chapters?.length ? (
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {module.chapters.map((chapter) => (
                          <div key={chapter.id} className="bg-gray-50 dark:bg-gray-700">
                            <div
                              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                              onClick={() => handleChapterClick(module.id, chapter.id)}
                            >
                              <div>
                                <h4 className="font-medium">{chapter.title}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{chapter.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {chapter.isLoading ? (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                    <span className="text-sm text-gray-500">Generating content...</span>
                                  </div>
                                ) : chapter.isExpanded ? (
                                  <ChevronDown className="w-5 h-5 text-gray-400" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                            </div>

                            {chapter.isExpanded && (
                              <div className="p-4 bg-white dark:bg-gray-800">
                                {chapter.isLoading ? (
                                  <div className="flex items-center justify-center p-4">
                                    <div className="flex items-center gap-2">
                                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                      <span className="text-sm text-gray-500">Generating content...</span>
                                    </div>
                                  </div>
                                ) : chapter.content ? (
                                  <div className="prose dark:prose-invert max-w-none">
                                    {(() => {
                                      const content = typeof chapter.content === 'string' 
                                        ? JSON.parse(chapter.content)
                                        : chapter.content;
                                      return (
                                        <div className="space-y-6">
                                          {content.definition && (
                                            <div>
                                              <h4 className="font-medium mb-2">Definition</h4>
                                              <p className="text-gray-600 dark:text-gray-400">
                                                {content.definition}
                                              </p>
                                            </div>
                                          )}
                                          {content.explanation && (
                                            <div>
                                              <h4 className="font-medium mb-2">Explanation</h4>
                                              <p className="text-gray-600 dark:text-gray-400">
                                                {content.explanation}
                                              </p>
                                            </div>
                                          )}
                                          {content.keyPoints && content.keyPoints.length > 0 && (
                                            <div>
                                              <h4 className="font-medium mb-2">Key Points</h4>
                                              <ul className="list-disc pl-4 space-y-1">
                                                {content.keyPoints.map((point: string, i: number) => (
                                                  <li key={i} className="text-gray-600 dark:text-gray-400">
                                                    {point}
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                          {content.applications && content.applications.length > 0 && (
                                            <div>
                                              <h4 className="font-medium mb-2">Applications</h4>
                                              <div className="space-y-4">
                                                {content.applications.map((app: any, i: number) => (
                                                  <div key={i} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                                    <h5 className="font-medium mb-2">{app.title}</h5>
                                                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                                                      {app.description}
                                                    </p>
                                                    {app.example && (
                                                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                          {app.example}
                                                        </p>
                                                      </div>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          {content.challenges && content.challenges.length > 0 && (
                                            <div>
                                              <h4 className="font-medium mb-2">Challenges</h4>
                                              <div className="space-y-4">
                                                {content.challenges.map((challenge: any, i: number) => (
                                                  <div key={i} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                                    <h5 className="font-medium mb-2">{challenge.title}</h5>
                                                    <p className="text-gray-600 dark:text-gray-400">
                                                      {challenge.solution}
                                                    </p>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          {content.resources && content.resources.length > 0 && (
                                            <div>
                                              <h4 className="font-medium mb-2">Resources</h4>
                                              <div className="space-y-3">
                                                {content.resources.map((resource: any, i: number) => (
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
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                ) : (
                                  <div className="text-center text-gray-500">
                                    Failed to load content. Please try again.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No chapters available
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 ${
          isProgressSidebarOpen ? 'translate-x-0' : 'translate-x-80'
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsProgressSidebarOpen(!isProgressSidebarOpen)}
          className={`absolute -left-9 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-2 rounded-l-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300`}
        >
          {isProgressSidebarOpen ? (
            <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>

        {/* Progress Content */}
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Learning Progress</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {modules.map((module) => (
              <div key={module.id} className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">{module.title}</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {Math.round(getModuleProgress(module))}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getModuleProgress(module)}%` }}
                  />
                </div>

                {module.chapters?.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex items-center space-x-2 py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => toggleChapterCompletion(module.id, chapter.id)}
                  >
                    <CheckCircle2
                      className={`h-5 w-5 ${
                        completedChapters.has(`${module.id}-${chapter.id}`)
                          ? 'text-green-500'
                          : 'text-gray-400'
                      }`}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {chapter.title}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GuruAI Chat Button */}
      <button
        onClick={() => {
          setShowChat(true);
          setSelectedText(null);
        }}
        className="fixed bottom-24 left-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-30"
      >
        Ask GuruAI
      </button>

      {/* Ask Button for Selected Text */}
      {showAskButton && (
        <button
          onClick={() => {
            if (selectedText) {
              const question = `Can you explain this: "${selectedText}"`;
              setCurrentQuestion(question);
              setChatKey(Date.now());
              setShowChat(true);
              setShowAskButton(false);
              setShowModuleButton(false);
            }
          }}
          style={{
            position: 'absolute',
            left: `${askButtonPosition.x}px`,
            top: `${askButtonPosition.y}px`,
            zIndex: 30
          }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-lg shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-700 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle-question">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <path d="M12 17h.01"/>
          </svg>
          Ask GuruAI
        </button>
      )}

      {/* Create Module Button */}
      {showModuleButton && (
        <button
          onClick={handleCreateModule}
          disabled={isGeneratingModule}
          style={{
            position: 'absolute',
            left: `${askButtonPosition.x}px`,
            top: `${askButtonPosition.y + 40}px`,
            zIndex: 1000
          }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-lg shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingModule ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-circle">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12h8"/>
                <path d="M12 8v8"/>
              </svg>
              <span>Create Module</span>
            </>
          )}
        </button>
      )}

      {/* GuruAI Chat Interface */}
      {showChat && (
        <div className="fixed inset-0 z-50">
          <GuruAIChat
            key={chatKey}
            initialQuestion={currentQuestion}
            onClose={() => {
              setShowChat(false);
              setCurrentQuestion(undefined);
              setSelectedText(null);
              setShowAskButton(false);
              setShowModuleButton(false);
            }}
          />
        </div>
      )}
    </div>
  );

  return <AuthenticatedLayout>{content}</AuthenticatedLayout>;
} 