"use client";

import React, { useEffect, useRef } from "react";
import { Message, User } from "../../types";
import { Avatar } from "../ui/Avatar";
import { formatMessageTime } from "../../utils";

interface MessageListProps {
  messages: Message[];
  currentUser: User;
  isLoading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUser,
  isLoading = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm">
              Start the conversation by sending a message!
            </p>
          </div>
        </div>
      ) : (
        messages.map((message) => {
          const isOwnMessage = message.sender.id === currentUser.id;

          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex max-w-xs lg:max-w-md ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}
              >
                {!isOwnMessage && (
                  <div className="flex-shrink-0 mr-2">
                    <Avatar user={message.sender} size="sm" />
                  </div>
                )}

                <div
                  className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}
                >
                  {!isOwnMessage && (
                    <p className="text-xs text-gray-500 mb-1">
                      {message.sender.name}
                    </p>
                  )}

                  <div
                    className={`px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>

                  <div
                    className={`flex items-center mt-1 space-x-2 text-xs text-gray-500 ${
                      isOwnMessage ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <span>{formatMessageTime(message.createdAt)}</span>
                    {isOwnMessage && (
                      <span>{message.readBy.length > 1 ? "✓✓" : "✓"}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
