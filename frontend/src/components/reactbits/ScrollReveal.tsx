"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/context/ThemeContext";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  threshold?: number;
}

export function ScrollReveal({
  children,
  className = "",
  delayMs = 0,
  threshold = 0.1,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);
  const { resolvedAnimationMode } = useTheme();

  const isProfessional = resolvedAnimationMode === "professional";
  const isActuallyVisible = isProfessional || isVisible;

  useEffect(() => {
    if (isProfessional) {
      return;
    }

    const currentRef = domRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [threshold, isProfessional]);

  if (isProfessional) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={domRef}
      className={`transition-all duration-700 ease-out ${
        isActuallyVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-6 pointer-events-none"
      } ${className}`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}
