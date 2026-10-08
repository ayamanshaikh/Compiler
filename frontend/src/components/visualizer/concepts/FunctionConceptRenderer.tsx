"use client";

import React from "react";
import { NormalizedExecutionEvent } from "@/lib/api/types";
import { Layers, ArrowDown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface FunctionConceptRendererProps {
  event: NormalizedExecutionEvent;
}

export function FunctionConceptRenderer({ event }: FunctionConceptRendererProps) {
  const frames = event.callStack || [];
  const topFrame = frames[0];
  const depth = frames.length;

  return (
    <div className="flex flex-col gap-3 p-3.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-zinc-300 font-mono">
            Call Stack Hierarchy
          </span>
        </div>
        <Badge variant="default" size="sm">
          Depth: {depth} {depth === 1 ? "Frame" : "Frames"}
        </Badge>
      </div>

      {/* Stack Frames (Top of stack rendered topmost) */}
      <div className="flex flex-col gap-1.5 p-2 rounded-md bg-zinc-900/90 border border-zinc-800 font-mono text-xs">
        {frames.map((frame, idx) => {
          const isTop = idx === 0;
          return (
            <React.Fragment key={idx}>
              <div
                className={`flex items-center justify-between p-2 rounded border transition-all ${
                  isTop
                    ? "bg-purple-950/40 border-purple-500/50 text-purple-200 font-semibold shadow-sm"
                    : "bg-zinc-900/60 border-zinc-800 text-zinc-400 opacity-75"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] ${isTop ? "text-purple-400" : "text-zinc-600"}`}>
                    #{depth - idx}
                  </span>
                  <span>{frame.methodName}</span>
                </div>
                {isTop && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    Active
                  </span>
                )}
              </div>
              {idx < frames.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <ArrowDown className="w-3 h-3 text-zinc-600" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Frame context */}
      <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
        <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
        <span>
          Executing inside frame <span className="text-zinc-200 font-semibold">{topFrame?.methodName || "main"}</span>.
        </span>
      </div>
    </div>
  );
}
