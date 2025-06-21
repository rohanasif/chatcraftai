"use client";

import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Conversation } from "../../types";
import { formatMessageTime, truncateText } from "../../utils";
import { PlusIcon, UsersIcon, UserIcon } from "@heroicons/react/24/outline";

interface SidebarProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  onCreateDirectChat: () => void;
  onCreateGroupChat: () => void;
  onDiscoverGroups: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onCreateDirectChat,
  onCreateGroupChat,
  onDiscoverGroups,
}) => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.isGroup) {
      return conversation.title || "Untitled Group";
    }
    // For direct chats, show the other user's name
    const otherMember = conversation.members.find(
      (member) => member.id !== user?.id,
    );
    return otherMember?.name || "Unknown User";
  };

  const getLastMessage = (conversation: Conversation) => {
    if (conversation.messages.length === 0) {
      return "No messages yet";
    }
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return truncateText(lastMessage.content, 50);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Avatar user={user!} size="sm" />
          <div>
            <h2 className="font-semibold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </Button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
              <button
                onClick={logout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 space-y-2">
        <Button
          onClick={onCreateDirectChat}
          className="w-full justify-start"
          variant="outline"
          size="sm"
        >
          <UserIcon className="w-4 h-4 mr-2" />
          New Chat
        </Button>
        {user?.isAdmin && (
          <Button
            onClick={onCreateGroupChat}
            className="w-full justify-start"
            variant="outline"
            size="sm"
          >
            <UsersIcon className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        )}
        <Button
          onClick={onDiscoverGroups}
          className="w-full justify-start"
          variant="outline"
          size="sm"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Discover Groups
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Conversations
          </h3>
        </div>
        <div className="space-y-1">
          {conversations.map((conversation) => {
            const isSelected = conversation.id === selectedConversationId;
            const hasUnread =
              conversation.unreadCount && conversation.unreadCount > 0;

            return (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                  isSelected ? "bg-blue-50 border-r-2 border-blue-500" : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {conversation.isGroup ? (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <UsersIcon className="w-4 h-4 text-blue-600" />
                      </div>
                    ) : (
                      <Avatar
                        user={{
                          name: getConversationTitle(conversation),
                          avatar: conversation.members.find(
                            (m) => m.id !== user?.id,
                          )?.avatar,
                        }}
                        size="sm"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-sm font-medium truncate ${
                          hasUnread ? "text-gray-900" : "text-gray-700"
                        }`}
                      >
                        {getConversationTitle(conversation)}
                      </p>
                      {hasUnread && (
                        <span className="flex-shrink-0 ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {getLastMessage(conversation)}
                    </p>
                    {conversation.messages.length > 0 && (
                      <p className="text-xs text-gray-400">
                        {formatMessageTime(
                          conversation.messages[
                            conversation.messages.length - 1
                          ].createdAt,
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {conversations.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">
                Start a new chat to begin messaging
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
