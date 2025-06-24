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
  FormControlLabel,
  Checkbox,
  IconButton,
} from "@mui/material";
import { Group as GroupIcon, Close as CloseIcon } from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { apiService } from "../../services/api";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [memberEmails, setMemberEmails] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Only show for admin users
  if (!user?.isAdmin) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const emails = memberEmails
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      if (emails.length === 0) {
        setError("Please enter at least one member email");
        return;
      }

      await apiService.createGroupChat({
        userId: user.id,
        title,
        memberEmails: emails,
        isPublic,
      });

      setTitle("");
      setMemberEmails("");
      setIsPublic(false);
      onGroupCreated();
      onClose();
    } catch (error) {
      console.error("Failed to create group:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create group",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle("");
      setMemberEmails("");
      setIsPublic(false);
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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <GroupIcon color="primary" />
            <Typography variant="h6" component="span">
              Create Group Chat
            </Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pb: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Group Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter group title"
            required
            sx={{ mb: 3 }}
          />

          <TextField
            fullWidth
            label="Member Emails (comma-separated)"
            value={memberEmails}
            onChange={(e) => setMemberEmails(e.target.value)}
            placeholder="email1@example.com, email2@example.com"
            multiline
            rows={3}
            required
            sx={{ mb: 3 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                color="primary"
              />
            }
            label="Make group public (discoverable by other users)"
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
            disabled={loading}
            sx={{ minWidth: 100 }}
          >
            {loading ? "Creating..." : "Create Group"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
