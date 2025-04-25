
'use client';

import {useState} from 'react';

export default function ChatbotPage() {
  const [messages, setMessages] = useState<
    { text: string; sender: 'user' | 'bot' }[]
  >([]);
  const [input, setInput] = useState('');

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    setMessages(prevMessages => [...prevMessages, { text: input, sender: 'user' }]);
    setInput('');

    // Simulate bot response
    setTimeout(() => {
      setMessages(prevMessages => [
        ...prevMessages,
        { text: `شكرا لك على رسالتك! هذا رد تجريبي.`, sender: 'bot' },
      ]);
    }, 500);
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">
        المحادثة الذكية
      </h1>

      {/* Chat Messages */}
      <div className="mb-4 p-4 rounded-xl shadow-md bg-gray-50 h-96 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-2 p-3 rounded-xl ${message.sender === 'user'
              ? 'bg-primary text-white ml-auto w-fit'
              : 'bg-gray-200 mr-auto w-fit'}`}
          >
            {message.text}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="flex">
        <input
          type="text"
          className="flex-1 border rounded-md p-2 mr-2"
          placeholder="اكتب رسالتك هنا..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button
          className="bg-primary hover:bg-primary-foreground text-primary-foreground font-bold py-2 px-8 rounded-md transition-colors duration-300"
          onClick={handleSendMessage}
        >
          إرسال
        </button>
      </div>
    </div>
  );
}
