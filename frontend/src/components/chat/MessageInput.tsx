"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Chip,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  Send as SendIcon,
  Lightbulb as LightbulbIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
  onRequestSuggestions: () => void;
  suggestions: string[];
  isTyping: boolean;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  onRequestSuggestions,
  suggestions,
  isTyping,
  disabled = false,
}) => {
  const [message, setMessage] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
      onTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    if (value.trim()) {
      onTyping(true);
    } else {
      onTyping(false);
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    onTyping(true);
  };

  const handleRemoveSuggestion = (index: number) => {
    // In a real app, you'd remove the suggestion from the backend
    console.log("Remove suggestion:", index);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  return (
    <Box
      sx={{
        p: 2,
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1, display: "block" }}
          >
            AI Suggestions:
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {suggestions.map((suggestion, index) => (
              <Chip
                key={index}
                label={suggestion}
                size="small"
                variant="outlined"
                onClick={() => handleSuggestionClick(suggestion)}
                onDelete={() => handleRemoveSuggestion(index)}
                deleteIcon={<CloseIcon />}
                sx={{
                  cursor: "pointer",
                  "&:hover": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Typing indicator */}
      {isTyping && (
        <Box sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={16} />
          <Typography variant="caption" color="text.secondary">
            Someone is typing...
          </Typography>
        </Box>
      )}

      {/* Message input */}
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={1}
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: 1,
          p: 1,
          borderRadius: 3,
        }}
      >
        <TextField
          ref={textareaRef}
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder="Type a message..."
          disabled={disabled}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            style: { fontSize: "0.875rem" },
          }}
          sx={{
            "& .MuiInputBase-root": {
              minHeight: 40,
              alignItems: "flex-end",
            },
          }}
        />

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton
            type="button"
            size="small"
            onClick={onRequestSuggestions}
            disabled={disabled}
            sx={{ color: "text.secondary" }}
            title="Get AI suggestions"
          >
            <LightbulbIcon />
          </IconButton>

          <IconButton
            type="submit"
            size="small"
            disabled={!message.trim() || disabled || isComposing}
            sx={{
              color: message.trim() ? "primary.main" : "text.disabled",
              "&:hover": {
                bgcolor: "primary.main",
                color: "primary.contrastText",
              },
            }}
            title="Send message"
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};
