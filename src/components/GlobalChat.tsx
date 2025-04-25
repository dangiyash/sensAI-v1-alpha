"use client";

import { useState } from 'react';
import GuruAIChat from './GuruAIChat';

export default function GlobalChat() {
  const [showChat, setShowChat] = useState(false);
  const [initialQuestion, setInitialQuestion] = useState<string | undefined>(undefined);

  // Function to open chat with an initial question
  const openChatWithQuestion = (question: string) => {
    setInitialQuestion(question);
    setShowChat(true);
  };

  // Expose the function globally
  if (typeof window !== 'undefined') {
    (window as any).openGuruAIChat = openChatWithQuestion;
  }

  if (!showChat) {
    return (
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-16 left-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>
    );
  }

  return (
    <GuruAIChat
      initialQuestion={initialQuestion}
      onClose={() => {
        setShowChat(false);
        setInitialQuestion(undefined);
      }}
    />
  );
} 