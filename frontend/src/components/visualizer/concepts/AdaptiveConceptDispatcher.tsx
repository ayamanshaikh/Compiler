"use client";

import React from "react";
import { NormalizedExecutionEvent } from "@/lib/api/types";
import { resolveVisualizationStrategy } from "@/lib/visualizer/adaptiveStrategy";
import { VariableConceptRenderer } from "./VariableConceptRenderer";
import { ArrayConceptRenderer } from "./ArrayConceptRenderer";
import { ConditionConceptRenderer } from "./ConditionConceptRenderer";
import { LoopConceptRenderer } from "./LoopConceptRenderer";
import { FunctionConceptRenderer } from "./FunctionConceptRenderer";
import { OutputConceptRenderer } from "./OutputConceptRenderer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Sparkles, HelpCircle, Eye } from "lucide-react";

interface AdaptiveConceptDispatcherProps {
  event: NormalizedExecutionEvent;
}

export function AdaptiveConceptDispatcher({ event }: AdaptiveConceptDispatcherProps) {
  const decision = resolveVisualizationStrategy(event);

  return (
    <Card className="p-3 bg-zinc-900/95 border-zinc-800 flex flex-col gap-2.5">
      {/* Strategy Mode Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          {decision.mode === "VISUAL_EXECUTION" ? (
            <Eye className="w-3.5 h-3.5 text-accent" />
          ) : (
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
          )}
          <span className="text-xs font-semibold text-zinc-200">
            {decision.mode === "VISUAL_EXECUTION"
              ? "Adaptive Concept Visualizer"
              : "Step-by-Step Explanation"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge
            variant={decision.mode === "VISUAL_EXECUTION" ? "success" : "default"}
            size="sm"
          >
            {decision.rendererType !== "NONE" ? decision.rendererType : "STEP"}
          </Badge>
          <span className="text-[10px] text-zinc-500 font-mono">
            {decision.confidence === "FULL" ? "100% Fidelity" : "Adapted"}
          </span>
        </div>
      </div>

      {/* Primary Concept Visualizer Render */}
      {decision.mode === "VISUAL_EXECUTION" ? (
        <>
          {decision.rendererType === "VARIABLE" && (
            <VariableConceptRenderer event={event} />
          )}
          {decision.rendererType === "ARRAY" && (
            <ArrayConceptRenderer event={event} />
          )}
          {decision.rendererType === "CONDITION" && (
            <ConditionConceptRenderer event={event} />
          )}
          {decision.rendererType === "LOOP" && (
            <LoopConceptRenderer event={event} />
          )}
          {decision.rendererType === "CALL_STACK" && (
            <FunctionConceptRenderer event={event} />
          )}
          {decision.rendererType === "OUTPUT" && (
            <OutputConceptRenderer event={event} />
          )}
          {decision.rendererType === "NONE" && (
            <VariableConceptRenderer event={event} />
          )}
        </>
      ) : (
        /* Intentional Fallback Card */
        <div className="flex flex-col gap-2.5 p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 font-mono text-xs">
          <div className="flex items-center justify-between text-zinc-400">
            <span>Line {event.sourceLine}</span>
            <span className="text-zinc-500">{event.scope}</span>
          </div>
          <div className="text-zinc-200 font-medium">
            {event.description}
          </div>
          <div className="flex items-start gap-1.5 text-[11px] text-zinc-400 pt-2 border-t border-zinc-800">
            <Sparkles className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
            <span>{decision.reason}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
