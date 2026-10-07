"use client";

import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "@/lib/context/ThemeContext";

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: "view" | "hover";
  revealDirection?: "start" | "end" | "center";
}

const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*<>/=";

export function DecryptedText({
  text,
  speed = 40,
  maxIterations = 10,
  className = "",
  parentClassName = "",
  encryptedClassName = "text-zinc-500 font-mono",
  animateOn = "view",
}: DecryptedTextProps) {
  const { resolvedAnimationMode } = useTheme();
  const [displayText, setDisplayText] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);
  const hasAnimatedRef = useRef(false);

  const isProfessional = resolvedAnimationMode === "professional";

  useEffect(() => {
    if (isProfessional || animateOn !== "view" || hasAnimatedRef.current) {
      setDisplayText(text);
      return;
    }

    let iteration = 0;
    setIsScrambling(true);

    const interval = setInterval(() => {
      setDisplayText(() =>
        text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iteration / 2) return text[index];
            return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
          })
          .join("")
      );

      iteration += 1;

      if (iteration >= text.length * 2 || iteration >= maxIterations * 3) {
        clearInterval(interval);
        setDisplayText(text);
        setIsScrambling(false);
        hasAnimatedRef.current = true;
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, maxIterations, animateOn, isProfessional]);

  const handleMouseEnter = () => {
    if (isProfessional || animateOn !== "hover" || isScrambling) return;
    let iteration = 0;
    setIsScrambling(true);

    const interval = setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((char, index) => {
            if (char === " ") return " ";
            if (index < iteration / 2) return text[index];
            return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
          })
          .join("")
      );

      iteration += 1;

      if (iteration >= text.length * 2) {
        clearInterval(interval);
        setDisplayText(text);
        setIsScrambling(false);
      }
    }, speed);
  };

  if (isProfessional) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span
      className={`inline-block ${parentClassName}`}
      onMouseEnter={handleMouseEnter}
    >
      <span className={isScrambling ? encryptedClassName : className}>
        {displayText}
      </span>
    </span>
  );
}
