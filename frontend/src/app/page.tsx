"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Avatar,
  CircularProgress,
} from "@mui/material";
import {
  Chat as ChatIcon,
  AutoAwesome as SparklesIcon,
  Security as ShieldIcon,
  Bolt as BoltIcon,
  Group as UsersIcon,
  Psychology as BrainIcon,
} from "@mui/icons-material";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #e0e7ff 100%)",
        }}
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  const features = [
    {
      icon: <SparklesIcon sx={{ fontSize: 40 }} />,
      title: "AI-Powered Features",
      description:
        "Grammar correction, smart reply suggestions, and intelligent conversation insights powered by advanced AI.",
    },
    {
      icon: <BoltIcon sx={{ fontSize: 40 }} />,
      title: "Real-time Messaging",
      description:
        "Instant message delivery with typing indicators and read receipts for seamless communication.",
    },
    {
      icon: <UsersIcon sx={{ fontSize: 40 }} />,
      title: "Group & Direct Chats",
      description:
        "Create group conversations or start private chats with individual users.",
    },
    {
      icon: <BrainIcon sx={{ fontSize: 40 }} />,
      title: "Smart Analytics",
      description:
        "Get insights into your conversations with detailed analytics and engagement metrics.",
    },
    {
      icon: <ShieldIcon sx={{ fontSize: 40 }} />,
      title: "Secure & Private",
      description:
        "End-to-end encryption and privacy-focused design to keep your conversations safe.",
    },
    {
      icon: <ChatIcon sx={{ fontSize: 40 }} />,
      title: "Modern Interface",
      description:
        "Beautiful, responsive design that works seamlessly across all devices and platforms.",
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Hero Section */}
      <Box
        sx={{
          background:
            "linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #e0e7ff 100%)",
          pt: { xs: 8, md: 12 },
          pb: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 8 }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mx: "auto",
                mb: 4,
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                boxShadow: 4,
              }}
            >
              <ChatIcon sx={{ fontSize: 60 }} />
            </Avatar>
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 800,
                fontSize: { xs: "2.5rem", md: "3.5rem" },
                background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 3,
              }}
            >
              ChatCraftAI
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{
                mb: 6,
                maxWidth: 600,
                mx: "auto",
                lineHeight: 1.6,
                fontWeight: 400,
              }}
            >
              The next-generation messaging platform with AI-powered features
              for smarter conversations
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="contained"
                size="large"
                href="/auth/register"
                sx={{
                  py: 2,
                  px: 4,
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  borderRadius: 3,
                }}
              >
                Get Started Free
              </Button>
              <Button
                variant="outlined"
                size="large"
                href="/auth/login"
                sx={{
                  py: 2,
                  px: 4,
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  borderRadius: 3,
                }}
              >
                Sign In
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: "center", mb: 8 }}>
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 700, mb: 3 }}
          >
            Powerful Features
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 600, mx: "auto", lineHeight: 1.6 }}
          >
            Everything you need for modern, intelligent messaging
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid
              key={index}
              sx={{
                width: { xs: "100%", sm: "50%", md: "33.333%" },
              }}
            >
              <Card
                sx={{
                  height: "100%",
                  p: 3,
                  textAlign: "center",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mx: "auto",
                      mb: 3,
                      background:
                        "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                      color: "white",
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography
                    variant="h6"
                    component="h3"
                    gutterBottom
                    sx={{ fontWeight: 600, mb: 2 }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.6 }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
          py: { xs: 8, md: 12 },
          color: "white",
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h3"
              component="h2"
              gutterBottom
              sx={{ fontWeight: 700, mb: 3 }}
            >
              Ready to Transform Your Messaging?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                mb: 6,
                opacity: 0.9,
                lineHeight: 1.6,
                maxWidth: 500,
                mx: "auto",
              }}
            >
              Join thousands of users who are already experiencing the future of
              communication
            </Typography>
            <Button
              variant="contained"
              size="large"
              href="/auth/register"
              sx={{
                py: 2,
                px: 6,
                fontSize: "1.1rem",
                fontWeight: 600,
                borderRadius: 3,
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
                },
              }}
            >
              Start Your Free Trial
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          bgcolor: "grey.50",
          py: 6,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              © 2024 ChatCraftAI. All rights reserved.
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 3,
                flexWrap: "wrap",
              }}
            >
              <Button size="small" color="inherit" href="/terms">
                Terms of Service
              </Button>
              <Button size="small" color="inherit" href="/privacy">
                Privacy Policy
              </Button>
              <Button size="small" color="inherit" href="/support">
                Support
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
