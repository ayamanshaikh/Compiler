"use client";

import React, { useMemo } from "react";
import { TraceStep } from "@/lib/api/types";
import {
  analyzeProgramComplexity,
  ComprehensiveComplexityReport,
} from "@/lib/visualizer/complexityAnalyzer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Gauge, TrendingUp, Layers } from "lucide-react";

interface ComplexityEstimatorCardProps {
  steps: TraceStep[];
  sourceCode: string;
  executionDurationMs?: number;
  onOpenFullAnalysis?: () => void;
}

export interface ComplexityMetrics {
  totalSteps: number;
  uniqueLinesExecuted: number;
  maxStackDepth: number;
  loopIterationsCount: number;
  estimatedComplexity: string;
  rationale: string;
}

/**
 * Backward-compatible helper that wraps analyzeProgramComplexity
 */
export function estimateTraceComplexity(
  steps: TraceStep[],
  sourceCode: string
): ComplexityMetrics {
  const report = analyzeProgramComplexity(steps, sourceCode);
  return {
    totalSteps: report.empiricalMetrics.totalSteps,
    uniqueLinesExecuted: report.empiricalMetrics.uniqueLinesExecuted,
    maxStackDepth: report.empiricalMetrics.maxStackDepth,
    loopIterationsCount: report.empiricalMetrics.loopIterationsCount,
    estimatedComplexity: report.timeComplexity.order,
    rationale: report.timeComplexity.rationale,
  };
}

export function ComplexityEstimatorCard({
  steps,
  sourceCode,
  executionDurationMs,
  onOpenFullAnalysis,
}: ComplexityEstimatorCardProps) {
  const report: ComprehensiveComplexityReport = useMemo(
    () => analyzeProgramComplexity(steps, sourceCode, executionDurationMs),
    [steps, sourceCode, executionDurationMs]
  );

  const { timeComplexity, spaceComplexity, empiricalMetrics } = report;

  return (
    <Card className="p-3 bg-zinc-900 border-zinc-800 flex flex-col gap-2.5">
      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
        <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-semibold">
          <Gauge className="w-3.5 h-3.5 text-emerald-400" />
          <span>Asymptotic Execution Profile</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            size="sm"
            className="font-mono text-[10px] text-emerald-400 border-emerald-500/30 font-bold"
          >
            {timeComplexity.order}
          </Badge>
          <Badge
            variant="outline"
            size="sm"
            className="font-mono text-[10px] text-sky-400 border-sky-500/30 font-bold"
          >
            Space {spaceComplexity.order}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
        <div className="p-1.5 rounded bg-zinc-950/70 border border-zinc-800/80 flex flex-col">
          <span className="text-[10px] text-zinc-500">Steps</span>
          <span className="text-xs font-bold text-zinc-200">
            {empiricalMetrics.totalSteps}
          </span>
        </div>
        <div className="p-1.5 rounded bg-zinc-950/70 border border-zinc-800/80 flex flex-col">
          <span className="text-[10px] text-zinc-500">Stack Depth</span>
          <span className="text-xs font-bold text-zinc-200">
            {empiricalMetrics.maxStackDepth}
          </span>
        </div>
        <div className="p-1.5 rounded bg-zinc-950/70 border border-zinc-800/80 flex flex-col">
          <span className="text-[10px] text-zinc-500">Loop Passes</span>
          <span className="text-xs font-bold text-zinc-200">
            {empiricalMetrics.loopIterationsCount}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-zinc-400 font-mono leading-relaxed bg-zinc-950/40 p-2 rounded border border-zinc-800/50">
        {timeComplexity.rationale}
      </p>

      {/* Auxiliary Space & Bounds Mini Banner */}
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 px-1">
        <span className="flex items-center gap-1">
          <Layers className="w-3 h-3 text-sky-400" />
          <span>Auxiliary: {spaceComplexity.auxiliaryOrder}</span>
        </span>
        <span>
          Ω({timeComplexity.bounds.bestCase.replace("Ω(", "").replace(")", "")}) / Θ(
          {timeComplexity.bounds.averageCase.replace("Θ(", "").replace(")", "")})
        </span>
      </div>

      {onOpenFullAnalysis && (
        <button
          type="button"
          onClick={onOpenFullAnalysis}
          className="mt-1 w-full py-1.5 px-2 rounded bg-zinc-800/70 hover:bg-zinc-800 text-[11px] font-medium text-emerald-300 hover:text-emerald-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-zinc-700/60"
        >
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          <span>Inspect Full Bounds & Growth Curves</span>
        </button>
      )}
    </Card>
  );
}
