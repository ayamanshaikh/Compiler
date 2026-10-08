"use client";

import React from "react";
import { NormalizedExecutionEvent } from "@/lib/api/types";
import { RotateCw, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface LoopConceptRendererProps {
  event: NormalizedExecutionEvent;
}

export function LoopConceptRenderer({ event }: LoopConceptRendererProps) {
  const iterationStr =
    (event.metadata?.iteration as string) ||
    event.description.match(/iteration\s*(\d+)/i)?.[1] ||
    "1";

  // Discover likely loop variable from scope (single-letter names like i, j, k, or idx)
  const loopVarEntry = Object.entries(event.variables).find(
    ([name]) => /^[ijk]$|^idx$|^count$/i.test(name)
  );

  return (
    <div className="flex flex-col gap-3 p-3.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RotateCw className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-zinc-300 font-mono">
            Loop Execution Cycle
          </span>
        </div>
        <Badge variant="success" size="sm">
          Iteration #{iterationStr}
        </Badge>
      </div>

      {/* Cycle Indicator Steps */}
      <div className="grid grid-cols-4 gap-1.5 p-2 rounded-md bg-zinc-900/90 border border-zinc-800 text-[10px] font-mono text-center">
        <div className="p-1.5 rounded bg-zinc-800/50 border border-zinc-700/60 text-zinc-400">
          1. Init
        </div>
        <div className="p-1.5 rounded bg-zinc-800/50 border border-zinc-700/60 text-zinc-400">
          2. Check
        </div>
        <div className="p-1.5 rounded bg-accent/20 border border-accent/50 text-accent font-bold">
          3. Body
        </div>
        <div className="p-1.5 rounded bg-zinc-800/50 border border-zinc-700/60 text-zinc-400">
          4. Update ↺
        </div>
      </div>

      {/* Loop Variable Snapshot */}
      {loopVarEntry && (
        <div className="flex items-center justify-between px-3 py-2 rounded bg-zinc-900 border border-zinc-800 font-mono text-xs">
          <span className="text-zinc-400">Loop Counter:</span>
          <span className="text-accent font-bold">
            {loopVarEntry[0]} = {loopVarEntry[1].value}
          </span>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>Executing loop body statements for pass #{iterationStr}.</span>
      </div>
    </div>
  );
}
