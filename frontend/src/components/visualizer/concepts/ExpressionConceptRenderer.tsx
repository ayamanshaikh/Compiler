"use client";

import React from "react";
import { NormalizedExecutionEvent } from "@/lib/api/types";
import { Calculator, ArrowRight, Sparkles, Binary } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface ExpressionConceptRendererProps {
  event: NormalizedExecutionEvent;
}

export function ExpressionConceptRenderer({ event }: ExpressionConceptRendererProps) {
  const symbol = event.symbol || "result";
  const curr = event.currentValue ?? "";
  const prev = event.previousValue;

  // Derive expression formula from metadata or description
  const exprString =
    (event.metadata?.expression as string) ||
    (event.metadata?.operation as string) ||
    event.description.match(/(?:evaluating|computed|assigned)\s+(.+?)(?:\s*=|->|\(|$)/i)?.[1] ||
    (prev ? `${prev} -> ${curr}` : `${symbol} = ${curr}`);

  // Find operand variables in scope that might be part of the expression
  const operands: Array<{ name: string; value: string }> = [];
  if (event.variables) {
    Object.entries(event.variables).forEach(([name, snap]) => {
      if (name !== symbol && exprString.includes(name)) {
        operands.push({ name, value: snap.value });
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 p-3.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-accent" />
          <span className="text-xs font-semibold text-zinc-300 font-mono">
            Expression Evaluation Flow
          </span>
        </div>
        <Badge variant="default" size="sm">
          Computation Step
        </Badge>
      </div>

      {/* Input -> Operation -> Result Pipeline */}
      <div className="flex flex-col gap-2.5 p-3 rounded-md bg-zinc-900/90 border border-zinc-800">
        <div className="flex items-center justify-between text-[10px] text-zinc-400 uppercase tracking-wider font-mono">
          <span>1. Operands</span>
          <span>2. Operation</span>
          <span>3. Evaluated Result</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/80">
          {/* Operands Box */}
          <div className="flex flex-col gap-1 min-w-[70px]">
            {operands.length > 0 ? (
              operands.map((op) => (
                <div
                  key={op.name}
                  className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700 text-xs font-mono text-zinc-300 flex items-center justify-between gap-1"
                >
                  <span className="text-zinc-400">{op.name}:</span>
                  <span className="text-accent font-semibold">{op.value}</span>
                </div>
              ))
            ) : prev !== undefined && prev !== null ? (
              <div className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700 text-xs font-mono text-zinc-400 flex items-center gap-1">
                <span>prior:</span>
                <span className="text-zinc-300 font-semibold">{prev}</span>
              </div>
            ) : (
              <span className="text-xs font-mono text-zinc-500 italic">inputs</span>
            )}
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />

          {/* Operation Box */}
          <div className="flex flex-col items-center">
            <div className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 font-mono text-xs text-blue-300 font-semibold flex items-center gap-1.5">
              <Binary className="w-3 h-3 text-blue-400" />
              <span>{exprString}</span>
            </div>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-accent shrink-0 animate-pulse" />

          {/* Result Box */}
          <div className="flex flex-col items-end">
            <div className="px-3 py-1 rounded bg-accent/20 border border-accent/40 font-mono text-xs text-accent font-bold shadow-xs">
              {symbol} = {curr}
            </div>
          </div>
        </div>
      </div>

      {/* Semantic Summary Note */}
      <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
        <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
        <span>
          Evaluated expression yielding result {curr} assigned into &apos;{symbol}&apos;.
        </span>
      </div>
    </div>
  );
}
