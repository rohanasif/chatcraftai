"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import { Person as PersonIcon } from "@mui/icons-material";
import { isValidEmail } from "../../utils";
import toast from "react-hot-toast";

interface CreateDirectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (targetEmail: string) => Promise<void>;
}

export const CreateDirectChatModal: React.FC<CreateDirectChatModalProps> = ({
  isOpen,
  onClose,
  onCreateChat,
}) => {
  const [targetEmail, setTargetEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetEmail.trim()) {
      setError("Please enter an email address");
      return;
    }

    if (!isValidEmail(targetEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onCreateChat(targetEmail.trim());
      setTargetEmail("");
      onClose();
      toast.success("Direct chat created successfully!");
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "Failed to create chat",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTargetEmail("");
      setError("");
      onClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PersonIcon color="primary" />
          <Typography variant="h6" component="span">
            Start New Chat
          </Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter the email address of the person you want to chat with.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Email address"
            type="email"
            value={targetEmail}
            onChange={(e) => {
              setTargetEmail(e.target.value);
              if (error) setError("");
            }}
            placeholder="Enter email address"
            disabled={loading}
            required
            autoFocus
          />
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !targetEmail.trim()}
            sx={{ minWidth: 100 }}
          >
            {loading ? "Creating..." : "Start Chat"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
