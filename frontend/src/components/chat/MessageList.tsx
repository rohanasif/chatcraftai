"use client";

import React, { useRef, useEffect } from "react";
import { Message, User } from "../../types";
import { formatMessageTime } from "../../utils";
import {
  Box,
  Typography,
  Avatar,
  Paper,
  CircularProgress,
} from "@mui/material";
import {
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

interface MessageListProps {
  messages: Message[];
  currentUser: User;
  isLoading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUser,
  isLoading = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (isLoading) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 4,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 4,
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No messages yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start the conversation by sending a message
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        overflow: "auto",
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {messages.map((message, index) => {
        const isOwnMessage = message.sender.id === currentUser.id;
        const showSender =
          index === 0 || messages[index - 1]?.sender.id !== message.sender.id;

        return (
          <Box
            key={message.id}
            sx={{
              display: "flex",
              justifyContent: isOwnMessage ? "flex-end" : "flex-start",
              mb: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: isOwnMessage ? "row-reverse" : "row",
                alignItems: "flex-end",
                gap: 1,
                maxWidth: "70%",
              }}
            >
              {!isOwnMessage && showSender && (
                <Avatar
                  src={message.sender.avatar}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: "secondary.main",
                    flexShrink: 0,
                  }}
                >
                  {message.sender.name?.charAt(0)}
                </Avatar>
              )}

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isOwnMessage ? "flex-end" : "flex-start",
                  gap: 0.5,
                }}
              >
                {!isOwnMessage && showSender && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: "text.secondary",
                      ml: 4,
                    }}
                  >
                    {message.sender.name}
                  </Typography>
                )}

                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    bgcolor: isOwnMessage ? "primary.main" : "background.paper",
                    color: isOwnMessage
                      ? "primary.contrastText"
                      : "text.primary",
                    borderRadius: 2,
                    maxWidth: "100%",
                    wordBreak: "break-word",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      lineHeight: 1.4,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {message.content}
                  </Typography>
                </Paper>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    ml: isOwnMessage ? 0 : 4,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.75rem",
                    }}
                  >
                    {formatMessageTime(message.createdAt)}
                  </Typography>

                  {isOwnMessage && (
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {message.readBy && message.readBy.length > 0 ? (
                        <CheckCircleIcon
                          sx={{
                            fontSize: 16,
                            color: "success.main",
                          }}
                        />
                      ) : (
                        <CheckIcon
                          sx={{
                            fontSize: 16,
                            color: "text.secondary",
                          }}
                        />
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        );
      })}

      <div ref={messagesEndRef} />
    </Box>
  );
};
