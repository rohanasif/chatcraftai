import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Avatar } from "../../../../frontend/src/components/ui/Avatar";

// Mock Next.js Image component
jest.mock("next/image", () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

describe("Avatar", () => {
  it("renders image if avatar url is provided", () => {
    const user = {
      id: "user1",
      name: "Alice Bob",
      avatar: "https://example.com/avatar.jpg",
    };

    render(<Avatar user={user} />);

    const image = screen.getByAltText("Alice Bob");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });

  it("renders fallback initials if no image", () => {
    const user = {
      id: "user1",
      name: "Alice Bob",
      avatar: null,
    };

    render(<Avatar user={user} />);

    expect(screen.getByText("AB")).toBeInTheDocument();
  });

  it("renders with custom className", () => {
    const user = {
      id: "user1",
      name: "Alice Bob",
      avatar: null,
    };

    render(<Avatar user={user} className="custom-class" />);

    const avatar = screen.getByText("AB");
    expect(avatar).toHaveClass("custom-class");
  });
});
