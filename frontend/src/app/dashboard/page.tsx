"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { Sidebar } from "../../components/layout/Sidebar";
import { ChatHeader } from "../../components/chat/ChatHeader";
import { MessageList } from "../../components/chat/MessageList";
import { MessageInput } from "../../components/chat/MessageInput";
import { CreateDirectChatModal } from "../../components/modals/CreateDirectChatModal";
import { CreateGroupModal } from "../../components/modals/CreateGroupModal";
import { ConversationAnalytics } from "../../components/analytics/ConversationAnalytics";
import {
  Conversation,
  Message,
  ConversationAnalytics as AnalyticsType,
} from "../../types";
import { apiService } from "../../services/api";
import { wsService } from "../../services/websocket";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsType | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Modal states
  const [showDirectChatModal, setShowDirectChatModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  // Loading states
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
      connectWebSocket();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // WebSocket connection
  const connectWebSocket = () => {
    if (!user) return;

    // Mock token - in real app this would come from auth context
    wsService.connect("mock-token");

    wsService.onMessage((message) => {
      switch (message.type) {
        case "message":
          if (
            message.message &&
            selectedConversation?.id === message.conversationId
          ) {
            setMessages((prev) => [...prev, message.message!]);
          }
          // Update conversation list
          loadConversations();
          break;
        case "typing":
          if (message.conversationId === selectedConversation?.id) {
            setIsTyping(message.isTyping || false);
          }
          break;
        case "suggestion":
          if (message.suggestion) {
            setSuggestions((prev) => [...prev, message.suggestion!]);
          }
          break;
      }
    });
  };

  // Load conversations
  const loadConversations = async () => {
    if (!user) return;

    try {
      const data = await apiService.getConversations(user.id);
      setConversations(data);
    } catch (error: unknown) {
      toast.error("Failed to load conversations");
      console.error("Error loading conversations:", error);
    }
  };

  // Load messages for selected conversation
  const loadMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      const data = await apiService.getMessages(conversationId);
      setMessages(data);

      // Mark as read
      await apiService.markAsRead(conversationId, user!.id);
    } catch (error: unknown) {
      toast.error("Failed to load messages");
      console.error("Error loading messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Handle conversation selection
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    setSuggestions([]);
    setIsTyping(false);

    // Join WebSocket room
    wsService.joinConversation(conversation.id);

    // Load messages
    loadMessages(conversation.id);
  };

  // Send message
  const handleSendMessage = async (content: string) => {
    if (!selectedConversation || !user) return;

    try {
      // Send via WebSocket
      wsService.sendMessage(selectedConversation.id, content);

      // Optimistically add to UI
      const newMessage: Message = {
        id: `temp-${Date.now()}`,
        content,
        sender: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
        },
        conversationId: selectedConversation.id,
        readBy: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newMessage]);
    } catch (error: unknown) {
      toast.error("Failed to send message");
      console.error("Error sending message:", error);
    }
  };

  // Handle typing
  const handleTyping = (isTyping: boolean) => {
    if (selectedConversation) {
      wsService.sendTyping(selectedConversation.id, isTyping);
    }
  };

  // Request AI suggestions
  const handleRequestSuggestions = async () => {
    if (!selectedConversation) return;

    try {
      setLoadingSuggestions(true);
      const response = await apiService.getReplySuggestions(
        selectedConversation.id,
      );
      setSuggestions(response.suggestions);
    } catch (error: unknown) {
      toast.error("Failed to get suggestions");
      console.error("Error getting suggestions:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Create direct chat
  const handleCreateDirectChat = async (targetEmail: string) => {
    if (!user) return;

    try {
      const conversation = await apiService.createDirectChat({
        userId: user.id,
        targetEmail,
      });

      setConversations((prev) => [conversation, ...prev]);
      setSelectedConversation(conversation);
      setShowDirectChatModal(false);
    } catch (error: unknown) {
      throw error;
    }
  };

  // Create group chat
  const handleCreateGroup = async (title: string, memberEmails: string[]) => {
    if (!user) return;

    try {
      const conversation = await apiService.createGroupChat({
        userId: user.id,
        title,
        memberEmails,
      });

      setConversations((prev) => [conversation, ...prev]);
      setSelectedConversation(conversation);
      setShowGroupModal(false);
    } catch (error: unknown) {
      throw error;
    }
  };

  // Show analytics
  const handleShowAnalytics = async () => {
    if (!selectedConversation) return;

    try {
      const data = await apiService.getAnalytics(selectedConversation.id);
      setAnalytics(data);
      setShowAnalytics(true);
    } catch (error: unknown) {
      toast.error("Failed to load analytics");
      console.error("Error loading analytics:", error);
    }
  };

  // Show members (placeholder)
  const handleShowMembers = () => {
    // In a real app, you'd show a modal with member list
    toast("Member list feature coming soon!", {
      icon: "ℹ️",
    });
  };

  // Discover groups
  const handleDiscoverGroups = async () => {
    if (!user) return;

    try {
      const groups = await apiService.discoverGroups(user.id);
      // In a real app, you'd show a modal with discoverable groups
      toast(`Found ${groups.length} discoverable groups`, {
        icon: "ℹ️",
      });
    } catch (error: unknown) {
      toast.error("Failed to discover groups");
      console.error("Error discovering groups:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0">
        <Sidebar
          conversations={conversations}
          selectedConversationId={selectedConversation?.id}
          onSelectConversation={handleSelectConversation}
          onCreateDirectChat={() => setShowDirectChatModal(true)}
          onCreateGroupChat={() => setShowGroupModal(true)}
          onDiscoverGroups={handleDiscoverGroups}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <ChatHeader
              conversation={selectedConversation}
              currentUser={user}
              onShowAnalytics={handleShowAnalytics}
              onShowMembers={handleShowMembers}
            />

            <MessageList
              messages={messages}
              currentUser={user}
              isLoading={loadingMessages}
            />

            <MessageInput
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              onRequestSuggestions={handleRequestSuggestions}
              suggestions={suggestions}
              isTyping={isTyping}
              disabled={loadingSuggestions}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Welcome to ChatCraftAI
              </h2>
              <p className="text-gray-600 mb-4">
                Select a conversation or start a new chat to begin messaging
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => setShowDirectChatModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Start New Chat
                </button>
                {user.isAdmin && (
                  <button
                    onClick={() => setShowGroupModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Create Group
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateDirectChatModal
        isOpen={showDirectChatModal}
        onClose={() => setShowDirectChatModal(false)}
        onCreateChat={handleCreateDirectChat}
      />

      <CreateGroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onCreateGroup={handleCreateGroup}
      />

      {analytics && (
        <ConversationAnalytics
          analytics={analytics}
          isVisible={showAnalytics}
          onClose={() => setShowAnalytics(false)}
        />
      )}
    </div>
  );
}
