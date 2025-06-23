import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Sidebar } from "../../../../frontend/src/components/layout/Sidebar";

const user = {
  id: "user1",
  name: "Alice",
  email: "alice@example.com",
  avatar: "",
};
const bob = {
  id: "user2",
  name: "Bob",
  email: "bob@example.com",
  avatar: "",
};

// Mock the AuthContext to avoid Next.js router dependencies
jest.mock("../../../../frontend/src/contexts/AuthContext", () => ({
  useAuth: () => ({ user, logout: jest.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("Sidebar", () => {
  const conversations = [
    {
      id: "conv1",
      name: "Test Conversation",
      type: "direct" as const,
      isGroup: false,
      title: "Test Conversation",
      members: [user, bob],
      messages: [
        {
          id: "msg1",
          content: "Hello there!",
          sender: { id: "user1", name: "Alice", avatar: "" },
          senderId: "user1",
          conversationId: "conv1",
          createdAt: new Date("2024-01-01T10:00:00Z"),
          updatedAt: new Date("2024-01-01T10:00:00Z"),
          readBy: [],
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      unreadCount: 0,
    },
  ];

  it("renders user info and navigation", () => {
    render(
      <Sidebar
        conversations={conversations}
        selectedConversationId={null}
        onSelectConversation={jest.fn()}
        onCreateDirectChat={jest.fn()}
        onCreateGroupChat={jest.fn()}
        onDiscoverGroups={jest.fn()}
        onOpenAdminDashboard={jest.fn()}
      />
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("calls onSelectConversation when conversation is clicked", () => {
    const onSelectConversation = jest.fn();

    render(
      <Sidebar
        conversations={conversations}
        selectedConversationId={null}
        onSelectConversation={onSelectConversation}
        onCreateDirectChat={jest.fn()}
        onCreateGroupChat={jest.fn()}
        onDiscoverGroups={jest.fn()}
        onOpenAdminDashboard={jest.fn()}
      />
    );

    const conversationItem = screen.getByText("Bob");
    conversationItem.click();

    expect(onSelectConversation).toHaveBeenCalledWith(conversations[0]);
  });
});
