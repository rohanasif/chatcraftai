"use client";

import React from "react";
import { Conversation, User } from "../../types";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { UsersIcon, ChartBarIcon } from "@heroicons/react/24/outline";

interface ChatHeaderProps {
  conversation: Conversation;
  currentUser: User;
  onShowAnalytics: () => void;
  onShowMembers: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  currentUser,
  onShowAnalytics,
  onShowMembers,
}) => {
  const isOnline = true; // Mock online status

  const getConversationTitle = () => {
    if (conversation.isGroup) {
      return conversation.title || "Untitled Group";
    }
    const otherMember = conversation.members.find(
      (member) => member.id !== currentUser.id,
    );
    return otherMember?.name || "Unknown User";
  };

  const getOnlineMembers = () => {
    // Mock online members - in real app this would come from WebSocket
    return conversation.members
      .filter((member) => member.id !== currentUser.id)
      .slice(0, 3);
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
      <div className="flex items-center space-x-3">
        <div className="relative">
          {conversation.isGroup ? (
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <UsersIcon className="w-5 h-5 text-blue-600" />
            </div>
          ) : (
            <Avatar
              user={{
                name: getConversationTitle(),
                avatar: conversation.members.find(
                  (m) => m.id !== currentUser.id,
                )?.avatar,
              }}
              size="md"
            />
          )}
          {isOnline && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
          )}
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">
            {getConversationTitle()}
          </h2>
          {conversation.isGroup ? (
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-500">
                {conversation.members.length} members
              </p>
              {getOnlineMembers().length > 0 && (
                <div className="flex -space-x-1">
                  {getOnlineMembers().map((member) => (
                    <Avatar
                      key={member.id}
                      user={member}
                      size="sm"
                      className="border-2 border-white"
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {isOnline ? "Online" : "Offline"}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {conversation.isGroup && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowMembers}
            title="View members"
          >
            <UsersIcon className="w-5 h-5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onShowAnalytics}
          title="View analytics"
        >
          <ChartBarIcon className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
