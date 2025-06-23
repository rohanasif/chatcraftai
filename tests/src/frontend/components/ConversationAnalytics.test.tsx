import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ConversationAnalytics } from "../../../../frontend/src/components/analytics/ConversationAnalytics";

// Mock chart.js components with proper canvas context
jest.mock("react-chartjs-2", () => ({
  Line: () => {
    // Create a mock canvas element
    const canvas = document.createElement("canvas");
    canvas.getContext = jest.fn(() => ({
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => ({ data: new Array(4) })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => ({ data: new Array(4) })),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      fillText: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      measureText: jest.fn(() => ({ width: 0 })),
      transform: jest.fn(),
      rect: jest.fn(),
      clip: jest.fn(),
    }));
    return <div data-testid="line-chart">Line Chart</div>;
  },
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
}));

// Mock chart.js registration
jest.mock("chart.js", () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

// Mock AuthContext
jest.mock("../../../../frontend/src/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
  }),
}));

describe("ConversationAnalytics", () => {
  const analytics = {
    summary: "This conversation shows positive sentiment overall.",
    stats: {
      messageCount: 150,
      wordCount: 2500,
      aiSuggestionsUsed: 15,
      isInactive: false,
      lastActivity: "2024-01-15T10:30:00Z",
    },
    sentiment: [
      "positive",
      "neutral",
      "positive",
      "negative",
      "positive",
      "neutral",
      "positive",
    ],
    sentimentTimeline: [
      {
        timestamp: "2024-01-15T10:00:00Z",
        sentiment: "positive" as const,
        messageCount: 5,
      },
      {
        timestamp: "2024-01-15T10:30:00Z",
        sentiment: "neutral" as const,
        messageCount: 3,
      },
    ],
  };

  it("renders summary, stats, and sentiment chart", () => {
    render(
      <ConversationAnalytics
        analytics={analytics}
        isVisible={true}
        onClose={jest.fn()}
      />
    );

    expect(
      screen.getByText("This conversation shows positive sentiment overall.")
    ).toBeInTheDocument();
    expect(screen.getByText("Conversation Analytics")).toBeInTheDocument();
    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByText("Key Metrics")).toBeInTheDocument();
    expect(screen.getByText("Sentiment Analysis")).toBeInTheDocument();
  });

  it("does not render if isVisible is false", () => {
    render(
      <ConversationAnalytics
        analytics={analytics}
        isVisible={false}
        onClose={jest.fn()}
      />
    );

    expect(
      screen.queryByText("This conversation shows positive sentiment overall.")
    ).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = jest.fn();

    render(
      <ConversationAnalytics
        analytics={analytics}
        isVisible={true}
        onClose={onClose}
      />
    );

    const closeButton = screen.getByRole("button", { name: /close/i });
    closeButton.click();

    expect(onClose).toHaveBeenCalled();
  });
});
