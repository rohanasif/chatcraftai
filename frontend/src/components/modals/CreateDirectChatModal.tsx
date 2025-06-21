"use client";

import React, { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { isValidEmail } from "../../utils";
import toast from "react-hot-toast";

interface CreateDirectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (targetEmail: string) => Promise<void>;
}

export const CreateDirectChatModal: React.FC<CreateDirectChatModalProps> = ({
  isOpen,
  onClose,
  onCreateChat,
}) => {
  const [targetEmail, setTargetEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetEmail.trim()) {
      setError("Email is required");
      return;
    }

    if (!isValidEmail(targetEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onCreateChat(targetEmail.trim());
      setTargetEmail("");
      onClose();
      toast.success("Direct chat created successfully!");
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "Failed to create chat",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTargetEmail("");
      setError("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Start a New Chat
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            value={targetEmail}
            onChange={(e) => {
              setTargetEmail(e.target.value);
              if (error) setError("");
            }}
            error={error}
            placeholder="Enter the email address of the person you want to chat with"
            required
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Start Chat
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
