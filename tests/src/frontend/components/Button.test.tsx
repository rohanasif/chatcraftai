import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Button } from "../../../../frontend/src/components/ui/Button";

describe("Button", () => {
  it("renders children and handles click", () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click Me</Button>);
    const btn = screen.getByText("Click Me");
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalled();
  });
});
