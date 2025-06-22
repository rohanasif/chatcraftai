"use client";

import React from "react";
import Image from "next/image";
import { cn, getInitials, generateAvatarColor } from "../../utils";

interface AvatarProps {
  user: {
    name: string;
    avatar?: string;
  };
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showStatus?: boolean;
  status?: "online" | "offline" | "away" | "busy";
}

const sizeClasses = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
  "2xl": "w-20 h-20 text-xl",
};

const statusColors = {
  online: "bg-green-500",
  offline: "bg-gray-400",
  away: "bg-yellow-500",
  busy: "bg-red-500",
};

export const Avatar: React.FC<AvatarProps> = ({
  user,
  size = "md",
  className,
  showStatus = false,
  status = "offline",
}) => {
  if (user.avatar) {
    return (
      <div className="relative inline-block">
        <Image
          src={user.avatar}
          alt={user.name}
          width={
            size === "xs"
              ? 24
              : size === "sm"
                ? 32
                : size === "md"
                  ? 40
                  : size === "lg"
                    ? 48
                    : size === "xl"
                      ? 64
                      : 80
          }
          height={
            size === "xs"
              ? 24
              : size === "sm"
                ? 32
                : size === "md"
                  ? 40
                  : size === "lg"
                    ? 48
                    : size === "xl"
                      ? 64
                      : 80
          }
          className={cn(
            "rounded-full object-cover ring-2 ring-white shadow-sm",
            sizeClasses[size],
            className,
          )}
        />
        {showStatus && (
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full ring-2 ring-white",
              statusColors[status],
            )}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-semibold text-white shadow-sm ring-2 ring-white",
          sizeClasses[size],
          generateAvatarColor(user.name),
          className,
        )}
      >
        {getInitials(user.name)}
      </div>
      {showStatus && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full ring-2 ring-white",
            statusColors[status],
          )}
        />
      )}
    </div>
  );
};
