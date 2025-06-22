import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MessageInput } from "../../../../frontend/src/components/chat/MessageInput";

describe("MessageInput", () => {
  it("renders textarea and send button", () => {
    render(
      <MessageInput
        onSendMessage={jest.fn()}
        onTyping={jest.fn()}
        onRequestSuggestions={jest.fn()}
        suggestions={[]}
        isTyping={false}
      />
    );
    expect(
      screen.getByPlaceholderText("Type a message...")
    ).toBeInTheDocument();
    expect(screen.getByTitle("Send message")).toBeInTheDocument();
  });

  it("calls onSendMessage when message is submitted", () => {
    const onSendMessage = jest.fn();
    render(
      <MessageInput
        onSendMessage={onSendMessage}
        onTyping={jest.fn()}
        onRequestSuggestions={jest.fn()}
        suggestions={[]}
        isTyping={false}
      />
    );
    fireEvent.change(screen.getByPlaceholderText("Type a message..."), {
      target: { value: "Hello world" },
    });
    fireEvent.click(screen.getByTitle("Send message"));
    expect(onSendMessage).toHaveBeenCalledWith("Hello world");
  });

  it("calls onRequestSuggestions when 🤖 button is clicked", () => {
    const onRequestSuggestions = jest.fn();
    render(
      <MessageInput
        onSendMessage={jest.fn()}
        onTyping={jest.fn()}
        onRequestSuggestions={onRequestSuggestions}
        suggestions={[]}
        isTyping={false}
      />
    );
    fireEvent.click(screen.getByTitle("Get AI suggestions"));
    expect(onRequestSuggestions).toHaveBeenCalled();
  });
});
