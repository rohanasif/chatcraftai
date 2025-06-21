"use client";

import React from "react";
import Image from "next/image";
import { cn, getInitials, generateAvatarColor } from "../../utils";

interface AvatarProps {
  user: {
    name: string;
    avatar?: string;
  };
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

export const Avatar: React.FC<AvatarProps> = ({
  user,
  size = "md",
  className,
}) => {
  if (user.avatar) {
    return (
      <Image
        src={user.avatar}
        alt={user.name}
        width={size === "sm" ? 32 : size === "md" ? 40 : 48}
        height={size === "sm" ? 32 : size === "md" ? 40 : 48}
        className={cn(
          "rounded-full object-cover",
          sizeClasses[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-medium text-white",
        sizeClasses[size],
        generateAvatarColor(user.name),
        className,
      )}
    >
      {getInitials(user.name)}
    </div>
  );
};
