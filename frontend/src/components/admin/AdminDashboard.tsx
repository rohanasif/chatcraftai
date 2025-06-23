"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  Card,
  CardContent,
  Grid,
  IconButton,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  AdminPanelSettings as AdminIcon,
  Close as CloseIcon,
  People as PeopleIcon,
  Group as GroupIcon,
  Delete as DeleteIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { apiService } from "../../services/api";
import { User, Conversation } from "../../types";

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"users" | "groups">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "users") {
        const response = await apiService.getAllUsers();
        setUsers(response.users);
      } else {
        const response = await apiService.getAllGroups();
        setGroups(response);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      setError(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeTab, loadData]);

  // Only show for admin users
  if (!user?.isAdmin) {
    return null;
  }

  const handleUpdateUserRole = async (userId: string, isAdmin: boolean) => {
    try {
      await apiService.updateUserRole(userId, isAdmin);
      await loadData(); // Reload data
    } catch (error) {
      console.error("Failed to update user role:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update user role",
      );
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }
    try {
      await apiService.deleteUser(userId);
      await loadData(); // Reload data
    } catch (error) {
      console.error("Failed to delete user:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete user",
      );
    }
  };

  const handleUpdateGroup = async (
    groupId: string,
    data: { title?: string; isPublic?: boolean; memberEmails?: string[] },
  ) => {
    try {
      await apiService.updateGroup(groupId, data);
      await loadData(); // Reload data
    } catch (error) {
      console.error("Failed to update group:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update group",
      );
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this group?")) {
      return;
    }
    try {
      await apiService.deleteGroup(groupId);
      await loadData(); // Reload data
    } catch (error) {
      console.error("Failed to delete group:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete group",
      );
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AdminIcon color="primary" />
            <Typography variant="h5" component="span">
              Admin Dashboard
            </Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
          >
            <Tab
              icon={<PeopleIcon />}
              label={`Users (${users.length})`}
              value="users"
            />
            <Tab
              icon={<GroupIcon />}
              label={`Groups (${groups.length})`}
              value="groups"
            />
          </Tabs>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Users Tab */}
            {activeTab === "users" && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  User Management
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users
                        .filter((u) => u.id !== user.id)
                        .map((user) => (
                          <TableRow key={user.id} hover>
                            <TableCell>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <PersonIcon color="action" />
                                <Typography variant="body2" fontWeight="medium">
                                  {user.name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <FormControl size="small">
                                <Select
                                  value={user.isAdmin ? "admin" : "user"}
                                  onChange={(e) =>
                                    handleUpdateUserRole(
                                      user.id,
                                      e.target.value === "admin",
                                    )
                                  }
                                  sx={{ minWidth: 100 }}
                                >
                                  <MenuItem value="user">User</MenuItem>
                                  <MenuItem value="admin">Admin</MenuItem>
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                color="error"
                                onClick={() => handleDeleteUser(user.id)}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Groups Tab */}
            {activeTab === "groups" && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Group Management
                </Typography>
                <Grid container spacing={2}>
                  {groups.map((group) => (
                    <Grid item xs={12} md={6} lg={4} key={group.id}>
                      <Card variant="outlined" sx={{ height: "100%" }}>
                        <CardContent>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              mb: 2,
                            }}
                          >
                            <Typography
                              variant="h6"
                              component="h3"
                              sx={{ flex: 1 }}
                            >
                              {group.title}
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() =>
                                  handleUpdateGroup(group.id, {
                                    isPublic: !group.isPublic,
                                  })
                                }
                                startIcon={
                                  group.isPublic ? <LockIcon /> : <PublicIcon />
                                }
                              >
                                {group.isPublic
                                  ? "Make Private"
                                  : "Make Public"}
                              </Button>
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleDeleteGroup(group.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <PeopleIcon fontSize="small" color="action" />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Members: {group.members.length}
                              </Typography>
                            </Box>

                            <Chip
                              icon={
                                group.isPublic ? <PublicIcon /> : <LockIcon />
                              }
                              label={group.isPublic ? "Public" : "Private"}
                              size="small"
                              color={group.isPublic ? "success" : "default"}
                              variant="outlined"
                            />

                            {group.creator && (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <PersonIcon fontSize="small" color="action" />
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Created by: {group.creator.name}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={handleClose} disabled={loading}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
