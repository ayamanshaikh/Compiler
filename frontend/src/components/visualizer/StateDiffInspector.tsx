"use client";

import React, { useMemo } from "react";
import { TraceStep } from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GitCompare, Plus, RefreshCw, Minus } from "lucide-react";

interface StateDiffInspectorProps {
  currentStep?: TraceStep;
  previousStep?: TraceStep;
}

export interface VariableDiffItem {
  name: string;
  type: "ADDED" | "MODIFIED" | "REMOVED" | "UNCHANGED";
  oldValue?: string;
  newValue?: string;
  varType: string;
}

export function computeStateDiff(
  currentStep?: TraceStep,
  previousStep?: TraceStep
): VariableDiffItem[] {
  if (!currentStep) return [];

  const curVars = currentStep.variables || {};
  const prevVars = previousStep?.variables || {};

  const diffs: VariableDiffItem[] = [];

  // Check current variables against previous
  for (const [name, curSnap] of Object.entries(curVars)) {
    const prevSnap = prevVars[name];
    if (!prevSnap) {
      diffs.push({
        name,
        type: "ADDED",
        newValue: curSnap.value,
        varType: curSnap.type,
      });
    } else if (prevSnap.value !== curSnap.value) {
      diffs.push({
        name,
        type: "MODIFIED",
        oldValue: prevSnap.value,
        newValue: curSnap.value,
        varType: curSnap.type,
      });
    } else {
      diffs.push({
        name,
        type: "UNCHANGED",
        oldValue: prevSnap.value,
        newValue: curSnap.value,
        varType: curSnap.type,
      });
    }
  }

  // Check removed variables that were in previous but no longer in current
  for (const [name, prevSnap] of Object.entries(prevVars)) {
    if (!curVars[name]) {
      diffs.push({
        name,
        type: "REMOVED",
        oldValue: prevSnap.value,
        varType: prevSnap.type,
      });
    }
  }

  return diffs;
}

export function StateDiffInspector({
  currentStep,
  previousStep,
}: StateDiffInspectorProps) {
  const diffs = useMemo(
    () => computeStateDiff(currentStep, previousStep),
    [currentStep, previousStep]
  );

  const activeChanges = diffs.filter((d) => d.type !== "UNCHANGED");

  return (
    <Card className="p-3 bg-zinc-900 border-zinc-800 flex flex-col gap-2">
      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
        <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-semibold">
          <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
          <span>Step State Delta (Δ)</span>
        </div>
        <Badge variant="outline" size="sm" className="font-mono text-[10px] text-indigo-400 border-indigo-500/30">
          {activeChanges.length} mutation{activeChanges.length === 1 ? "" : "s"}
        </Badge>
      </div>

      {activeChanges.length === 0 ? (
        <div className="text-[11px] text-zinc-500 font-mono italic py-1">
          No variable mutations in this step.
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto">
          {activeChanges.map((item) => (
            <div
              key={item.name}
              className={`flex items-center justify-between p-1.5 rounded font-mono text-xs border ${
                item.type === "ADDED"
                  ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                  : item.type === "MODIFIED"
                  ? "bg-amber-950/20 border-amber-800/40 text-amber-300"
                  : "bg-rose-950/20 border-rose-800/40 text-rose-300"
              }`}
            >
              <div className="flex items-center gap-1.5">
                {item.type === "ADDED" && <Plus className="w-3 h-3 text-emerald-400" />}
                {item.type === "MODIFIED" && <RefreshCw className="w-3 h-3 text-amber-400" />}
                {item.type === "REMOVED" && <Minus className="w-3 h-3 text-rose-400" />}
                <span className="font-semibold">{item.name}</span>
                <span className="text-[10px] text-zinc-500">({item.varType})</span>
              </div>

              <div className="flex items-center gap-1 text-[11px]">
                {item.type === "MODIFIED" && (
                  <>
                    <span className="line-through text-zinc-500">{item.oldValue}</span>
                    <span className="text-zinc-400">→</span>
                  </>
                )}
                {item.type === "REMOVED" && (
                  <span className="line-through text-rose-400">{item.oldValue}</span>
                )}
                {item.type !== "REMOVED" && (
                  <span className="font-bold">{item.newValue}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
