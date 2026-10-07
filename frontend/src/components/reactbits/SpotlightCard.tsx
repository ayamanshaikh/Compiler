"use client";

import React, { useRef, useState } from "react";
import { useTheme } from "@/lib/context/ThemeContext";

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}

export function SpotlightCard({
  children,
  className = "",
  spotlightColor,
  ...props
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const { resolvedAnimationMode } = useTheme();

  const isProfessional = resolvedAnimationMode === "professional";

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isProfessional || !divRef.current) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => {
    if (isProfessional) return;
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    if (isProfessional) return;
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 transition-colors duration-200 ${className}`}
      {...props}
    >
      {!isProfessional && (
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300"
          style={{
            opacity,
            background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${
              spotlightColor || "var(--color-accent-subtle, rgba(16, 185, 129, 0.15))"
            }, transparent 80%)`,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
