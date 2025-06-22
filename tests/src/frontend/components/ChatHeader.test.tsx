import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ChatHeader } from "../../../../frontend/src/components/chat/ChatHeader";

// Mock the useAuth hook
jest.mock("../../../../frontend/src/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "current-user-id",
      name: "Current User",
      email: "current@example.com",
    },
    logout: jest.fn(),
  }),
}));

describe("ChatHeader", () => {
  const conversation = {
    id: "conv1",
    name: "Test Conversation",
    type: "group" as const,
    members: [
      {
        id: "user1",
        name: "Alice",
        email: "alice@example.com",
        avatar: null,
      },
      {
        id: "user2",
        name: "Bob",
        email: "bob@example.com",
        avatar: null,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("renders conversation title and members", () => {
    render(
      <ChatHeader
        conversation={conversation}
        currentUser={{
          id: "current-user-id",
          name: "Current User",
          email: "current@example.com",
        }}
        onShowAnalytics={jest.fn()}
      />
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("calls onShowAnalytics when analytics button is clicked", () => {
    const onShowAnalytics = jest.fn();

    render(
      <ChatHeader
        conversation={conversation}
        currentUser={{
          id: "current-user-id",
          name: "Current User",
          email: "current@example.com",
        }}
        onShowAnalytics={onShowAnalytics}
      />
    );

    const analyticsButton = screen.getByRole("button", { name: /analytics/i });
    analyticsButton.click();

    expect(onShowAnalytics).toHaveBeenCalled();
  });
});
