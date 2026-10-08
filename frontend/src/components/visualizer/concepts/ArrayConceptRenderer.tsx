"use client";

import React from "react";
import { NormalizedExecutionEvent } from "@/lib/api/types";
import { Layers, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface ArrayConceptRendererProps {
  event: NormalizedExecutionEvent;
}

interface ArrayCell {
  index: number;
  value: string;
  isTarget: boolean;
}

export function ArrayConceptRenderer({ event }: ArrayConceptRendererProps) {
  const arraySymbol = event.symbol?.replace(/\[\d+\]/, "") || "array";
  const targetIndex = event.metadata?.index !== undefined
    ? Number(event.metadata.index)
    : undefined;

  // Extract all cells for this array from heapObjects
  const cells: ArrayCell[] = [];
  const heap = event.heapObjects || {};

  Object.entries(heap).forEach(([key, obj]) => {
    const match = key.match(/^(.+)\[(\d+)\]$/);
    if (match) {
      const idx = Number(match[2]);
      const val = String(obj.state?.value ?? "");
      const isTarget = targetIndex !== undefined ? idx === targetIndex : key === event.symbol;
      cells.push({ index: idx, value: val, isTarget });
    }
  });

  // Sort cells by index
  cells.sort((a, b) => a.index - b.index);

  return (
    <div className="flex flex-col gap-3 p-3.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-zinc-300 font-mono">
            Array <span className="text-zinc-100">{arraySymbol}[]</span>
          </span>
        </div>
        <Badge variant="default" size="sm">
          {event.conceptType === "ARRAY_MUTATION" ? "Cell Mutated" : "Array Access"}
        </Badge>
      </div>

      {/* Array Index & Value Grid */}
      {cells.length > 0 ? (
        <div className="flex items-center gap-2 overflow-x-auto py-2 px-1">
          {cells.map((cell) => (
            <div
              key={cell.index}
              className={`flex flex-col items-center min-w-[56px] transition-all ${
                cell.isTarget
                  ? "scale-105"
                  : "opacity-85"
              }`}
            >
              {/* Index label */}
              <span className={`text-[10px] font-mono mb-1 ${
                cell.isTarget ? "text-accent font-bold" : "text-zinc-500"
              }`}>
                [{cell.index}]
              </span>

              {/* Value Box */}
              <div
                className={`w-full py-2 px-3 rounded font-mono text-center text-xs font-semibold border transition-all ${
                  cell.isTarget
                    ? "bg-accent/20 border-accent text-accent ring-2 ring-accent/30 shadow-md font-bold"
                    : "bg-zinc-900 border-zinc-800 text-zinc-200"
                }`}
              >
                {cell.value}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-zinc-400 italic py-2">
          Array allocated with length {event.currentValue || 0}
        </div>
      )}

      {/* Explanatory note */}
      <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
        <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span>
          {targetIndex !== undefined
            ? `Updated element ${arraySymbol}[${targetIndex}] to '${event.currentValue}'`
            : event.description}
        </span>
      </div>
    </div>
  );
}
