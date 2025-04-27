"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button'; // Assuming a Button component exists

export function ChatbotPopup() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <motion.div
        className="fixed bottom-8 right-8 z-50"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          onClick={toggleChatbot}
          className="rounded-full h-14 w-14 flex items-center justify-center text-white bg-honey hover:bg-honey-dark shadow-lg focus:outline-none focus:ring-2 focus:ring-honey focus:ring-offset-2"
          aria-label="Toggle Chatbot"
        >
          {/* Replace with a suitable icon later */}
          💬
        </Button>
      </motion.div>

      {/* Chatbot Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-8 w-80 h-96 bg-white rounded-lg shadow-xl border border-honey/20 z-50 flex flex-col"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center p-4 bg-honey text-white rounded-t-lg">
              <h3 className="text-lg font-bold">المساعد الذكي</h3>
              <Button
                onClick={toggleChatbot}
                className="p-1 text-white hover:bg-white/20"
                aria-label="Close Chatbot"
              >
                ✕
              </Button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {/* Chatbot conversation area goes here */}
              <p className="text-gray-600">مرحباً! كيف يمكنني مساعدتك اليوم؟</p>
            </div>
            <div className="p-4 border-t border-gray-200">
              {/* Chatbot input area goes here */}
              <input
                type="text"
                placeholder="اكتب رسالتك..."
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-honey"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}