"use client";

import React, { useMemo } from "react";
import { NormalizedExecutionEvent } from "@/lib/api/types";

interface TraceAriaLiveAnnouncerProps {
  currentStepIndex: number;
  totalSteps: number;
  event: NormalizedExecutionEvent | null;
}

/**
 * Formats a clear, concise natural language announcement for assistive tech.
 */
export function formatAriaStepAnnouncement(
  stepIndex: number,
  totalSteps: number,
  event: NormalizedExecutionEvent | null
): string {
  if (!event || totalSteps === 0) {
    return "Execution trace idle. No steps loaded.";
  }

  const prefix = `Step ${stepIndex + 1} of ${totalSteps}. Line ${event.sourceLine}. `;
  let body = "";

  switch (event.conceptType) {
    case "VARIABLE_DECLARATION":
      body = `Variable ${event.symbol || "unknown"} declared with value ${event.currentValue ?? "uninitialized"}.`;
      break;
    case "VARIABLE_ASSIGNMENT":
      body = `Variable ${event.symbol || "unknown"} updated from ${event.previousValue ?? "previous"} to ${event.currentValue}.`;
      break;
    case "CONDITION_CHECK": {
      const cond = event.metadata?.condition ? `Condition ${event.metadata.condition} ` : "Condition ";
      const res = event.currentValue === "true" || event.metadata?.result === "true" ? "evaluated to true" : "evaluated to false";
      body = `${cond}${res}.`;
      break;
    }
    case "LOOP_START":
      body = `Loop started at line ${event.sourceLine}.`;
      break;
    case "LOOP_ITERATION":
      body = `Loop iteration ${event.metadata?.iteration ?? "in progress"}. Variables: ${Object.entries(event.variables).map(([k, v]) => `${k} equals ${v}`).join(", ")}.`;
      break;
    case "LOOP_END":
      body = `Loop finished execution.`;
      break;
    case "ARRAY_ACCESS":
    case "ARRAY_MUTATION":
      body = `Array ${event.symbol || "elements"} at index ${event.metadata?.index ?? "selected"} updated to ${event.currentValue ?? "value"}.`;
      break;
    case "FUNCTION_CALL":
      body = `Calling function ${event.symbol || "method"}.`;
      break;
    case "RETURN":
      body = `Function returned value ${event.currentValue ?? "void"}.`;
      break;
    case "OUTPUT":
      body = `Program output generated: ${event.metadata?.output ?? event.currentValue ?? ""}.`;
      break;
    case "EXCEPTION":
      body = `Exception thrown: ${event.currentValue ?? "runtime error"}.`;
      break;
    default:
      body = `Executing line ${event.sourceLine}. ${event.description}`;
      break;
  }

  return `${prefix}${body}`;
}

export function TraceAriaLiveAnnouncer({
  currentStepIndex,
  totalSteps,
  event,
}: TraceAriaLiveAnnouncerProps) {
  const message = useMemo(() => {
    return formatAriaStepAnnouncement(currentStepIndex, totalSteps, event);
  }, [currentStepIndex, totalSteps, event]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
