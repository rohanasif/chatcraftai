"use client";

import React from "react";
import { ConversationAnalytics as AnalyticsType } from "../../types";
import { formatRelativeTime } from "../../utils";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

interface ConversationAnalyticsProps {
  analytics: AnalyticsType;
  isVisible: boolean;
  onClose: () => void;
}

export const ConversationAnalytics: React.FC<ConversationAnalyticsProps> = ({
  analytics,
  isVisible,
  onClose,
}) => {
  if (!isVisible) return null;

  const chartData = {
    labels: analytics.sentiment.map((_, i) => `Day ${i + 1}`),
    datasets: [
      {
        label: "Sentiment Score",
        data: analytics.sentiment.map((sentiment) => {
          // Convert sentiment strings to numeric values for charting
          const sentimentMap: { [key: string]: number } = {
            positive: 1,
            neutral: 0,
            negative: -1,
          };
          return sentimentMap[sentiment] || 0;
        }),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Conversation Sentiment Over Time",
      },
    },
    scales: {
      y: {
        min: -1,
        max: 1,
        ticks: {
          stepSize: 1,
          callback: function (tickValue: string | number) {
            if (tickValue === 1) return "Positive";
            if (tickValue === 0) return "Neutral";
            if (tickValue === -1) return "Negative";
            return "";
          },
        },
      },
    },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Conversation Analytics
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Summary</h3>
            <p className="text-gray-700 leading-relaxed">{analytics.summary}</p>
          </div>

          {/* Stats */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Statistics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Messages:</span>
                <span className="font-medium">
                  {analytics.stats.messageCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Word Count:</span>
                <span className="font-medium">{analytics.stats.wordCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">AI Suggestions Used:</span>
                <span className="font-medium">
                  {analytics.stats.aiSuggestionsUsed}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span
                  className={`font-medium ${
                    analytics.stats.isInactive
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                >
                  {analytics.stats.isInactive ? "Inactive" : "Active"}
                </span>
              </div>
              {analytics.stats.lastActivity && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Activity:</span>
                  <span className="font-medium text-sm">
                    {formatRelativeTime(analytics.stats.lastActivity)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sentiment Chart */}
        {analytics.sentiment.length > 0 && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Sentiment Analysis
            </h3>
            <div className="h-64">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Sentiment Breakdown */}
        {analytics.sentiment.length > 0 && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Sentiment Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analytics.sentiment.filter((s) => s === "positive").length}
                </div>
                <div className="text-sm text-gray-600">Positive</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {analytics.sentiment.filter((s) => s === "neutral").length}
                </div>
                <div className="text-sm text-gray-600">Neutral</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {analytics.sentiment.filter((s) => s === "negative").length}
                </div>
                <div className="text-sm text-gray-600">Negative</div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
