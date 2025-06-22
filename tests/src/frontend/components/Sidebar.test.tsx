import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Sidebar } from "../../../../frontend/src/components/layout/Sidebar";
import { AuthProvider } from "../../../../frontend/src/contexts/AuthContext";

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

jest.mock("../../../../frontend/src/contexts/AuthContext", () => {
  const actual = jest.requireActual(
    "../../../../frontend/src/contexts/AuthContext"
  );
  return {
    ...actual,
    useAuth: () => ({ user, logout: jest.fn() }),
  };
});

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

  const renderWithAuth = (component: React.ReactElement) => {
    return render(<AuthProvider>{component}</AuthProvider>);
  };

  it("renders user info and navigation", () => {
    renderWithAuth(
      <Sidebar
        user={user}
        conversations={conversations}
        selectedConversationId={null}
        onSelectConversation={jest.fn()}
        onCreateConversation={jest.fn()}
        onLogout={jest.fn()}
      />
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("calls onSelectConversation when conversation is clicked", () => {
    const onSelectConversation = jest.fn();

    renderWithAuth(
      <Sidebar
        user={user}
        conversations={conversations}
        selectedConversationId={null}
        onSelectConversation={onSelectConversation}
        onCreateConversation={jest.fn()}
        onLogout={jest.fn()}
      />
    );

    const conversationItem = screen.getByText("Bob");
    conversationItem.click();

    expect(onSelectConversation).toHaveBeenCalledWith(conversations[0]);
  });
});
