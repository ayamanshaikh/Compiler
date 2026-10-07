"use client";

import React, { forwardRef, ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium shadow-xs border border-[var(--color-accent-border)] active:translate-y-[1px]",
  secondary:
    "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium border border-zinc-700 active:translate-y-[1px]",
  outline:
    "bg-transparent hover:bg-zinc-800/60 text-zinc-300 hover:text-white border border-zinc-700/80 active:translate-y-[1px]",
  ghost:
    "bg-transparent hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-100 active:translate-y-[1px]",
  danger:
    "bg-red-600/90 hover:bg-red-500 text-white font-medium border border-red-500/30 active:translate-y-[1px]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "text-xs px-2.5 py-1.5 gap-1.5 rounded-md",
  md: "text-sm px-3.5 py-2 gap-2 rounded-lg",
  lg: "text-base px-4 py-2.5 gap-2.5 rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyle =
      "inline-flex items-center justify-center transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500/60";

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
