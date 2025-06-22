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
    title: "Test Group",
    isGroup: true,
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
        onShowMembers={jest.fn()}
      />
    );

    expect(screen.getByText("Test Group")).toBeInTheDocument();
    expect(screen.getByText("2 members")).toBeInTheDocument();
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
        onShowMembers={jest.fn()}
      />
    );

    const analyticsButton = screen.getByRole("button", { name: /analytics/i });
    analyticsButton.click();

    expect(onShowAnalytics).toHaveBeenCalled();
  });
});
