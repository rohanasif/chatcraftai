"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "../ui/Button";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
  onRequestSuggestions: () => void;
  suggestions?: string[];
  isTyping?: boolean;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  onRequestSuggestions,
  suggestions = [],
  isTyping = false,
  disabled = false,
}) => {
  const [message, setMessage] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [grammarErrors, setGrammarErrors] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const grammarTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced typing indicator
  const debouncedTyping = useCallback(
    (isTyping: boolean) => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(isTyping);
      }, 500);
    },
    [onTyping],
  );

  useEffect(() => {
    if (message.trim()) {
      debouncedTyping(true);
    } else {
      debouncedTyping(false);
    }
  }, [message, debouncedTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
      setGrammarErrors([]);
      onTyping(false);
      setShowSuggestions(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const handleGrammarCorrection = (original: string, corrected: string) => {
    setMessage(message.replace(original, corrected));
    setGrammarErrors(grammarErrors.filter((error) => error !== original));
  };

  // Mock grammar checking - in real app this would call AI service
  const checkGrammar = useCallback((text: string) => {
    if (grammarTimeoutRef.current) {
      clearTimeout(grammarTimeoutRef.current);
    }
    grammarTimeoutRef.current = setTimeout(async () => {
      if (text.length < 10) return;

      // Mock grammar errors
      const mockErrors = [];
      if (text.includes("i am")) {
        mockErrors.push("i am");
      }
      if (text.includes("u ")) {
        mockErrors.push("u ");
      }
      setGrammarErrors(mockErrors);
    }, 1000);
  }, []);

  useEffect(() => {
    checkGrammar(message);
  }, [message, checkGrammar]);

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* Grammar Suggestions */}
      {grammarErrors.length > 0 && (
        <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs text-yellow-800 mb-1">Grammar suggestions:</p>
          {grammarErrors.map((error, index) => (
            <div key={index} className="flex items-center space-x-2 text-xs">
              <span className="text-yellow-600">&quot;{error}&quot;</span>
              <span>→</span>
              <button
                onClick={() =>
                  handleGrammarCorrection(
                    error,
                    error === "i am" ? "I am" : "you ",
                  )
                }
                className="text-blue-600 hover:underline"
              >
                {error === "i am" ? "I am" : "you "}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* AI Reply Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-800 mb-1">🤖 AI Suggestions:</p>
          <div className="flex flex-wrap gap-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Typing Indicator */}
      {isTyping && (
        <div className="mb-2 text-xs text-gray-500">Someone is typing...</div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={1}
            disabled={disabled}
            style={{
              minHeight: "40px",
              maxHeight: "120px",
            }}
          />
        </div>

        <div className="flex space-x-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onRequestSuggestions();
              setShowSuggestions(!showSuggestions);
            }}
            disabled={disabled}
            title="Get AI suggestions"
          >
            🤖
          </Button>

          <Button
            type="submit"
            disabled={!message.trim() || disabled}
            size="sm"
          >
            Send
          </Button>
        </div>
      </form>
    </div>
  );
};
