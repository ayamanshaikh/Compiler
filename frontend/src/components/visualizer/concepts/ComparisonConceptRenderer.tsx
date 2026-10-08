"use client";

import React from "react";
import { NormalizedExecutionEvent } from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, XCircle, ArrowRight, GitBranch } from "lucide-react";

interface ComparisonConceptRendererProps {
  event: NormalizedExecutionEvent;
}

export function ComparisonConceptRenderer({ event }: ComparisonConceptRendererProps) {
  const condExpr = String(event.metadata?.condition || event.symbol || "a == b");
  const resultStr = String(event.metadata?.result ?? event.currentValue ?? "true");
  const isTrue = resultStr.toLowerCase() === "true";

  // Parse comparison expression components (e.g. "age >= 18" -> "age", ">=", "18")
  const operatorMatch = condExpr.match(/(>=|<=|==|!=|>|<)/);
  const operator = operatorMatch ? operatorMatch[1] : "==";

  let leftSide = "LHS";
  let rightSide = "RHS";

  if (operatorMatch && operatorMatch.index !== undefined) {
    leftSide = condExpr.substring(0, operatorMatch.index).trim();
    rightSide = condExpr.substring(operatorMatch.index + operator.length).trim();
  }

  // Look up resolved runtime values in variables
  const leftValue = event.variables[leftSide]?.value ?? leftSide;
  const rightValue = event.variables[rightSide]?.value ?? rightSide;

  return (
    <Card className="p-4 bg-zinc-950 border-zinc-800 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-mono font-medium text-zinc-300">
            Relational Comparison Evaluation
          </span>
        </div>
        <Badge variant={isTrue ? "success" : "default"} size="sm">
          {isTrue ? "CONDITION SATISFIED" : "CONDITION NOT MET"}
        </Badge>
      </div>

      {/* Visual Comparison Flow: LHS [val] (op) RHS [val] -> RESULT */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-3 py-3">
        {/* Left Side */}
        <div className="flex flex-col items-center p-3 rounded-xl bg-zinc-900 border border-zinc-800 min-w-[100px]">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
            {leftSide}
          </span>
          <span className="text-sm font-mono font-bold text-zinc-100">
            {leftValue}
          </span>
        </div>

        {/* Operator Badge */}
        <div className="flex flex-col items-center">
          <span className="px-3 py-1.5 rounded-lg bg-blue-950/80 border border-blue-800/80 text-blue-300 font-mono font-bold text-sm shadow-sm">
            {operator}
          </span>
        </div>

        {/* Right Side */}
        <div className="flex flex-col items-center p-3 rounded-xl bg-zinc-900 border border-zinc-800 min-w-[100px]">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
            {rightSide}
          </span>
          <span className="text-sm font-mono font-bold text-zinc-100">
            {rightValue}
          </span>
        </div>

        <ArrowRight className="w-4 h-4 text-zinc-500 hidden md:block shrink-0" />

        {/* Boolean Result Box */}
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-mono font-bold text-sm ${
            isTrue
              ? "bg-emerald-950/50 border-emerald-800 text-emerald-300"
              : "bg-red-950/50 border-red-800 text-red-300"
          }`}
        >
          {isTrue ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{isTrue ? "TRUE" : "FALSE"}</span>
        </div>
      </div>

      {/* Dynamic Branch Decision Description */}
      <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-xs text-zinc-300 font-mono flex items-center justify-between">
        <span className="text-zinc-400">Branch Decision:</span>
        <span className={isTrue ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
          {isTrue
            ? "Enter conditional code block"
            : "Bypass / Skip conditional code block"}
        </span>
      </div>
    </Card>
  );
}
