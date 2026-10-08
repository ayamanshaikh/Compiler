"use client";

import React from "react";
import { NormalizedExecutionEvent } from "@/lib/api/types";
import { GitBranch, CheckCircle2, XCircle, ArrowDownRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface ConditionConceptRendererProps {
  event: NormalizedExecutionEvent;
}

export function ConditionConceptRenderer({ event }: ConditionConceptRendererProps) {
  const condExpr = (event.metadata?.condition as string) || event.symbol || "condition";
  const isTrue =
    event.currentValue === "true" ||
    event.metadata?.result === "true" ||
    event.description.includes("TRUE");

  return (
    <div className="flex flex-col gap-3 p-3.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-zinc-300 font-mono">
            Condition Check
          </span>
        </div>
        <Badge variant={isTrue ? "success" : "danger"} size="sm">
          {isTrue ? "Condition TRUE" : "Condition FALSE"}
        </Badge>
      </div>

      {/* Condition Evaluation Flow */}
      <div className="flex flex-col gap-2 p-3 rounded-md bg-zinc-900/90 border border-zinc-800">
        <div className="flex items-center justify-between font-mono text-xs">
          <span className="text-zinc-400">Expression:</span>
          <span className="text-zinc-200 font-semibold px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
            {condExpr}
          </span>
        </div>

        <div className="flex items-center justify-between font-mono text-xs pt-1 border-t border-zinc-800/80">
          <span className="text-zinc-400">Evaluation:</span>
          <div className="flex items-center gap-1.5">
            {isTrue ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">TRUE</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-rose-400" />
                <span className="text-rose-400 font-bold">FALSE</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-zinc-800 text-[11px] font-mono text-zinc-300">
          <ArrowDownRight className={`w-3.5 h-3.5 ${isTrue ? "text-emerald-400" : "text-rose-400"}`} />
          <span>
            {isTrue
              ? "Branch taken: Executing inside block statement."
              : "Branch skipped: Bypassing block statement."}
          </span>
        </div>
      </div>
    </div>
  );
}
