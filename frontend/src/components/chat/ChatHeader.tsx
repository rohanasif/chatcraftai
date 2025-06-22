"use client";

import React from "react";
import { Conversation, User } from "../../types";
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Badge,
  Tooltip,
} from "@mui/material";
import {
  Analytics as AnalyticsIcon,
  Group as GroupIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";

interface ChatHeaderProps {
  conversation: Conversation;
  currentUser: User;
  onShowAnalytics: () => void;
  onShowMembers: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  currentUser,
  onShowAnalytics,
  onShowMembers,
}) => {
  const getConversationTitle = () => {
    if (conversation.isGroup) {
      return conversation.title || "Untitled Group";
    }
    // For direct chats, show the other user's name
    const otherMember = conversation.members.find(
      (member) => member.id !== currentUser.id,
    );
    return otherMember?.name || "Unknown User";
  };

  const getConversationSubtitle = () => {
    if (conversation.isGroup) {
      return `${conversation.members.length} members`;
    }
    return "Direct message";
  };

  const getOtherUser = () => {
    if (conversation.isGroup) return null;
    return conversation.members.find((member) => member.id !== currentUser.id);
  };

  const otherUser = getOtherUser();

  return (
    <Box
      sx={{
        p: 2,
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          flex: 1,
          minWidth: 0,
        }}
      >
        {conversation.isGroup ? (
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            badgeContent={
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  bgcolor: "success.main",
                  border: "2px solid",
                  borderColor: "background.paper",
                }}
              />
            }
          >
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: "primary.main",
              }}
            >
              <GroupIcon />
            </Avatar>
          </Badge>
        ) : (
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            badgeContent={
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  bgcolor: "success.main",
                  border: "2px solid",
                  borderColor: "background.paper",
                }}
              />
            }
          >
            <Avatar
              src={otherUser?.avatar}
              sx={{
                width: 48,
                height: 48,
                bgcolor: "secondary.main",
              }}
            >
              {otherUser?.name?.charAt(0) || "U"}
            </Avatar>
          </Badge>
        )}

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h6" noWrap sx={{ fontWeight: 600, mb: 0.5 }}>
            {getConversationTitle()}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {getConversationSubtitle()}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Tooltip title="Analytics">
          <IconButton
            size="small"
            onClick={onShowAnalytics}
            sx={{ color: "text.secondary" }}
          >
            <AnalyticsIcon />
          </IconButton>
        </Tooltip>

        {conversation.isGroup && (
          <Tooltip title="Members">
            <IconButton
              size="small"
              onClick={onShowMembers}
              sx={{ color: "text.secondary" }}
            >
              <GroupIcon />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title="More options">
          <IconButton size="small" sx={{ color: "text.secondary" }}>
            <MoreVertIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};
