import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MessageList } from "../../../../frontend/src/components/chat/MessageList";

// Mock Next.js Image component
jest.mock("next/image", () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

describe("MessageList", () => {
  const currentUser = {
    id: "user1",
    name: "Alice",
    email: "alice@example.com",
    avatar: null,
  };

  const messages = [
    {
      id: "msg1",
      content: "Hello there!",
      sender: {
        id: "user1",
        name: "Alice",
        email: "alice@example.com",
        avatar: null,
      },
      conversationId: "conv1",
      readBy: [],
      createdAt: "2024-01-01T10:00:00Z",
      updatedAt: "2024-01-01T10:00:00Z",
    },
    {
      id: "msg2",
      content: "Hi Alice!",
      sender: {
        id: "user2",
        name: "Bob",
        email: "bob@example.com",
        avatar: null,
      },
      conversationId: "conv1",
      readBy: [],
      createdAt: "2024-01-01T10:01:00Z",
      updatedAt: "2024-01-01T10:01:00Z",
    },
  ];

  beforeEach(() => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
  });

  it("renders messages and sender names", () => {
    render(
      <MessageList
        messages={messages}
        currentUser={currentUser}
        isLoading={false}
      />
    );

    expect(screen.getByText("Hello there!")).toBeInTheDocument();
    expect(screen.getByText("Hi Alice!")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(
      <MessageList messages={[]} currentUser={currentUser} isLoading={true} />
    );

    // The loading state shows a CircularProgress component
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("shows empty state when no messages", () => {
    render(
      <MessageList messages={[]} currentUser={currentUser} isLoading={false} />
    );

    expect(screen.getByText("No messages yet")).toBeInTheDocument();
    expect(
      screen.getByText("Start the conversation by sending a message")
    ).toBeInTheDocument();
  });
});
