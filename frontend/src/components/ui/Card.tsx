import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({
  className = "",
  interactive = false,
  children,
  ...props
}: CardProps) {
  const interactiveStyles = interactive
    ? "hover:border-zinc-700 hover:bg-zinc-900/80 transition-all duration-150 cursor-pointer"
    : "";

  return (
    <div
      className={`rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-100 backdrop-blur-xs p-5 shadow-xs ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex flex-col space-y-1.5 mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-lg font-semibold tracking-tight text-zinc-100 ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm text-zinc-400 leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`text-sm text-zinc-300 ${className}`} {...props}>{children}</div>;
}

export function CardFooter({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex items-center pt-4 border-t border-zinc-800/80 mt-4 text-xs text-zinc-400 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
