'use client';

import { useState } from 'react';

export default function Chatbot() {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<string[]>([]);

  const handleSend = async () => {
    if (!message) return;
    setChat([...chat, `You: ${message}`]);
    // Replace with your API endpoint
    const res = await fetch('/api/chatbot', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    setChat((prev) => [...prev, `AI: ${data.response}`]);
    setMessage('');
  };

  return (
    <div className="border rounded p-4">
      <div className="h-96 overflow-y-auto mb-4">
        {chat.map((msg, i) => (
          <p key={i}>{msg}</p>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full p-2 border rounded"
        placeholder="Ask your AI Mentor..."
      />
      <button onClick={handleSend} className="mt-2 bg-blue-500 text-white p-2 rounded">
        Send
      </button>
    </div>
  );
}