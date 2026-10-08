"use client";

import React from "react";
import { NormalizedExecutionEvent } from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Type, Sparkles } from "lucide-react";

interface StringConceptRendererProps {
  event: NormalizedExecutionEvent;
}

export function StringConceptRenderer({ event }: StringConceptRendererProps) {
  const rawValue = String(event.currentValue ?? event.previousValue ?? "");
  // Clean surrounding quotes if present
  const cleanStr = rawValue.replace(/^["']|["']$/g, "");
  const chars = cleanStr.split("");
  const symbol = event.symbol || "str";

  const activeIndex =
    event.metadata?.charIndex !== undefined
      ? Number(event.metadata.charIndex)
      : event.metadata?.index !== undefined
      ? Number(event.metadata.index)
      : -1;

  return (
    <Card className="p-4 bg-zinc-950 border-zinc-800 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-medium text-zinc-300">
            String Character Sequence Buffer ({symbol})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-500">
            length = {chars.length}
          </span>
          <Badge variant="neutral" size="sm">
            java.lang.String
          </Badge>
        </div>
      </div>

      {/* String Value Representation */}
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-sm text-zinc-100 flex items-center gap-2">
          <span className="text-zinc-500 text-xs font-semibold">Value:</span>
          <span className="text-emerald-300 font-bold">&quot;{cleanStr}&quot;</span>
        </div>

        {/* Character Cell Strip */}
        <div className="flex items-center justify-center gap-1.5 overflow-x-auto max-w-full py-2 px-1">
          {chars.length > 0 ? (
            chars.map((char, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center p-2 rounded-xl border min-w-[42px] transition-all ${
                    isActive
                      ? "bg-emerald-950/60 border-emerald-500 scale-105 ring-2 ring-emerald-500/40"
                      : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <span className="text-[9px] font-mono text-zinc-500 mb-0.5">
                    {idx}
                  </span>
                  <span
                    className={`text-sm font-mono font-bold ${
                      isActive ? "text-emerald-300" : "text-zinc-200"
                    }`}
                  >
                    {char === " " ? "␣" : char}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-xs font-mono text-zinc-500 py-2">
              (Empty String: &quot;&quot;)
            </div>
          )}
        </div>
      </div>

      {/* JVM String Immutability Insight */}
      <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 font-mono flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
        <span>
          Java Strings are immutable in the JVM heap; any modification instantiates a new string object in memory.
        </span>
      </div>
    </Card>
  );
}
