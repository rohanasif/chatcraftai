"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "../types";
import { apiService } from "../services/api";
import { wsService } from "../services/websocket";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    avatar?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const response = await apiService.getCurrentUser();
      setUser(response.user);
    } catch (error: unknown) {
      // Don't log authentication errors as they're expected when user is not logged in
      const errorMessage = error instanceof Error ? error.message : "";
      const errorStatus = (error as { status?: number })?.status;

      if (
        errorStatus === 401 ||
        errorStatus === 403 ||
        errorMessage === "Access token required" ||
        errorMessage === "Unauthorized" ||
        errorMessage === "User not found" ||
        errorMessage === "Invalid token"
      ) {
        // This is expected when user is not authenticated
        setUser(null);
      } else {
        console.error("Failed to refresh user:", error);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only check authentication if we're on a protected route
    const pathname = window.location.pathname;
    const isProtectedRoute = pathname.startsWith("/dashboard");

    if (isProtectedRoute) {
      refreshUser();
    } else {
      // For public routes, just set loading to false
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password });
      // Reset WebSocket service for new connection
      wsService.resetForLogin();
      setUser(response.user);

      router.push("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    avatar?: string,
  ) => {
    try {
      const response = await apiService.register({
        email,
        password,
        name,
        avatar,
      });
      setUser(response.user);

      // Direct redirect to dashboard instead of relying on middleware
      router.push("/dashboard");
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
      // Clean up WebSocket connection
      wsService.logout();
      setUser(null);
      // Navigate to root and let middleware handle redirect
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
      // Still clear user state and WebSocket connection even if logout request fails
      wsService.logout();
      setUser(null);
      // Navigate to root and let middleware handle redirect
      router.push("/");
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
