"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { Sidebar } from "../../components/layout/Sidebar";
import { ChatHeader } from "../../components/chat/ChatHeader";
import { MessageList } from "../../components/chat/MessageList";
import { MessageInput } from "../../components/chat/MessageInput";
import { CreateDirectChatModal } from "../../components/modals/CreateDirectChatModal";
import { CreateGroupModal } from "../../components/modals/CreateGroupModal";
import { AdminDashboard } from "../../components/admin/AdminDashboard";
import { ConversationAnalytics } from "../../components/analytics/ConversationAnalytics";
import {
  Conversation,
  Message,
  ConversationAnalytics as AnalyticsType,
  WebSocketMessage,
} from "../../types";
import { apiService } from "../../services/api";
import { wsService } from "../../services/websocket";
import toast from "react-hot-toast";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  CircularProgress,
  Paper,
  Button,
} from "@mui/material";
import { Menu as MenuIcon, Chat as ChatIcon } from "@mui/icons-material";

export default function DashboardContent() {
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
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  // Loading states
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Sidebar open state for mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // WebSocket connection tracking
  const isConnectedRef = useRef(false);
  const messageHandlerRef = useRef<
    ((message: WebSocketMessage) => void) | null
  >(null);
  const errorHandlerRef = useRef<((error: Event) => void) | null>(null);
  const handlersRegisteredRef = useRef(false);
  const hasAttemptedConnectionRef = useRef(false);

  const selectedConversationRef = useRef<Conversation | null>(null);
  const isTypingRef = useRef<boolean>(false);
  const suggestionsRef = useRef<string[]>([]);
  const showAnalyticsRef = useRef<boolean>(false);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    isTypingRef.current = isTyping;
  }, [isTyping]);

  useEffect(() => {
    suggestionsRef.current = suggestions;
  }, [suggestions]);

  useEffect(() => {
    showAnalyticsRef.current = showAnalytics;
  }, [showAnalytics]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  // Load conversations on mount
  useEffect(() => {
    if (user && !authLoading && !hasAttemptedConnectionRef.current) {
      hasAttemptedConnectionRef.current = true;
      loadConversations();
      connectWebSocket().catch(console.error);
    }
  }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (messageHandlerRef.current) {
        wsService.removeMessageHandler(messageHandlerRef.current);
      }
      if (errorHandlerRef.current) {
        wsService.removeErrorHandler(errorHandlerRef.current);
      }
      wsService.disconnect();
      isConnectedRef.current = false;
      handlersRegisteredRef.current = false;
    };
  }, []);

  // WebSocket connection
  const connectWebSocket = async () => {
    if (!user || authLoading || isConnectedRef.current) return;

    try {
      await wsService.connect();
      isConnectedRef.current = true;

      // Only register handlers once
      if (!handlersRegisteredRef.current) {
        // Create message handler
        const messageHandler = (message: WebSocketMessage) => {
          switch (message.type) {
            case "message":
              if (
                message.message &&
                selectedConversationRef.current?.id === message.conversationId
              ) {
                setMessages((prev) => {
                  const messageExists = prev.some(
                    (msg) => msg.id === message.message?.id,
                  );
                  if (messageExists) {
                    return prev;
                  }
                  return [...prev, message.message!];
                });

                // Update analytics in real time when new message is received
                if (showAnalyticsRef.current && message.conversationId) {
                  loadAnalytics(message.conversationId);
                }
              }
              loadConversations();
              break;
            case "typing":
              if (
                message.conversationId === selectedConversationRef.current?.id
              ) {
                setIsTyping(message.isTyping || false);
                isTypingRef.current = message.isTyping || false;
              }
              break;
            case "suggestion":
              if (
                message.suggestion &&
                message.conversationId === selectedConversationRef.current?.id
              ) {
                setSuggestions((prev) => [...prev, message.suggestion!]);
                suggestionsRef.current = [
                  ...suggestionsRef.current,
                  message.suggestion!,
                ];
              }
              break;
            case "presence":
              if (
                message.conversationId === selectedConversationRef.current?.id
              ) {
                // Optionally update user status in the conversation UI
                // e.g., setPresenceState(message.userId, message.isOnline)
              }
              break;
            case "members":
              if (
                message.conversationId ===
                  selectedConversationRef.current?.id &&
                message.members
              ) {
                // Optionally update members list in the UI
                // setMembers(message.members)
              }
              break;
            default:
              break;
          }
        };

        // Create error handler
        const errorHandler = (error: Event) => {
          console.error("WebSocket error:", error);
          toast.error("WebSocket connection error");
        };

        // Store handlers for cleanup
        messageHandlerRef.current = messageHandler;
        errorHandlerRef.current = errorHandler;

        // Register handlers
        wsService.onMessage(messageHandler);
        wsService.onError(errorHandler);

        handlersRegisteredRef.current = true;
      }
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
      toast.error("Failed to connect to real-time messaging");
    }
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
  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    setSuggestions([]);
    setIsTyping(false);

    // Ensure WebSocket is connected before joining conversation
    try {
      if (!wsService.isConnected()) {
        await connectWebSocket();
      }

      // Join WebSocket room
      wsService.joinConversation(conversation.id);
    } catch (error) {
      console.error("Failed to connect WebSocket for conversation:", error);
      // Continue with loading messages even if WebSocket fails
    }

    // Load messages
    loadMessages(conversation.id);
  };

  // Send message
  const handleSendMessage = async (
    content: string,
    isAISuggestion: boolean = false,
  ) => {
    if (!selectedConversation || !user) return;

    try {
      // Send via WebSocket if connected
      if (wsService.isConnected()) {
        wsService.send({
          type: "message",
          conversationId: selectedConversation.id,
          content,
          isAISuggestion,
        });
      } else {
        // Fallback to REST API
        await apiService.sendMessage(
          selectedConversation.id,
          content,
          isAISuggestion,
        );
        // Reload messages
        loadMessages(selectedConversation.id);
      }
      // Don't add optimistically - wait for WebSocket confirmation
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

  // Create group chat (updated for new API)
  // const handleCreateGroup = async (
  //   title: string,
  //   memberEmails: string[],
  //   isPublic: boolean,
  // ) => {
  //   if (!user) return;

  //   try {
  //     const conversation = await apiService.createGroupChat({
  //       title,
  //       memberEmails,
  //       isPublic,
  //     });

  //     setConversations((prev) => [conversation, ...prev]);
  //     setSelectedConversation(conversation);
  //     setShowGroupModal(false);
  //     toast.success("Group created successfully!");
  //   } catch (error: unknown) {
  //     throw error;
  //   }
  // };

  // Show analytics
  const handleShowAnalytics = async () => {
    if (!selectedConversation) return;

    try {
      setShowAnalytics(true);
      await loadAnalytics(selectedConversation.id);
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

  // Handle admin dashboard
  const handleOpenAdminDashboard = () => {
    setShowAdminDashboard(true);
  };

  const handleCloseAdminDashboard = () => {
    setShowAdminDashboard(false);
  };

  const loadAnalytics = async (conversationId: string) => {
    if (!conversationId) return;

    try {
      const data = await apiService.getAnalytics(conversationId);
      setAnalytics(data);
    } catch (error: unknown) {
      console.error("Error loading analytics:", error);
      // Don't show toast for analytics errors as they're not critical
    }
  };

  if (authLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #e0e7ff 100%)",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Loading...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <Box
      sx={{ height: "100vh", display: "flex", bgcolor: "background.default" }}
    >
      {/* Mobile AppBar */}
      <AppBar
        position="fixed"
        sx={{
          display: { xs: "flex", lg: "none" },
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setIsSidebarOpen((open) => !open)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ChatCraftAI
          </Typography>
          <Avatar src={user.avatar} sx={{ width: 32, height: 32 }}>
            {user.name?.charAt(0)}
          </Avatar>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        sx={{
          width: { lg: 320 },
          flexShrink: 0,
          display: { xs: "none", lg: "block" },
        }}
      >
        <Sidebar
          conversations={conversations}
          selectedConversationId={selectedConversation?.id}
          onSelectConversation={handleSelectConversation}
          onCreateDirectChat={() => setShowDirectChatModal(true)}
          onCreateGroupChat={() => setShowGroupModal(true)}
          onDiscoverGroups={handleDiscoverGroups}
          onOpenAdminDashboard={handleOpenAdminDashboard}
        />
      </Box>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <Sidebar
          conversations={conversations}
          selectedConversationId={selectedConversation?.id}
          onSelectConversation={handleSelectConversation}
          onCreateDirectChat={() => setShowDirectChatModal(true)}
          onCreateGroupChat={() => setShowGroupModal(true)}
          onDiscoverGroups={handleDiscoverGroups}
          onOpenAdminDashboard={handleOpenAdminDashboard}
          isMobile={true}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          pt: { xs: 8, lg: 0 },
        }}
      >
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
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 4,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: "center",
                maxWidth: 400,
                background: "transparent",
              }}
            >
              <Avatar
                sx={{
                  width: 96,
                  height: 96,
                  mx: "auto",
                  mb: 3,
                  background:
                    "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  boxShadow: 3,
                }}
              >
                <ChatIcon sx={{ fontSize: 48 }} />
              </Avatar>
              <Typography
                variant="h4"
                component="h2"
                gutterBottom
                sx={{ fontWeight: 700 }}
              >
                Welcome to ChatCraftAI
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 4, lineHeight: 1.6 }}
              >
                Select a conversation or start a new chat to begin messaging
                with AI-powered features
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => setShowDirectChatModal(true)}
                  sx={{ py: 1.5, fontSize: "1rem", fontWeight: 600 }}
                >
                  Start New Chat
                </Button>
                {user.isAdmin && (
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => setShowGroupModal(true)}
                    sx={{ py: 1.5, fontSize: "1rem", fontWeight: 600 }}
                  >
                    Create Group
                  </Button>
                )}
                {user.isAdmin && (
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleOpenAdminDashboard}
                    sx={{ py: 1.5, fontSize: "1rem", fontWeight: 600 }}
                  >
                    Admin Dashboard
                  </Button>
                )}
              </Box>
            </Paper>
          </Box>
        )}
      </Box>

      {/* Modals */}
      <CreateDirectChatModal
        isOpen={showDirectChatModal}
        onClose={() => setShowDirectChatModal(false)}
        onCreateChat={handleCreateDirectChat}
      />

      <CreateGroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onGroupCreated={() => {
          loadConversations();
          setShowGroupModal(false);
        }}
      />

      <AdminDashboard
        isOpen={showAdminDashboard}
        onClose={handleCloseAdminDashboard}
      />

      {analytics && (
        <ConversationAnalytics
          analytics={analytics}
          isVisible={showAnalytics}
          onClose={() => setShowAnalytics(false)}
        />
      )}
    </Box>
  );
}
