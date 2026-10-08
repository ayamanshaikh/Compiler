"use client";

import React from "react";
import { NormalizedExecutionEvent } from "@/lib/api/types";
import { Layers, ArrowDown, ArrowUp, Sparkles, CornerDownLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface RecursionConceptRendererProps {
  event: NormalizedExecutionEvent;
}

export function RecursionConceptRenderer({ event }: RecursionConceptRendererProps) {
  const frames = event.callStack || [];
  const topMethod = frames[0]?.methodName || event.symbol || "recursiveFunction";

  // Filter or identify recursive frames of the same function
  const recursiveFrames = frames.filter((f) => f.methodName === topMethod);
  const depth = recursiveFrames.length || 1;

  // Unwinding phase if event is RETURN or METHOD_EXIT
  const isUnwinding =
    event.conceptType === "RETURN" ||
    event.eventType === "METHOD_EXIT" ||
    event.description.toLowerCase().includes("return") ||
    event.currentValue !== undefined && event.conceptType === "METHOD_CALL";

  const returnVal = event.currentValue;

  return (
    <div className="flex flex-col gap-3 p-3.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-zinc-300 font-mono">
            Recursive Call Tree: <span className="text-zinc-100">{topMethod}()</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant={isUnwinding ? "warning" : "default"} size="sm">
            {isUnwinding ? "Stack Unwinding ⤾" : "Stack Growth ⤿"}
          </Badge>
          <Badge variant="neutral" size="sm" className="font-mono">
            Depth {depth}
          </Badge>
        </div>
      </div>

      {/* Recursive Call Ladder */}
      <div className="flex flex-col gap-1 p-2.5 rounded-md bg-zinc-900/90 border border-zinc-800 font-mono text-xs">
        <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>Invocation Stack (Root to Active)</span>
          <span className="text-purple-400 font-semibold">
            {isUnwinding ? "Bubbling Results Up" : "Calling Towards Base Case"}
          </span>
        </div>

        {recursiveFrames.map((frame, idx) => {
          const isTop = idx === 0;
          const frameNum = recursiveFrames.length - idx;
          const localEntries = Object.entries(frame.localVariables || {});

          return (
            <React.Fragment key={idx}>
              <div
                className={`p-2 rounded border flex flex-col gap-1 transition-all ${
                  isTop
                    ? "bg-purple-950/50 border-purple-500/60 text-purple-100 shadow-sm"
                    : "bg-zinc-950/60 border-zinc-800 text-zinc-400 opacity-80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold ${isTop ? "text-purple-300" : "text-zinc-600"}`}>
                      #{frameNum}
                    </span>
                    <span className="font-semibold text-zinc-200">
                      {frame.methodName}(
                      {localEntries.length > 0
                        ? localEntries.map(([k, v]) => `${k}=${v.value}`).join(", ")
                        : ""}
                      )
                    </span>
                  </div>

                  {isTop && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-medium">
                      Active Frame
                    </span>
                  )}
                </div>

                {/* Return value bubble if this frame is returning */}
                {isTop && isUnwinding && returnVal && (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 mt-0.5">
                    <CornerDownLeft className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Returns value: {returnVal}</span>
                  </div>
                )}
              </div>

              {idx < recursiveFrames.length - 1 && (
                <div className="flex justify-center py-0.5">
                  {isUnwinding ? (
                    <ArrowUp className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  ) : (
                    <ArrowDown className="w-3.5 h-3.5 text-purple-400" />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Explanatory summary */}
      <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
        <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
        <span>
          {isUnwinding
            ? `Frame popped off stack; computed result ${returnVal ? `'${returnVal}' ` : ""}propagates to previous caller.`
            : `New frame pushed on stack (depth ${depth}). Advancing toward base case condition.`}
        </span>
      </div>
    </div>
  );
}
