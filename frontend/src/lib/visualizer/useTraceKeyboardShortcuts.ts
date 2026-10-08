"use client";

import { useEffect } from "react";

export interface TraceKeyboardHandlers {
  onTogglePlay: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onFirstStep: () => void;
  onLastStep: () => void;
  onNextKeyframe: () => void;
  onPrevKeyframe: () => void;
  onToggleViewMode: () => void;
  onToggleHelp: () => void;
  onToggleBookmark?: () => void;
}

export function useTraceKeyboardShortcuts(
  handlers: TraceKeyboardHandlers,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when the user is typing into an input, textarea, or contentEditable element
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          handlers.onTogglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          handlers.onStepForward();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlers.onStepBackward();
          break;
        case "Home":
          e.preventDefault();
          handlers.onFirstStep();
          break;
        case "End":
          e.preventDefault();
          handlers.onLastStep();
          break;
        case "BracketRight":
        case "PageDown":
          e.preventDefault();
          handlers.onNextKeyframe();
          break;
        case "BracketLeft":
        case "PageUp":
          e.preventDefault();
          handlers.onPrevKeyframe();
          break;
        case "KeyV":
          e.preventDefault();
          handlers.onToggleViewMode();
          break;
        case "KeyB":
          e.preventDefault();
          handlers.onToggleBookmark?.();
          break;
        case "Slash":
          if (e.shiftKey) {
            e.preventDefault();
            handlers.onToggleHelp();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handlers, enabled]);
}
