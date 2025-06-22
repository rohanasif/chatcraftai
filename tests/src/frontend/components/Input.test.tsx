import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Input } from "../../../../frontend/src/components/ui/Input";

describe("Input", () => {
  it("renders input and handles value change", () => {
    const onChange = jest.fn();
    render(<Input value="" onChange={onChange} placeholder="Type here..." />);
    const input = screen.getByPlaceholderText("Type here...");
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "Hello" } });
    expect(onChange).toHaveBeenCalled();
  });
});
