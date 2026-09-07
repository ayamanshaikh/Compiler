"use client";

import { ExecutionStep } from "@/lib/types";

interface ExecutionTimelineProps {
  steps: ExecutionStep[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export default function ExecutionTimeline({
  steps,
  currentStep,
  onStepClick,
}: ExecutionTimelineProps) {
  if (steps.length === 0) return null;

  const progress = ((currentStep - 1) / Math.max(steps.length - 1, 1)) * 100;

  return (
    <div className="glass-surface rounded-xl p-3.5">
      {/* Progress bar */}
      <div className="mb-3 relative h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-400/30 to-cyan-400/30 blur-sm transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step dots */}
      <div className="flex items-center gap-1 overflow-x-auto py-1">
        {steps.map((step) => {
          const isCompleted = step.step < currentStep;
          const isCurrent = step.step === currentStep;

          return (
            <button
              key={step.step}
              onClick={() => onStepClick(step.step)}
              className={`relative flex h-7 min-w-[28px] flex-shrink-0 items-center justify-center rounded-lg px-1.5 font-mono text-[11px] font-medium transition-all duration-300 ${
                isCurrent
                  ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 ring-1 ring-blue-400/30"
                  : isCompleted
                    ? "bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/10 hover:bg-blue-500/25"
                    : "bg-white/[0.03] text-zinc-600 ring-1 ring-white/[0.04] hover:bg-white/[0.06] hover:text-zinc-400"
              }`}
              title={`Step ${step.step}: ${step.action}`}
            >
              {step.step}
              {isCurrent && (
                <div className="absolute -bottom-1 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full bg-blue-400 shadow-sm shadow-blue-400/50" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
