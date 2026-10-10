"use client";

import React, { useMemo } from "react";
import { NormalizedExecutionEvent } from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Layers, PlusCircle, MinusCircle, Search, ArrowRight } from "lucide-react";

interface CollectionConceptRendererProps {
  event: NormalizedExecutionEvent;
}

export function CollectionConceptRenderer({ event }: CollectionConceptRendererProps) {
  const { symbol, currentValue, previousValue, metadata, heapObjects } = event;

  const { items, activeIndex, opType, capacity } = useMemo(() => {
    const rawItems: string[] = [];
    
    // Look up items in metadata or heapObjects
    if (Array.isArray(metadata?.items)) {
      for (const it of metadata.items) {
        rawItems.push(String(it));
      }
    } else if (metadata?.elements && Array.isArray(metadata.elements)) {
      for (const it of metadata.elements) {
        rawItems.push(String(it));
      }
    } else {
      // Check heapObjects with list prefix e.g. list[0], list[1]
      const prefix = symbol || "list";
      let idx = 0;
      while (heapObjects && heapObjects[`${prefix}[${idx}]`]) {
        const val = heapObjects[`${prefix}[${idx}]`].state?.value;
        rawItems.push(val !== undefined ? String(val) : "null");
        idx++;
      }
      if (rawItems.length === 0 && currentValue) {
        rawItems.push(currentValue);
      }
    }

    const idx = typeof metadata?.index === "number" ? metadata.index : rawItems.length - 1;
    const op = String(metadata?.operation || event.operation || "ADD").toUpperCase();
    const cap = typeof metadata?.capacity === "number" ? metadata.capacity : Math.max(10, rawItems.length);

    return {
      items: rawItems,
      activeIndex: idx,
      opType: op,
      capacity: cap,
    };
  }, [metadata, heapObjects, symbol, currentValue, event.operation]);

  return (
    <Card className="p-4 bg-zinc-900 border-zinc-800 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-semibold text-zinc-200">
            Dynamic Collection Buffer ({symbol || "ArrayList"})
          </span>
          <Badge variant="outline" size="sm" className="font-mono text-[10px] text-violet-400 border-violet-500/30">
            size: {items.length} / cap: {capacity}
          </Badge>
        </div>
        <Badge
          variant={opType.includes("REMOVE") ? "danger" : "neutral"}
          size="sm"
          className="font-mono text-[10px]"
        >
          {opType.includes("REMOVE") ? (
            <MinusCircle className="w-3 h-3 mr-1 inline" />
          ) : opType.includes("GET") ? (
            <Search className="w-3 h-3 mr-1 inline" />
          ) : (
            <PlusCircle className="w-3 h-3 mr-1 inline" />
          )}
          {opType}
        </Badge>
      </div>

      {/* Dynamic Element Buffer Slots */}
      <div className="flex flex-col gap-1.5 p-3 bg-zinc-950/80 rounded-lg border border-zinc-800/80 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          {items.map((item, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                <span
                  className={`text-[10px] font-mono ${
                    isActive ? "text-violet-400 font-bold" : "text-zinc-500"
                  }`}
                >
                  [{idx}]
                </span>
                <div
                  className={`w-12 h-12 rounded-lg border flex items-center justify-center font-mono text-xs transition-all ${
                    isActive
                      ? "bg-violet-500/20 border-violet-400 text-violet-200 font-bold shadow-md shadow-violet-500/20 ring-1 ring-violet-400 scale-105"
                      : "bg-zinc-900/90 border-zinc-800 text-zinc-300"
                  }`}
                >
                  <span className="truncate max-w-[42px] px-0.5">{item}</span>
                </div>
              </div>
            );
          })}

          {/* Reserved Capacity Slots (Ghost Cells) */}
          {Array.from({ length: Math.min(4, Math.max(0, capacity - items.length)) }).map((_, gIdx) => (
            <div key={`ghost-${gIdx}`} className="flex flex-col items-center gap-1 opacity-40">
              <span className="text-[10px] font-mono text-zinc-600">
                [{items.length + gIdx}]
              </span>
              <div className="w-12 h-12 rounded-lg border border-dashed border-zinc-700 bg-zinc-950/50 flex items-center justify-center font-mono text-[10px] text-zinc-600">
                empty
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operation Explanation Footnote */}
      <div className="flex items-center justify-between p-2 rounded bg-zinc-950/60 border border-zinc-800/70 text-xs font-mono">
        <span className="text-zinc-400">
          Collection Op: {symbol || "list"}.{opType.toLowerCase()}({currentValue || ""})
        </span>
        {currentValue !== undefined && (
          <div className="flex items-center gap-2">
            {previousValue && (
              <>
                <span className="text-zinc-500 line-through">{previousValue}</span>
                <ArrowRight className="w-3 h-3 text-zinc-500" />
              </>
            )}
            <span className="text-violet-300 font-semibold">{currentValue}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
