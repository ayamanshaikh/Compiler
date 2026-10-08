"use client";

import React from "react";
import { NormalizedExecutionEvent } from "@/lib/api/types";
import { Box, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface ObjectConceptRendererProps {
  event: NormalizedExecutionEvent;
}

export function ObjectConceptRenderer({ event }: ObjectConceptRendererProps) {
  const symbol = event.symbol || "objectRef";
  const typeStr =
    (event.metadata?.type as string) ||
    (event.metadata?.className as string) ||
    event.variables[symbol]?.type ||
    "Object";

  // Discover matching heap object from event.heapObjects
  const heapKey =
    Object.keys(event.heapObjects || {}).find((k) => k === symbol || k === event.currentValue) ||
    Object.keys(event.heapObjects || {})[0];
  const heapObj = heapKey ? event.heapObjects[heapKey] : undefined;

  const fields = heapObj?.state ? Object.entries(heapObj.state) : [];

  return (
    <div className="flex flex-col gap-3 p-3.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-zinc-300 font-mono">
            Object Instantiation & Reference: <span className="text-zinc-100">{typeStr}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="success" size="sm">
            Heap Allocation
          </Badge>
          <span className="text-[10px] text-zinc-500 font-mono" title="Conceptual representation of JVM heap memory">
            Conceptual Ref
          </span>
        </div>
      </div>

      {/* Instantiation -> Constructor -> Reference Flow */}
      <div className="flex flex-col gap-2.5 p-3 rounded-md bg-zinc-900/90 border border-zinc-800">
        <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase tracking-wider font-mono">
          <span>1. Reference Variable</span>
          <span>2. Binding</span>
          <span>3. Heap Instance</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-zinc-800/80">
          {/* Reference Variable on Stack */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-zinc-400 font-mono mb-1">Stack Pointer</span>
            <div className="px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-xs font-bold text-zinc-200 shadow-xs">
              {symbol}
            </div>
          </div>

          {/* Reference Pointer Arrow */}
          <div className="flex flex-col items-center flex-1 max-w-[90px]">
            <span className="text-[9px] text-emerald-400 font-mono">points to</span>
            <ArrowRight className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>

          {/* Object Instance on Heap */}
          <div className="flex flex-col items-start p-2.5 rounded-lg bg-zinc-950 border border-emerald-500/30 font-mono text-xs shadow-xs min-w-[130px]">
            <div className="flex items-center justify-between w-full pb-1 mb-1.5 border-b border-zinc-800">
              <span className="text-emerald-400 font-bold">[{typeStr}]</span>
              <span className="text-[10px] text-zinc-500">{heapObj?.id || "@heap"}</span>
            </div>

            {fields.length > 0 ? (
              <div className="flex flex-col gap-1 w-full">
                {fields.map(([fieldName, val]) => (
                  <div key={fieldName} className="flex items-center justify-between text-[11px] text-zinc-300">
                    <span className="text-zinc-400">{fieldName}:</span>
                    <span className="text-accent font-semibold">{String(val)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-zinc-400 italic">
                {event.description || "Instance allocated on heap"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimed Memory Notice */}
      <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>
          Reference &apos;{symbol}&apos; bound to new {typeStr} instance on garbage-collected heap.
        </span>
      </div>
      <div className="text-[10px] text-zinc-500 italic font-mono flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3 text-zinc-500" />
        <span>Conceptual heap memory layout; physical JVM address is managed transparently.</span>
      </div>
    </div>
  );
}
