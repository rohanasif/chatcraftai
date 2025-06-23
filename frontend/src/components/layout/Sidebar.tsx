"use client";

import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Conversation } from "../../types";
import { formatMessageTime, truncateText } from "../../utils";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Badge,
  Divider,
  Menu,
  MenuItem,
  Chip,
  Paper,
} from "@mui/material";
import {
  Add as AddIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  Close as CloseIcon,
  Chat as ChatIcon,
} from "@mui/icons-material";

interface SidebarProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  onCreateDirectChat: () => void;
  onCreateGroupChat: () => void;
  onDiscoverGroups: () => void;
  onOpenAdminDashboard?: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onCreateDirectChat,
  onCreateGroupChat,
  onDiscoverGroups,
  onOpenAdminDashboard,
  isMobile = false,
  onClose,
}) => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.isGroup) {
      return conversation.title || "Untitled Group";
    }
    // For direct chats, show the other user's name
    const otherMember = conversation.members.find(
      (member) => member.id !== user?.id,
    );
    // If no other member found (chat with self), show current user's name
    return otherMember?.name || user?.name || "Unknown User";
  };

  const getLastMessage = (conversation: Conversation) => {
    if (!conversation.messages || conversation.messages.length === 0) {
      return "No messages yet";
    }
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return truncateText(lastMessage.content, 50);
  };

  const filteredConversations = conversations.filter((conversation) => {
    const title = getConversationTitle(conversation).toLowerCase();
    const lastMessage = getLastMessage(conversation).toLowerCase();
    const query = searchQuery.toLowerCase();
    return title.includes(query) || lastMessage.includes(query);
  });

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  const handleAdminDashboard = () => {
    if (onOpenAdminDashboard) {
      onOpenAdminDashboard();
    }
    handleMenuClose();
  };

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              minWidth: 0,
              flex: 1,
              overflow: "hidden",
            }}
          >
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
                src={user?.avatar}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: "primary.main",
                  flexShrink: 0,
                }}
              >
                {user?.name?.charAt(0)}
              </Avatar>
            </Badge>
            <Box sx={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
              <Typography
                variant="subtitle2"
                noWrap
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                }}
              >
                {user?.name}
                {user?.isAdmin && (
                  <Chip
                    label="Admin"
                    size="small"
                    color="primary"
                    sx={{ ml: 1, height: 20, fontSize: "0.75rem" }}
                  />
                )}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{ fontSize: { xs: "0.75rem", sm: "0.75rem" } }}
              >
                {user?.email}
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              flexShrink: 0,
            }}
          >
            <IconButton
              size="small"
              onClick={handleMenuClick}
              sx={{ color: "text.secondary" }}
            >
              <MoreVertIcon />
            </IconButton>
            {isMobile && (
              <IconButton
                size="small"
                onClick={onClose}
                sx={{ color: "text.secondary" }}
              >
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Search */}
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />
      </Box>

      {/* Action Buttons */}
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
        <Button
          fullWidth
          variant="outlined"
          size="small"
          startIcon={<PersonIcon />}
          onClick={onCreateDirectChat}
          sx={{ justifyContent: "flex-start" }}
        >
          New Chat
        </Button>
        {user?.isAdmin && (
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<GroupIcon />}
            onClick={onCreateGroupChat}
            sx={{ justifyContent: "flex-start" }}
          >
            Create Group
          </Button>
        )}
        <Button
          fullWidth
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={onDiscoverGroups}
          sx={{ justifyContent: "flex-start" }}
        >
          Discover Groups
        </Button>
        {user?.isAdmin && onOpenAdminDashboard && (
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<SettingsIcon />}
            onClick={onOpenAdminDashboard}
            sx={{
              justifyContent: "flex-start",
              borderColor: "warning.main",
              color: "warning.main",
              "&:hover": {
                borderColor: "warning.dark",
                bgcolor: "warning.light",
                color: "warning.dark",
              },
            }}
          >
            Admin Dashboard
          </Button>
        )}
        <Button
          fullWidth
          variant="outlined"
          size="small"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            justifyContent: "flex-start",
            color: "error.main",
            borderColor: "error.main",
            "&:hover": {
              borderColor: "error.dark",
              bgcolor: "error.light",
              color: "error.dark",
            },
          }}
        >
          Sign Out
        </Button>
      </Box>

      {/* Conversations List */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <Box sx={{ px: 2, py: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, textTransform: "uppercase" }}
          >
            Conversations ({filteredConversations.length})
          </Typography>
        </Box>
        <List sx={{ px: 1, py: 0, height: "100%", overflow: "auto" }}>
          {filteredConversations.map((conversation) => {
            const isSelected = conversation.id === selectedConversationId;
            const hasUnread =
              conversation.unreadCount && conversation.unreadCount > 0;

            return (
              <ListItem key={conversation.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => {
                    onSelectConversation(conversation);
                    if (isMobile && onClose) {
                      onClose();
                    }
                  }}
                  sx={{
                    borderRadius: 2,
                    "&.Mui-selected": {
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      "&:hover": {
                        bgcolor: "primary.dark",
                      },
                    },
                  }}
                >
                  <ListItemAvatar>
                    {conversation.isGroup ? (
                      <Avatar
                        sx={{
                          bgcolor: "primary.main",
                          width: 40,
                          height: 40,
                        }}
                      >
                        <GroupIcon />
                      </Avatar>
                    ) : (
                      <Avatar
                        src={
                          conversation.members.find((m) => m.id !== user?.id)
                            ?.avatar
                        }
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: "secondary.main",
                        }}
                      >
                        {getConversationTitle(conversation).charAt(0)}
                      </Avatar>
                    )}
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography
                          variant="body2"
                          noWrap
                          component="div"
                          sx={{
                            fontWeight: hasUnread ? 600 : 400,
                            color: isSelected
                              ? "inherit"
                              : hasUnread
                                ? "text.primary"
                                : "text.secondary",
                          }}
                        >
                          {getConversationTitle(conversation)}
                        </Typography>
                        {hasUnread && (
                          <Chip
                            label={conversation.unreadCount}
                            size="small"
                            color="primary"
                            sx={{
                              height: 20,
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        noWrap
                        component="div"
                        sx={{
                          color: isSelected
                            ? "inherit"
                            : hasUnread
                              ? "text.primary"
                              : "text.secondary",
                          opacity: isSelected ? 0.8 : 1,
                        }}
                      >
                        {getLastMessage(conversation)}
                      </Typography>
                    }
                  />
                  {conversation.messages &&
                    conversation.messages.length > 0 && (
                      <Typography
                        variant="caption"
                        component="div"
                        sx={{
                          color: isSelected ? "inherit" : "text.secondary",
                          opacity: isSelected ? 0.6 : 1,
                          display: "block",
                          mt: 0.5,
                          ml: 7, // Align with the text content
                        }}
                      >
                        {formatMessageTime(
                          conversation.messages[
                            conversation.messages.length - 1
                          ].createdAt,
                        )}
                      </Typography>
                    )}
                </ListItemButton>
              </ListItem>
            );
          })}

          {filteredConversations.length === 0 && searchQuery ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <SearchIcon
                sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                gutterBottom
                component="div"
              >
                No conversations found
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                component="div"
              >
                Try adjusting your search terms
              </Typography>
            </Box>
          ) : (
            filteredConversations.length === 0 && (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    mx: "auto",
                    mb: 2,
                    bgcolor: "grey.100",
                  }}
                >
                  <ChatIcon sx={{ fontSize: 32, color: "text.disabled" }} />
                </Avatar>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  gutterBottom
                  component="div"
                >
                  No conversations yet
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  component="div"
                  sx={{ display: "block", mb: 2 }}
                >
                  Start a new chat to begin messaging
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PersonIcon />}
                  onClick={onCreateDirectChat}
                >
                  Start New Chat
                </Button>
              </Box>
            )
          )}
        </List>
      </Box>
    </Box>
  );

  return (
    <>
      {isMobile ? (
        <Drawer
          anchor="left"
          open={true}
          onClose={onClose}
          variant="temporary"
          sx={{
            "& .MuiDrawer-paper": {
              width: 320,
              boxSizing: "border-box",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Paper
          elevation={0}
          sx={{
            width: 320,
            height: "100%",
            borderRight: "1px solid",
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {drawerContent}
        </Paper>
      )}

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 180,
          },
        }}
      >
        {user?.isAdmin && onOpenAdminDashboard && (
          <MenuItem onClick={handleAdminDashboard}>
            <SettingsIcon sx={{ mr: 2, fontSize: 20 }} />
            Admin Dashboard
          </MenuItem>
        )}
        <MenuItem onClick={handleMenuClose}>
          <NotificationsIcon sx={{ mr: 2, fontSize: 20 }} />
          Notifications
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
          <LogoutIcon sx={{ mr: 2, fontSize: 20 }} />
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
};
