"use client";

import React, { useState, useMemo } from "react";
import { NormalizedExecutionEvent } from "@/lib/api/types";
import { buildStepExplanation } from "@/lib/visualizer/explanationBuilder";
import { StepExplanationCard } from "./StepExplanationCard";
import { Badge } from "@/components/ui/Badge";
import { BookOpen, Search, Filter } from "lucide-react";

interface ExplanationTimelineProps {
  events: NormalizedExecutionEvent[];
  sourceCode: string;
  activeStepIndex: number;
  onSelectStep: (stepIndex: number) => void;
}

export function ExplanationTimeline({
  events,
  sourceCode,
  activeStepIndex,
  onSelectStep,
}: ExplanationTimelineProps) {
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const sourceLines = useMemo(() => sourceCode.split(/\r?\n/), [sourceCode]);

  // Generate structured explanations for each event
  const explanations = useMemo(() => {
    return events.map((ev) => buildStepExplanation(ev, sourceLines));
  }, [events, sourceLines]);

  // Filter explanations
  const filteredIndices = useMemo(() => {
    return explanations
      .map((exp, idx) => ({ exp, idx }))
      .filter(({ exp }) => {
        if (filterCategory !== "ALL") {
          if (filterCategory === "VARIABLES" && !exp.category.includes("Variable") && !exp.category.includes("Mutation")) {
            return false;
          }
          if (filterCategory === "CONDITIONS" && !exp.category.includes("Branch")) {
            return false;
          }
          if (filterCategory === "LOOPS" && !exp.category.includes("Loop")) {
            return false;
          }
          if (filterCategory === "OUTPUT" && !exp.category.includes("Output")) {
            return false;
          }
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            exp.whatHappens.toLowerCase().includes(q) ||
            exp.whyItHappens.toLowerCase().includes(q) ||
            exp.category.toLowerCase().includes(q) ||
            (exp.lineContent && exp.lineContent.toLowerCase().includes(q));
          if (!matches) return false;
        }
        return true;
      });
  }, [explanations, filterCategory, searchQuery]);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Narrative Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-accent" />
          <span className="text-xs font-bold text-zinc-200">
            Step-by-Step Execution Narrative
          </span>
          <Badge variant="neutral" size="sm">
            {filteredIndices.length} of {events.length} Steps
          </Badge>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search narrative..."
              className="pl-8 pr-2.5 py-1 text-xs rounded bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-accent w-36 sm:w-44 font-mono"
            />
          </div>

          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-zinc-500 mr-0.5" />
            {[
              { id: "ALL", label: "All" },
              { id: "VARIABLES", label: "Vars" },
              { id: "CONDITIONS", label: "Branches" },
              { id: "LOOPS", label: "Loops" },
              { id: "OUTPUT", label: "Output" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterCategory(f.id)}
                className={`px-2 py-0.5 text-xs rounded transition-colors font-mono ${
                  filterCategory === f.id
                    ? "bg-accent/20 text-accent border border-accent/40 font-semibold"
                    : "text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Narrative Steps Stack */}
      <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1">
        {filteredIndices.length > 0 ? (
          filteredIndices.map(({ exp, idx }) => {
            const isActive = idx === activeStepIndex;
            return (
              <div
                key={idx}
                onClick={() => onSelectStep(idx)}
                className={`cursor-pointer transition-all rounded-xl ${
                  isActive
                    ? "ring-2 ring-accent shadow-lg scale-[1.005]"
                    : "opacity-80 hover:opacity-100"
                }`}
              >
                <StepExplanationCard
                  explanation={exp}
                  compact={!isActive}
                  defaultExpandedLearnMore={isActive}
                  className={isActive ? "border-accent/40" : ""}
                />
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-zinc-500 border border-zinc-800 rounded-lg bg-zinc-950">
            No execution steps matched the filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}
