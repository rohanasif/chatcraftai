"use client";

import React from "react";
import { ConversationAnalytics as AnalyticsType } from "../../types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Analytics as AnalyticsIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from "chart.js";
import { Line, Pie, Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
);

interface ConversationAnalyticsProps {
  analytics: AnalyticsType;
  isVisible: boolean;
  onClose: () => void;
}

// Sentiment distribution pie chart
const SentimentPieChart: React.FC<{ sentiment: string[] }> = ({
  sentiment,
}) => {
  if (!sentiment || sentiment.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No sentiment data available
        </Typography>
      </Box>
    );
  }

  const positiveCount = sentiment.filter((s) => s === "positive").length;
  const neutralCount = sentiment.filter((s) => s === "neutral").length;
  const negativeCount = sentiment.filter((s) => s === "negative").length;

  const chartData = {
    labels: ["Positive", "Neutral", "Negative"],
    datasets: [
      {
        data: [positiveCount, neutralCount, negativeCount],
        backgroundColor: [
          "rgba(76, 175, 80, 0.8)",
          "rgba(158, 158, 158, 0.8)",
          "rgba(244, 67, 54, 0.8)",
        ],
        borderColor: [
          "rgba(76, 175, 80, 1)",
          "rgba(158, 158, 158, 1)",
          "rgba(244, 67, 54, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
      title: {
        display: true,
        text: "Sentiment Distribution",
      },
      tooltip: {
        callbacks: {
          label: function (context: {
            dataset: { data: number[] };
            parsed: number;
            label: string;
          }) {
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0,
            );
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <Box sx={{ height: 300 }}>
      <Pie data={chartData} options={options} />
    </Box>
  );
};

// Sentiment timeline chart component using Chart.js
const SentimentTimelineChart: React.FC<{
  timeline: AnalyticsType["sentimentTimeline"];
}> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No sentiment timeline data available
        </Typography>
      </Box>
    );
  }

  // Convert sentiment to numeric values for charting
  const sentimentToNumber = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return 1;
      case "neutral":
        return 0;
      case "negative":
        return -1;
      default:
        return 0;
    }
  };

  const chartData = {
    labels: timeline.map((entry) =>
      new Date(entry.timestamp).toLocaleTimeString(),
    ),
    datasets: [
      {
        label: "Sentiment",
        data: timeline.map((entry) => sentimentToNumber(entry.sentiment)),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        tension: 0.1,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: false,
      },
      {
        label: "Message Count",
        data: timeline.map((entry) => entry.messageCount),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        tension: 0.1,
        pointRadius: 6,
        pointHoverRadius: 8,
        yAxisID: "y1",
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Time",
        },
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        min: -1.5,
        max: 1.5,
        ticks: {
          stepSize: 1,
          callback: function (value: number) {
            if (value === 1) return "Positive";
            if (value === 0) return "Neutral";
            if (value === -1) return "Negative";
            return "";
          },
        },
        title: {
          display: true,
          text: "Sentiment",
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: "Message Count",
        },
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Sentiment Timeline",
      },
      tooltip: {
        callbacks: {
          label: function (context: {
            datasetIndex: number;
            dataIndex: number;
            parsed: { y: number };
          }) {
            if (context.datasetIndex === 0) {
              const sentiment = timeline[context.dataIndex]?.sentiment;
              return `Sentiment: ${sentiment}`;
            } else {
              return `Messages: ${context.parsed.y}`;
            }
          },
        },
      },
    },
  };

  return (
    <Box sx={{ height: 300 }}>
      <Line data={chartData} options={options} />
    </Box>
  );
};

// Sentiment trends bar chart
const SentimentTrendsChart: React.FC<{ sentiment: string[] }> = ({
  sentiment,
}) => {
  if (!sentiment || sentiment.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No sentiment data available
        </Typography>
      </Box>
    );
  }

  // Group sentiments by chunks of 10 messages for trend analysis
  const chunkSize = 10;
  const chunks = [];
  for (let i = 0; i < sentiment.length; i += chunkSize) {
    chunks.push(sentiment.slice(i, i + chunkSize));
  }

  const chartData = {
    labels: chunks.map((_, index) => `Batch ${index + 1}`),
    datasets: [
      {
        label: "Positive",
        data: chunks.map(
          (chunk) => chunk.filter((s) => s === "positive").length,
        ),
        backgroundColor: "rgba(76, 175, 80, 0.8)",
        borderColor: "rgba(76, 175, 80, 1)",
        borderWidth: 1,
      },
      {
        label: "Neutral",
        data: chunks.map(
          (chunk) => chunk.filter((s) => s === "neutral").length,
        ),
        backgroundColor: "rgba(158, 158, 158, 0.8)",
        borderColor: "rgba(158, 158, 158, 1)",
        borderWidth: 1,
      },
      {
        label: "Negative",
        data: chunks.map(
          (chunk) => chunk.filter((s) => s === "negative").length,
        ),
        backgroundColor: "rgba(244, 67, 54, 0.8)",
        borderColor: "rgba(244, 67, 54, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: "Message Batches (10 messages each)",
        },
      },
      y: {
        title: {
          display: true,
          text: "Count",
        },
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Sentiment Trends by Message Batches",
      },
    },
  };

  return (
    <Box sx={{ height: 300 }}>
      <Bar data={chartData} options={options} />
    </Box>
  );
};

export const ConversationAnalytics: React.FC<ConversationAnalyticsProps> = ({
  analytics,
  isVisible,
  onClose,
}) => {
  const [activeTab, setActiveTab] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Dialog
      open={isVisible}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AnalyticsIcon color="primary" />
          <Typography variant="h6" component="span">
            Conversation Analytics
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        <Grid container spacing={3}>
          {/* Key Metrics */}
          <Grid sx={{ width: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Key Metrics
            </Typography>
            <Grid container spacing={2}>
              <Grid sx={{ width: { xs: "100%", sm: "50%", md: "25%" } }}>
                <Card sx={{ textAlign: "center" }}>
                  <CardContent>
                    <MessageIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" component="div" gutterBottom>
                      {analytics.stats.messageCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Messages
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid sx={{ width: { xs: "100%", sm: "50%", md: "25%" } }}>
                <Card sx={{ textAlign: "center" }}>
                  <CardContent>
                    <PersonIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" component="div" gutterBottom>
                      {analytics.stats.wordCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Word Count
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid sx={{ width: { xs: "100%", sm: "50%", md: "25%" } }}>
                <Card sx={{ textAlign: "center" }}>
                  <CardContent>
                    <TrendingUpIcon
                      color="primary"
                      sx={{ fontSize: 40, mb: 1 }}
                    />
                    <Typography variant="h4" component="div" gutterBottom>
                      {analytics.stats.aiSuggestionsUsed}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      AI Suggestions Used
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid sx={{ width: { xs: "100%", sm: "50%", md: "25%" } }}>
                <Card sx={{ textAlign: "center" }}>
                  <CardContent>
                    <ScheduleIcon
                      color="primary"
                      sx={{ fontSize: 40, mb: 1 }}
                    />
                    <Typography variant="h4" component="div" gutterBottom>
                      {analytics.stats.isInactive ? "Inactive" : "Active"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          <Grid sx={{ width: "100%" }}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Summary */}
          <Grid sx={{ width: { xs: "100%", md: "50%" } }}>
            <Typography variant="h6" gutterBottom>
              Summary
            </Typography>
            <Card>
              <CardContent>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.6 }}
                >
                  {analytics.summary}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Sentiment Analysis */}
          <Grid sx={{ width: { xs: "100%", md: "50%" } }}>
            <Typography variant="h6" gutterBottom>
              Sentiment Analysis
            </Typography>
            <Card>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid sx={{ width: "33.333%" }}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="h4" color="success.main">
                        {
                          analytics.sentiment.filter((s) => s === "positive")
                            .length
                        }
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Positive
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid sx={{ width: "33.333%" }}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="h4" color="text.secondary">
                        {
                          analytics.sentiment.filter((s) => s === "neutral")
                            .length
                        }
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Neutral
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid sx={{ width: "33.333%" }}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="h4" color="error.main">
                        {
                          analytics.sentiment.filter((s) => s === "negative")
                            .length
                        }
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Negative
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Sentiment Charts */}
          {(analytics.sentiment.length > 0 ||
            (analytics.sentimentTimeline &&
              analytics.sentimentTimeline.length > 0)) && (
            <Grid sx={{ width: "100%" }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Sentiment Visualizations
              </Typography>

              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  aria-label="sentiment charts"
                >
                  <Tab label="Distribution" />
                  <Tab label="Timeline" />
                  <Tab label="Trends" />
                </Tabs>
              </Box>

              <Card>
                <CardContent>
                  {activeTab === 0 && (
                    <SentimentPieChart sentiment={analytics.sentiment} />
                  )}
                  {activeTab === 1 && (
                    <SentimentTimelineChart
                      timeline={analytics.sentimentTimeline}
                    />
                  )}
                  {activeTab === 2 && (
                    <SentimentTrendsChart sentiment={analytics.sentiment} />
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} sx={{ minWidth: 100 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
