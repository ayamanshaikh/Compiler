import React from "react";

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  narrow?: boolean;
  fullWidth?: boolean;
}

export function PageContainer({
  children,
  className = "",
  narrow = false,
  fullWidth = false,
  ...props
}: PageContainerProps) {
  const maxWidth = fullWidth
    ? "w-full"
    : narrow
    ? "max-w-4xl"
    : "max-w-7xl";

  return (
    <main
      className={`mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 ${maxWidth} ${className}`}
      {...props}
    >
      {children}
    </main>
  );
}
