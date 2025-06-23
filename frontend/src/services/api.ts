import {
  User,
  Conversation,
  Message,
  ConversationAnalytics,
  LoginCredentials,
  RegisterCredentials,
  CreateDirectChatRequest,
  CreateGroupChatRequest,
  SendInvitationRequest,
  InvitationValidation,
} from "../types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));

      // Create a more specific error message
      const errorMessage = error.error || `HTTP ${response.status}`;
      const errorObj = new Error(errorMessage);

      // Add status code to error for better handling
      (errorObj as unknown as Record<string, unknown>).status = response.status;

      throw errorObj;
    }

    return response.json();
  }

  // Auth endpoints
  async register(credentials: RegisterCredentials): Promise<{ user: User }> {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async login(credentials: LoginCredentials): Promise<{ user: User }> {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<{ success: boolean }> {
    return this.request("/auth/logout", {
      method: "POST",
    });
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request("/auth/me");
  }

  async getToken(): Promise<{ token: string }> {
    return this.request("/auth/token");
  }

  // Conversation endpoints
  async getConversations(userId: string): Promise<Conversation[]> {
    return this.request(`/conversations/${userId}`);
  }

  async createDirectChat(data: CreateDirectChatRequest): Promise<Conversation> {
    return this.request("/conversations/direct", {
      method: "POST",
      body: JSON.stringify({
        userId: data.userId,
        targetEmail: data.targetEmail,
      }),
    });
  }

  async createGroupChat(data: CreateGroupChatRequest): Promise<Conversation> {
    return this.request("/conversations/group", {
      method: "POST",
      body: JSON.stringify({
        title: data.title,
        memberEmails: data.memberEmails,
        isPublic: data.isPublic || false,
      }),
    });
  }

  async discoverGroups(userId: string): Promise<Conversation[]> {
    return this.request(`/conversations/discover/${userId}`);
  }

  async joinGroup(groupId: string, userId: string): Promise<Conversation> {
    return this.request(`/conversations/${groupId}/join`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async getUnreadCount(
    conversationId: string,
    userId: string,
  ): Promise<{ unreadCount: number }> {
    return this.request(`/conversations/${userId}/unread`);
  }

  async markAsRead(
    conversationId: string,
    userId: string,
  ): Promise<{ success: boolean; markedAsRead: number }> {
    return this.request(`/conversations/${conversationId}/read`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  // Message endpoints
  async getMessages(
    conversationId: string,
    limit = 50,
    cursor?: string,
  ): Promise<Message[]> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append("cursor", cursor);
    return this.request(`/messages/${conversationId}?${params}`);
  }

  async getAnalytics(conversationId: string): Promise<ConversationAnalytics> {
    return this.request(`/messages/${conversationId}/analytics`);
  }

  async markMessageAsRead(
    messageId: string,
    userId: string,
  ): Promise<{ success: boolean; message: Message }> {
    return this.request(`/messages/${messageId}/read`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async getReplySuggestions(
    conversationId: string,
    limit = 5,
  ): Promise<{ suggestions: string[] }> {
    return this.request(
      `/messages/${conversationId}/suggestions?limit=${limit}`,
    );
  }

  // Invitation endpoints
  async sendInvitations(
    data: SendInvitationRequest,
  ): Promise<{ success: boolean; message: string }> {
    return this.request("/invitations/send", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async validateInvitation(token: string): Promise<InvitationValidation> {
    return this.request(`/invitations/${token}/validate`);
  }

  async acceptInvitation(
    token: string,
    userId: string,
  ): Promise<{ success: boolean; group: Conversation }> {
    return this.request(`/invitations/${token}/accept`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }
}

export const apiService = new ApiService();
