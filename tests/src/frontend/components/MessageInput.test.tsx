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
      />
    );
    expect(
      screen.getByPlaceholderText("Type a message...")
    ).toBeInTheDocument();
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  it("calls onSendMessage when message is submitted", () => {
    const onSendMessage = jest.fn();
    render(
      <MessageInput
        onSendMessage={onSendMessage}
        onTyping={jest.fn()}
        onRequestSuggestions={jest.fn()}
      />
    );
    fireEvent.change(screen.getByPlaceholderText("Type a message..."), {
      target: { value: "Hello world" },
    });
    fireEvent.click(screen.getByText("Send"));
    expect(onSendMessage).toHaveBeenCalledWith("Hello world");
  });

  it("calls onRequestSuggestions when 🤖 button is clicked", () => {
    const onRequestSuggestions = jest.fn();
    render(
      <MessageInput
        onSendMessage={jest.fn()}
        onTyping={jest.fn()}
        onRequestSuggestions={onRequestSuggestions}
      />
    );
    fireEvent.click(screen.getByTitle("Get AI suggestions"));
    expect(onRequestSuggestions).toHaveBeenCalled();
  });
});
