"use client";

import React from "react";
import { useTheme } from "@/lib/context/ThemeContext";

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

export function ShinyText({
  text,
  disabled = false,
  className = "",
}: ShinyTextProps) {
  const { resolvedAnimationMode } = useTheme();

  const isProfessional = resolvedAnimationMode === "professional" || disabled;

  if (isProfessional) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span
      className={`inline-block bg-[linear-gradient(110deg,#a1a1aa,45%,#ffffff,55%,#a1a1aa)] bg-[length:200%_100%] bg-clip-text text-transparent animate-[shine_4s_ease-in-out_infinite] ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(110deg, currentColor, 40%, rgba(255,255,255,0.9), 50%, currentColor 60%)",
      }}
    >
      {text}
    </span>
  );
}
