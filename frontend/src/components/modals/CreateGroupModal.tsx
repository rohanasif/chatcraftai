"use client";

import React, { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { isValidEmail } from "../../utils";
import toast from "react-hot-toast";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (title: string, memberEmails: string[]) => Promise<void>;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    memberEmails: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    memberEmails?: string;
  }>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Group title is required";
    }

    if (!formData.memberEmails.trim()) {
      newErrors.memberEmails = "At least one member email is required";
    } else {
      const emails = formData.memberEmails
        .split(",")
        .map((email) => email.trim());
      const invalidEmails = emails.filter(
        (email) => email && !isValidEmail(email),
      );
      if (invalidEmails.length > 0) {
        newErrors.memberEmails = `Invalid email(s): ${invalidEmails.join(", ")}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const memberEmails = formData.memberEmails
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email);

      await onCreateGroup(formData.title.trim(), memberEmails);
      setFormData({ title: "", memberEmails: "" });
      onClose();
      toast.success("Group created successfully!");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create group",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ title: "", memberEmails: "" });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Create New Group
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
            label="Group name"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            error={errors.title}
            placeholder="Enter group name"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member emails
            </label>
            <textarea
              name="memberEmails"
              value={formData.memberEmails}
              onChange={handleChange}
              placeholder="Enter email addresses separated by commas"
              className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.memberEmails ? "border-red-300" : "border-gray-300"
              }`}
              rows={3}
              required
            />
            {errors.memberEmails && (
              <p className="text-sm text-red-600 mt-1">{errors.memberEmails}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple email addresses with commas
            </p>
          </div>

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
              Create Group
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
