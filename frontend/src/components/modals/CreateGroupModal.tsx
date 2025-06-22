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
  Chip,
  IconButton,
} from "@mui/material";
import {
  Group as GroupIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { isValidEmail } from "../../utils";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (title: string, memberEmails: string[]) => Promise<void>;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
}) => {
  const [title, setTitle] = useState("");
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Please enter a group title");
      return;
    }

    if (memberEmails.length === 0) {
      setError("Please add at least one member");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onCreateGroup(title.trim(), memberEmails);
      setTitle("");
      setMemberEmails([]);
      onClose();
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "Failed to create group",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = () => {
    const email = currentEmail.trim();

    if (!email) {
      setError("Please enter an email address");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (memberEmails.includes(email)) {
      setError("This email is already added");
      return;
    }

    setMemberEmails([...memberEmails, email]);
    setCurrentEmail("");
    setError("");
  };

  const handleRemoveMember = (emailToRemove: string) => {
    setMemberEmails(memberEmails.filter((email) => email !== emailToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddMember();
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle("");
      setMemberEmails([]);
      setCurrentEmail("");
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
          <GroupIcon color="primary" />
          <Typography variant="h6" component="span">
            Create Group Chat
          </Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a new group chat and invite members by their email addresses.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Group name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter group name"
            disabled={loading}
            required
            autoFocus
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle2" gutterBottom>
            Add Members ({memberEmails.length})
          </Typography>

          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              label="Email address"
              type="email"
              value={currentEmail}
              onChange={(e) => setCurrentEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter email address"
              disabled={loading}
              size="small"
            />
            <IconButton
              onClick={handleAddMember}
              disabled={loading || !currentEmail.trim()}
              color="primary"
              sx={{ flexShrink: 0 }}
            >
              <AddIcon />
            </IconButton>
          </Box>

          {memberEmails.length > 0 && (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {memberEmails.map((email, index) => (
                <Chip
                  key={index}
                  label={email}
                  onDelete={() => handleRemoveMember(email)}
                  deleteIcon={<CloseIcon />}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          )}
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
            disabled={loading || !title.trim() || memberEmails.length === 0}
            sx={{ minWidth: 100 }}
          >
            {loading ? "Creating..." : "Create Group"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
