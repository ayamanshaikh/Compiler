"use client";

import React from "react";
import { NormalizedExecutionEvent } from "@/lib/api/types";
import { ArrowRight, Sparkles, Variable as VariableIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface VariableConceptRendererProps {
  event: NormalizedExecutionEvent;
}

export function VariableConceptRenderer({ event }: VariableConceptRendererProps) {
  const symbol = event.symbol || "variable";
  const curr = event.currentValue ?? "undefined";
  const prev = event.previousValue;
  const isMutation = Boolean(prev !== undefined && prev !== null && prev !== curr);
  const typeStr = (event.metadata?.type as string) || event.variables[symbol]?.type || "var";

  return (
    <div className="flex flex-col gap-3 p-3.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <VariableIcon className="w-4 h-4 text-accent" />
          <span className="text-xs font-semibold text-zinc-300 font-mono">
            {typeStr} <span className="text-zinc-100">{symbol}</span>
          </span>
        </div>
        <Badge variant={isMutation ? "default" : "success"} size="sm">
          {isMutation ? "Value Mutated" : "Declared & Initialized"}
        </Badge>
      </div>

      {/* Visual Transition Box */}
      <div className="flex items-center justify-center gap-3 py-3 px-4 rounded-md bg-zinc-900/90 border border-zinc-800">
        {isMutation && prev !== undefined && (
          <>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 font-mono">
                Previous
              </span>
              <div className="px-3 py-1.5 rounded bg-zinc-800/80 border border-zinc-700 font-mono text-xs text-zinc-400 line-through">
                {prev}
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-accent animate-pulse mt-3" />
          </>
        )}

        <div className="flex flex-col items-center">
          <span className="text-[10px] text-accent uppercase tracking-wider mb-1 font-mono font-semibold">
            {isMutation ? "New Value" : "Value"}
          </span>
          <div className="px-4 py-1.5 rounded bg-accent/15 border border-accent/40 font-mono text-sm font-bold text-accent shadow-sm">
            {curr}
          </div>
        </div>
      </div>

      {/* Operation Explanation Text */}
      <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
        <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
        <span>
          {isMutation
            ? `Assigned '${symbol}' = ${curr} (overwrote ${prev})`
            : `Allocated '${symbol}' with initial value ${curr}`}
        </span>
      </div>
    </div>
  );
}
