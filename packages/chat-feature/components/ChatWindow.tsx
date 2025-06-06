import React, { useEffect, useRef } from 'react';
import { ChatMessageItem } from '../../shared-types'; // Adjusted import path
import ChatMessage from './ChatMessage'; // Adjusted import path

interface ChatWindowProps {
  messages: ChatMessageItem[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  return (
    <div className="flex-grow p-4 space-y-4 overflow-y-auto bg-white shadow-inner rounded-t-lg">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatWindow;
