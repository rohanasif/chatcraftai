"use client";

import React from "react";
import { cn } from "../../utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "success";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  children: React.ReactNode;
}

const variants = {
  primary:
    "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm hover:shadow-md",
  secondary:
    "bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white shadow-sm hover:shadow-md",
  outline:
    "border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-gray-700 bg-white shadow-sm hover:shadow-md",
  ghost: "hover:bg-gray-100 active:bg-gray-200 text-gray-700",
  danger:
    "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm hover:shadow-md",
  success:
    "bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-sm hover:shadow-md",
};

const sizes = {
  xs: "px-2 py-1 text-xs font-medium",
  sm: "px-3 py-1.5 text-sm font-medium",
  md: "px-4 py-2 text-sm font-medium",
  lg: "px-6 py-3 text-base font-medium",
  xl: "px-8 py-4 text-lg font-medium",
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}) => {
  return (
    <button
      className={cn(
        "btn inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none transform active:scale-95",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};
