"use client";

import React, { useState, useMemo } from "react";
import { NormalizedExecutionEvent } from "@/lib/api/types";
import { resolveVisualizationStrategy } from "@/lib/visualizer/adaptiveStrategy";
import { buildStepExplanation } from "@/lib/visualizer/explanationBuilder";
import { VariableConceptRenderer } from "./VariableConceptRenderer";
import { ArrayConceptRenderer } from "./ArrayConceptRenderer";
import { ArrayOperationRenderer } from "./ArrayOperationRenderer";
import { ConditionConceptRenderer } from "./ConditionConceptRenderer";
import { LoopConceptRenderer } from "./LoopConceptRenderer";
import { FunctionConceptRenderer } from "./FunctionConceptRenderer";
import { ParameterBindingConceptRenderer } from "./ParameterBindingConceptRenderer";
import { OutputConceptRenderer } from "./OutputConceptRenderer";
import { ExpressionConceptRenderer } from "./ExpressionConceptRenderer";
import { StringConceptRenderer } from "./StringConceptRenderer";
import { ComparisonConceptRenderer } from "./ComparisonConceptRenderer";
import { RecursionConceptRenderer } from "./RecursionConceptRenderer";
import { ObjectConceptRenderer } from "./ObjectConceptRenderer";
import { StepExplanationCard } from "../explanation/StepExplanationCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { HelpCircle, Eye, ChevronDown, ChevronUp } from "lucide-react";

interface AdaptiveConceptDispatcherProps {
  event: NormalizedExecutionEvent;
  sourceLines?: string[];
}

export function AdaptiveConceptDispatcher({ event, sourceLines }: AdaptiveConceptDispatcherProps) {
  const [showCompanionExplanation, setShowCompanionExplanation] = useState<boolean>(false);
  const decision = resolveVisualizationStrategy(event);
  const explanation = useMemo(
    () => buildStepExplanation(event, sourceLines),
    [event, sourceLines]
  );

  return (
    <div className="flex flex-col gap-2.5">
      {/* Strategy Mode Header & Concept Card */}
      <Card className="p-3 bg-zinc-900/95 border-zinc-800 flex flex-col gap-2.5">
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
                : "Step-by-Step Educational Explanation"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge
              variant={decision.mode === "VISUAL_EXECUTION" ? "success" : "default"}
              size="sm"
            >
              {decision.rendererType !== "NONE" ? decision.rendererType : "EXPLANATION"}
            </Badge>
            <span className="text-[10px] text-zinc-500 font-mono">
              {decision.confidence === "FULL" ? "100% Fidelity" : "Adapted"}
            </span>
          </div>
        </div>

        {/* Primary Concept Visualizer Render OR Fallback Explanation */}
        {decision.mode === "VISUAL_EXECUTION" ? (
          <>
            {decision.rendererType === "VARIABLE" && (
              <VariableConceptRenderer event={event} />
            )}
            {decision.rendererType === "ARRAY" && (
              <ArrayConceptRenderer event={event} />
            )}
            {decision.rendererType === "ARRAY_OPERATION" && (
              <ArrayOperationRenderer event={event} />
            )}
            {decision.rendererType === "STRING_OPERATION" && (
              <StringConceptRenderer event={event} />
            )}
            {decision.rendererType === "CONDITION" && (
              <ConditionConceptRenderer event={event} />
            )}
            {decision.rendererType === "COMPARISON" && (
              <ComparisonConceptRenderer event={event} />
            )}
            {decision.rendererType === "LOOP" && (
              <LoopConceptRenderer event={event} />
            )}
            {decision.rendererType === "CALL_STACK" && (
              <FunctionConceptRenderer event={event} />
            )}
            {decision.rendererType === "PARAMETER_BIND" && (
              <ParameterBindingConceptRenderer event={event} />
            )}
            {decision.rendererType === "RECURSION" && (
              <RecursionConceptRenderer event={event} />
            )}
            {decision.rendererType === "OBJECT" && (
              <ObjectConceptRenderer event={event} />
            )}
            {decision.rendererType === "EXPRESSION" && (
              <ExpressionConceptRenderer event={event} />
            )}
            {decision.rendererType === "OUTPUT" && (
              <OutputConceptRenderer event={event} />
            )}
            {decision.rendererType === "NONE" && (
              <VariableConceptRenderer event={event} />
            )}

            {/* Companion Explanation Accordion */}
            <div className="pt-1 border-t border-zinc-800/60">
              <button
                type="button"
                onClick={() => setShowCompanionExplanation(!showCompanionExplanation)}
                className="flex items-center justify-between w-full py-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors font-mono cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <HelpCircle className="w-3 h-3 text-accent" />
                  <span>
                    {showCompanionExplanation
                      ? "Hide Step Explanation"
                      : "View Structured Step Explanation"}
                  </span>
                </div>
                {showCompanionExplanation ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showCompanionExplanation && (
                <div className="mt-2">
                  <StepExplanationCard explanation={explanation} compact />
                </div>
              )}
            </div>
          </>
        ) : (
          /* Mode B: Full Intentional Educational Step Card */
          <StepExplanationCard explanation={explanation} defaultExpandedLearnMore />
        )}
      </Card>
    </div>
  );
}
