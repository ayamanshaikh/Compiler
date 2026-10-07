import React from "react";
import { Loader2 } from "lucide-react";

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  className = "",
}: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 min-h-[220px] text-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-3" />
      <p className="text-xs font-mono text-zinc-400 tracking-wide uppercase">
        {message}
      </p>
    </div>
  );
}

export function Skeleton({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-zinc-800/60 ${className}`}
      {...props}
    />
  );
}
