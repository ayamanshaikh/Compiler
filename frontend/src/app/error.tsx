"use client";

import React, { useEffect } from "react";
import { ErrorState } from "@/components/ui/ErrorState";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to client diagnostic log if needed
    console.error("CodeVista frontend runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <ErrorState
        title="Application Error"
        message={error.message || "An unexpected error occurred while rendering this page."}
        onRetry={() => reset()}
      />
    </div>
  );
}
