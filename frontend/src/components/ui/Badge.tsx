import React from "react";

export type BadgeVariant =
  | "default"
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
  default: {
    container: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    dot: "bg-blue-400",
  },
  neutral: {
    container: "bg-zinc-800/80 text-zinc-300 border-zinc-700/60",
    dot: "bg-zinc-400",
  },
  success: {
    container: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  warning: {
    container: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    dot: "bg-amber-400",
  },
  danger: {
    container: "bg-red-500/10 text-red-400 border-red-500/30",
    dot: "bg-red-400",
  },
  outline: {
    container: "bg-transparent text-zinc-400 border-zinc-800",
    dot: "bg-zinc-500",
  },
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className = "",
  ...props
}: BadgeProps) {
  const styles = variantStyles[variant];
  const sizeClass =
    size === "sm"
      ? "text-[11px] px-2 py-0.5 gap-1.5 font-medium tracking-tight"
      : "text-xs px-2.5 py-1 gap-1.5 font-medium";

  return (
    <span
      className={`inline-flex items-center rounded-full border ${styles.container} ${sizeClass} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
}
