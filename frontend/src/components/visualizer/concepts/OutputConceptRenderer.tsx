"use client";

import React from "react";
import { NormalizedExecutionEvent } from "@/lib/api/types";
import { Terminal, CornerDownLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface OutputConceptRendererProps {
  event: NormalizedExecutionEvent;
}

export function OutputConceptRenderer({ event }: OutputConceptRendererProps) {
  const currentPrint = event.currentValue || "(newline)";

  return (
    <div className="flex flex-col gap-3 p-3.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-zinc-300 font-mono">
            Standard Output Stream
          </span>
        </div>
        <Badge variant="warning" size="sm">
          Console Print
        </Badge>
      </div>

      {/* Emitted text box */}
      <div className="flex flex-col gap-1.5 p-3 rounded-md bg-black/80 border border-zinc-800 font-mono text-xs">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
          Emitted String:
        </span>
        <div className="flex items-center gap-2 text-amber-300 font-bold text-sm bg-amber-500/10 p-2 rounded border border-amber-500/20">
          <CornerDownLeft className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{currentPrint}</span>
        </div>
      </div>

      <div className="text-[11px] text-zinc-400 font-mono">
        Written to standard output buffer at line {event.sourceLine}.
      </div>
    </div>
  );
}
