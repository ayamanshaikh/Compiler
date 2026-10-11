"use client";

import React, { useMemo } from "react";
import { TraceStep } from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Gauge } from "lucide-react";

interface ComplexityEstimatorCardProps {
  steps: TraceStep[];
  sourceCode: string;
}

export interface ComplexityMetrics {
  totalSteps: number;
  uniqueLinesExecuted: number;
  maxStackDepth: number;
  loopIterationsCount: number;
  estimatedComplexity: string;
  rationale: string;
}

export function estimateTraceComplexity(
  steps: TraceStep[],
  sourceCode: string
): ComplexityMetrics {
  const totalSteps = steps.length;
  const uniqueLines = new Set<number>();
  let maxStack = 1;
  let loopCount = 0;

  for (const step of steps) {
    if (step.line) uniqueLines.add(step.line);
    if (step.callStack && step.callStack.length > maxStack) {
      maxStack = step.callStack.length;
    }
    if (step.eventType === "LOOP_ITERATION" || step.operation === "LOOP_ITER") {
      loopCount++;
    }
  }

  // Detect syntactic loop nesting
  const loopMatches = sourceCode.match(/\b(for|while)\b/g);
  const loopKeywordCount = loopMatches ? loopMatches.length : 0;

  let estimatedComplexity = "O(1)";
  let rationale = "Program executes in constant time with sequential instructions.";

  if (maxStack > 2) {
    estimatedComplexity = maxStack > 5 ? "O(2^n) or O(n)" : "O(log n)";
    rationale = `Recursive call stack detected reaching depth ${maxStack}.`;
  } else if (loopKeywordCount >= 2 && loopCount > 10) {
    estimatedComplexity = "O(n²)";
    rationale = `Nested loop execution detected with ${loopCount} total loop iterations.`;
  } else if (loopCount > 0 || loopKeywordCount >= 1) {
    estimatedComplexity = "O(n)";
    rationale = `Linear iteration detected across ${loopCount} execution loop passes.`;
  }

  return {
    totalSteps,
    uniqueLinesExecuted: uniqueLines.size,
    maxStackDepth: maxStack,
    loopIterationsCount: loopCount,
    estimatedComplexity,
    rationale,
  };
}

export function ComplexityEstimatorCard({
  steps,
  sourceCode,
}: ComplexityEstimatorCardProps) {
  const metrics = useMemo(
    () => estimateTraceComplexity(steps, sourceCode),
    [steps, sourceCode]
  );

  return (
    <Card className="p-3 bg-zinc-900 border-zinc-800 flex flex-col gap-2.5">
      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
        <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-semibold">
          <Gauge className="w-3.5 h-3.5 text-emerald-400" />
          <span>Asymptotic Execution Profile</span>
        </div>
        <Badge
          variant="outline"
          size="sm"
          className="font-mono text-[10px] text-emerald-400 border-emerald-500/30 font-bold"
        >
          {metrics.estimatedComplexity}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
        <div className="p-1.5 rounded bg-zinc-950/70 border border-zinc-800/80 flex flex-col">
          <span className="text-[10px] text-zinc-500">Steps</span>
          <span className="text-xs font-bold text-zinc-200">{metrics.totalSteps}</span>
        </div>
        <div className="p-1.5 rounded bg-zinc-950/70 border border-zinc-800/80 flex flex-col">
          <span className="text-[10px] text-zinc-500">Stack Depth</span>
          <span className="text-xs font-bold text-zinc-200">{metrics.maxStackDepth}</span>
        </div>
        <div className="p-1.5 rounded bg-zinc-950/70 border border-zinc-800/80 flex flex-col">
          <span className="text-[10px] text-zinc-500">Loop Passes</span>
          <span className="text-xs font-bold text-zinc-200">{metrics.loopIterationsCount}</span>
        </div>
      </div>

      <p className="text-[11px] text-zinc-400 font-mono leading-relaxed bg-zinc-950/40 p-2 rounded border border-zinc-800/50">
        {metrics.rationale}
      </p>
    </Card>
  );
}
