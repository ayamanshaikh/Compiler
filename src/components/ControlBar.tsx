"use client";

import {
  Play,
  Loader2,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import { useRef } from "react";
import { animate } from "animejs";
import { CompilationStatus } from "@/lib/types";

interface ControlBarProps {
  status: CompilationStatus;
  canVisualize: boolean;
  isVisualizing: boolean;
  onRun: () => void;
  onVisualize: () => void;
  onReset: () => void;
  onStopVisualize: () => void;
}

/**
 * A button with a small bounce micro-interaction. The ref is only touched
 * inside the click handler (never during render), which keeps it compliant
 * with React 19's rules-of-hooks lint checks.
 */
function PressButton({
  onPress,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  onPress: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (ref.current) {
      animate(ref.current, {
        scale: [1, 0.93, 1.04, 1],
        duration: 350,
        ease: "outElastic(1, 0.5)",
      });
    }
    onPress();
  };

  return (
    <button ref={ref} onClick={handleClick} {...rest}>
      {children}
    </button>
  );
}

export default function ControlBar({
  status,
  canVisualize,
  isVisualizing,
  onRun,
  onVisualize,
  onReset,
  onStopVisualize,
}: ControlBarProps) {
  return (
    <div
      className="glass-surface flex items-center justify-between border-t border-white/[0.04] px-5 py-3"
      role="toolbar"
      aria-label="Execution controls"
    >
      <div className="flex items-center gap-2.5">
        {isVisualizing ? (
          <PressButton
            onPress={onStopVisualize}
            className="btn-3d btn-3d-sm"
            style={{
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(244, 63, 94, 0.1) 100%)",
              color: "#fca5a5",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              boxShadow: "0 4px 20px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
            aria-label="Close visualizer"
          >
            <EyeOff size={14} />
            Close Visualizer
          </PressButton>
        ) : (
          <>
            <PressButton
              onPress={onRun}
              disabled={status === "compiling"}
              className={`btn-3d ${
                status === "compiling"
                  ? "btn-3d-primary opacity-70"
                  : status === "success"
                    ? "btn-3d-success"
                    : "btn-3d-primary"
              } btn-3d-sm`}
              aria-label={status === "compiling" ? "Compiling code" : "Run code"}
            >
              {status === "compiling" ? (
                <><Loader2 size={14} className="animate-spin" /> Compiling...</>
              ) : (
                <><Play size={14} /> Run Code</>
              )}
            </PressButton>

            <PressButton
              onPress={onVisualize}
              disabled={!canVisualize}
              className="btn-3d btn-3d-ghost btn-3d-sm"
              aria-label="Visualize execution"
              title={canVisualize ? "Step through execution visually" : "Run code successfully first to enable visualization"}
            >
              <Eye size={14} />
              Visualize
            </PressButton>
          </>
        )}

        <PressButton
          onPress={onReset}
          className="rounded-lg p-2 text-zinc-500 transition-all hover:bg-white/5 hover:text-zinc-300"
          title="Reset code to default"
          aria-label="Reset code"
        >
          <RotateCcw size={14} />
        </PressButton>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-zinc-600">
        <div className="flex items-center gap-1.5 rounded-md bg-white/[0.03] px-2 py-1 ring-1 ring-white/[0.04]">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-400/60" />
          Java
        </div>
        <div className="rounded-md bg-white/[0.03] px-2 py-1 ring-1 ring-white/[0.04]">
          UTF-8
        </div>
      </div>
    </div>
  );
}