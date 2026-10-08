"use client";

import React from "react";
import { NormalizedExecutionEvent } from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeftRight, Search, BarChart2 } from "lucide-react";

interface ArrayOperationRendererProps {
  event: NormalizedExecutionEvent;
}

export function ArrayOperationRenderer({ event }: ArrayOperationRendererProps) {
  // Extract array entries from heap
  const arrayEntries: Array<{ index: number; value: string }> = [];
  const symbol = event.symbol || "array";

  Object.entries(event.heapObjects || {}).forEach(([key, obj]) => {
    const match = key.match(/\[(\d+)\]/);
    if (match) {
      const idx = parseInt(match[1], 10);
      const val = (obj.state && typeof obj.state === "object" && "value" in obj.state)
        ? String(obj.state.value)
        : String(event.currentValue ?? "?");
      arrayEntries.push({ index: idx, value: val });
    }
  });

  arrayEntries.sort((a, b) => a.index - b.index);

  // If heap didn't have entries, render fallback sample strip
  const displayItems =
    arrayEntries.length > 0
      ? arrayEntries
      : [
          { index: 0, value: "10" },
          { index: 1, value: "20" },
          { index: 2, value: "30" },
          { index: 3, value: "40" },
        ];

  const opType =
    event.conceptType === "SWAP" || event.metadata?.isSwap
      ? "SWAP"
      : event.conceptType === "SEARCH_STEP" || event.metadata?.searchTarget !== undefined
      ? "SEARCH"
      : "SORT";

  const targetIdx = Number(event.metadata?.index ?? 0);
  const swapWithIdx = Number(event.metadata?.swapWithIndex ?? (targetIdx + 1));
  const searchTarget = String(event.metadata?.searchTarget ?? "");
  const searchRangeLow = Number(event.metadata?.low ?? 0);
  const searchRangeHigh = Number(event.metadata?.high ?? (displayItems.length - 1));

  return (
    <Card className="p-4 bg-zinc-950 border-zinc-800 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          {opType === "SWAP" ? (
            <ArrowLeftRight className="w-4 h-4 text-amber-400" />
          ) : opType === "SEARCH" ? (
            <Search className="w-4 h-4 text-cyan-400" />
          ) : (
            <BarChart2 className="w-4 h-4 text-emerald-400" />
          )}
          <span className="text-xs font-mono font-medium text-zinc-300">
            {opType === "SWAP"
              ? `Array Element Swap (${symbol})`
              : opType === "SEARCH"
              ? `Array Binary Search Range (${symbol})`
              : `Array Partition & Sort Step (${symbol})`}
          </span>
        </div>
        <Badge
          variant={opType === "SWAP" ? "default" : opType === "SEARCH" ? "neutral" : "success"}
          size="sm"
        >
          {opType}
        </Badge>
      </div>

      {/* Target Info Bar for Search */}
      {opType === "SEARCH" && searchTarget && (
        <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono">
          <span className="text-zinc-400">Search Target:</span>
          <span className="text-cyan-300 font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800">
            {searchTarget}
          </span>
        </div>
      )}

      {/* Array Elements Horizontal Visualization */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto py-3">
        {displayItems.map((item) => {
          const isSwapTarget = opType === "SWAP" && (item.index === targetIdx || item.index === swapWithIdx);
          const inSearchRange = opType === "SEARCH" && item.index >= searchRangeLow && item.index <= searchRangeHigh;
          const isMidPoint = opType === "SEARCH" && item.index === targetIdx;

          return (
            <div
              key={item.index}
              className={`flex flex-col items-center p-2.5 rounded-xl border min-w-[56px] transition-all ${
                isSwapTarget
                  ? "bg-amber-950/40 border-amber-500 scale-105 shadow-md shadow-amber-950/20"
                  : isMidPoint
                  ? "bg-cyan-950/50 border-cyan-400 scale-105 ring-2 ring-cyan-500/50"
                  : inSearchRange
                  ? "bg-zinc-900 border-zinc-700"
                  : "bg-zinc-950 border-zinc-900 opacity-40"
              }`}
            >
              <span className="text-[10px] font-mono text-zinc-500 mb-1">
                [{item.index}]
              </span>
              <span
                className={`text-sm font-mono font-bold ${
                  isSwapTarget
                    ? "text-amber-300"
                    : isMidPoint
                    ? "text-cyan-300"
                    : inSearchRange
                    ? "text-zinc-200"
                    : "text-zinc-500"
                }`}
              >
                {item.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 font-mono">
        {opType === "SWAP" ? (
          <span>
            Exchanging positions: index <span className="text-amber-400 font-semibold">{targetIdx}</span> ↔ index <span className="text-amber-400 font-semibold">{swapWithIdx}</span>
          </span>
        ) : opType === "SEARCH" ? (
          <span>
            Active range: [<span className="text-cyan-400">{searchRangeLow}</span> .. <span className="text-cyan-400">{searchRangeHigh}</span>], inspecting midpoint index <span className="text-cyan-400 font-semibold">{targetIdx}</span>
          </span>
        ) : (
          <span>
            Partition evaluated: sorting iteration completed on array slice
          </span>
        )}
      </div>
    </Card>
  );
}
