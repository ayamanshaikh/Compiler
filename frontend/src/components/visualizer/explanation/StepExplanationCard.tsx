"use client";

import React, { useState } from "react";
import { StructuredStepExplanation } from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  HelpCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Activity,
  ArrowRight,
  Database,
  Code,
} from "lucide-react";

interface StepExplanationCardProps {
  explanation: StructuredStepExplanation;
  compact?: boolean;
  className?: string;
  defaultExpandedLearnMore?: boolean;
}

export function StepExplanationCard({
  explanation,
  compact = false,
  className = "",
  defaultExpandedLearnMore = false,
}: StepExplanationCardProps) {
  const [isLearnMoreOpen, setIsLearnMoreOpen] = useState(defaultExpandedLearnMore);

  const entries = Object.entries(explanation.currentValues);

  return (
    <Card
      className={`bg-zinc-900/90 border-zinc-800 text-zinc-100 flex flex-col gap-3.5 shadow-md ${
        compact ? "p-3" : "p-4"
      } ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-accent shrink-0" />
          <span className="text-xs font-bold text-zinc-200 tracking-wide uppercase font-mono">
            Step {explanation.stepNumber}
          </span>
          <span className="text-xs text-zinc-500 font-mono">•</span>
          <span className="text-xs text-accent font-semibold font-mono">
            Line {explanation.sourceLine}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge variant="neutral" size="sm">
            {explanation.category}
          </Badge>
          {explanation.controlFlowNote && (
            <Badge variant="default" size="sm">
              {explanation.controlFlowNote}
            </Badge>
          )}
        </div>
      </div>

      {/* Code Snippet (if available) */}
      {explanation.lineContent && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-zinc-950 border border-zinc-800 font-mono text-xs">
          <Code className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span className="text-zinc-300 font-medium truncate">
            {explanation.lineContent}
          </span>
        </div>
      )}

      {/* Section 1: What Happens */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">
          What happens
        </span>
        <p className="text-sm text-zinc-100 leading-snug font-medium">
          {explanation.whatHappens}
        </p>
      </div>

      {/* Section 2: Current Values / State */}
      <div className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800/70">
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">
          <Database className="w-3 h-3 text-accent" />
          <span>Current values in scope</span>
        </div>
        {entries.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {entries.map(([name, val]) => (
              <div
                key={name}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-xs"
              >
                <span className="text-zinc-400">{name}</span>
                <span className="text-zinc-600">=</span>
                <span className="text-accent font-semibold">{val}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-xs text-zinc-500 italic font-mono">
            No active variables initialized in current step.
          </span>
        )}
      </div>

      {/* Section 3: Why it Happens & Result Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
        {/* Why it happens */}
        <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800/60">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">
            <Activity className="w-3 h-3 text-blue-400" />
            <span>Why it happens</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {explanation.whyItHappens}
          </p>
        </div>

        {/* Result */}
        <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800/60">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">
            <ArrowRight className="w-3 h-3 text-emerald-400" />
            <span>Result</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {explanation.result}
          </p>
        </div>
      </div>

      {/* Section 4: Expandable Learn More */}
      {explanation.learnMore && (
        <div className="pt-1 border-t border-zinc-800/80 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setIsLearnMoreOpen(!isLearnMoreOpen)}
            className="flex items-center justify-between w-full py-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors font-mono"
          >
            <div className="flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-zinc-300">
                Learn more: Java runtime behavior
              </span>
            </div>
            {isLearnMoreOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </button>

          {isLearnMoreOpen && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-zinc-300 leading-relaxed font-mono">
              {explanation.learnMore}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
