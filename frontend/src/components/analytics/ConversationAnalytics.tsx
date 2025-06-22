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
} from "@mui/material";
import {
  Analytics as AnalyticsIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";

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
  return (
    <Dialog
      open={isVisible}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
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
