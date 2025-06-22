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
      senderId: "user1",
      sender: {
        id: "user1",
        name: "Alice",
        email: "alice@example.com",
        avatar: null,
      },
      conversationId: "conv1",
      readBy: [],
      createdAt: new Date("2024-01-01T10:00:00Z"),
      updatedAt: new Date("2024-01-01T10:00:00Z"),
    },
    {
      id: "msg2",
      content: "Hi Alice!",
      senderId: "user2",
      sender: {
        id: "user2",
        name: "Bob",
        email: "bob@example.com",
        avatar: null,
      },
      conversationId: "conv1",
      readBy: [],
      createdAt: new Date("2024-01-01T10:01:00Z"),
      updatedAt: new Date("2024-01-01T10:01:00Z"),
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
        loading={false}
      />
    );

    expect(screen.getByText("Hello there!")).toBeInTheDocument();
    expect(screen.getByText("Hi Alice!")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });

  it("shows loading state", () => {
    const { container } = render(
      <MessageList messages={[]} currentUser={currentUser} isLoading={true} />
    );

    // The loading state shows a spinner with animate-spin class
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("shows empty state when no messages", () => {
    render(
      <MessageList messages={[]} currentUser={currentUser} loading={false} />
    );

    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
  });
});
