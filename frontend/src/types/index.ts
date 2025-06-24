export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isAdmin: boolean;
}

export interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  conversationId: string;
  readBy: {
    id: string;
    name: string;
  }[];
  isAISuggestion?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  title?: string;
  isGroup: boolean;
  isPublic?: boolean;
  creator?: {
    id: string;
    name: string;
  };
  members: {
    id: string;
    name: string;
    avatar?: string;
  }[];
  messages: Message[];
  unreadCount?: number;
  lastMessageRead?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationAnalytics {
  summary: string;
  stats: {
    messageCount: number;
    wordCount: number;
    aiSuggestionsUsed: number;
    isInactive: boolean;
    lastActivity?: string;
  };
  sentiment: string[];
  sentimentTimeline?: {
    timestamp: string;
    sentiment: "positive" | "neutral" | "negative";
    messageCount: number;
  }[];
}

export interface WebSocketMessage {
  type: "join" | "message" | "typing" | "suggestion" | "presence" | "members";
  conversationId?: string;
  content?: string;
  isTyping?: boolean;
  userId?: string;
  isOnline?: boolean;
  members?: User[];
  message?: Message;
  suggestion?: string;
  isAISuggestion?: boolean;
}

export interface AuthResponse {
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  avatar?: string;
}

export interface CreateDirectChatRequest {
  userId: string;
  targetEmail: string;
}

export interface CreateGroupChatRequest {
  userId: string;
  title: string;
  memberEmails: string[];
  isPublic?: boolean;
}

export interface SendInvitationRequest {
  groupId: string;
  inviteeEmails: string[];
}

export interface InvitationValidation {
  valid: boolean;
  group?: Conversation;
  email?: string;
}
