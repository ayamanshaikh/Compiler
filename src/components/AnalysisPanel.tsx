"use client";

import {
  Play,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
} from "lucide-react";
import { CompileResponse, CompilationStatus, ExecutionStep } from "@/lib/types";
import ErrorCard from "./ErrorCard";
import OutputPanel from "./OutputPanel";
import Visualizer from "./Visualizer";

interface AnalysisPanelProps {
  status: CompilationStatus;
  result: CompileResponse | null;
  isVisualizing: boolean;
  executionSteps: ExecutionStep[];
  onStepChange?: (step: ExecutionStep) => void;
  learningMode?: boolean;
}

export default function AnalysisPanel({
  status,
  result,
  isVisualizing,
  executionSteps,
  onStepChange,
  learningMode = true,
}: AnalysisPanelProps) {
  // Visualizer mode
  if (isVisualizing && executionSteps.length > 0) {
    return (
      <div className="flex h-full flex-col p-4">
        <Visualizer
          steps={executionSteps}
          onStepChange={onStepChange}
          learningMode={learningMode}
        />
      </div>
    );
  }

  // Compiling state
  if (status === "compiling") {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-blue-500/15 border-t-blue-400" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-blue-500/20 animate-glow-pulse" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-sm font-semibold text-white">
              Compiling Java code...
            </h3>
            <p className="mt-1.5 text-[12px] text-zinc-500">
              Analyzing your program
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!result) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/5 ring-1 ring-white/[0.04]">
            <Sparkles size={24} className="text-blue-400/50" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-300">
              Ready to analyze
            </h3>
            <p className="mt-1.5 max-w-[240px] text-[12px] leading-5 text-zinc-600">
              Write Java code and press Run to see compilation results,
              errors, and output.
            </p>
          </div>
          <div className="mt-2 flex items-center gap-1.5 rounded-full bg-white/[0.03] px-3 py-1.5 text-[10px] text-zinc-600 ring-1 ring-white/[0.04]">
            <Play size={10} />
            Press Ctrl+Enter to run
          </div>
        </div>
      </div>
    );
  }

  // Result state
  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex-1 space-y-4 overflow-y-auto">
        {result.success ? (
          <>
            {/* Success header */}
            <div className="flex items-center gap-3 rounded-xl border border-green-500/15 bg-green-500/[0.04] p-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15">
                <CheckCircle2 size={16} className="text-green-400" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-green-300">
                  Compilation Successful
                </p>
                <p className="mt-0.5 text-[12px] text-zinc-500">
                  {result.message}
                </p>
              </div>
            </div>

            {/* Output */}
            <OutputPanel output={result.output} success={true} />

            {/* Execution trace status */}
            {executionSteps.length > 0 && (
              <div className="rounded-xl border border-blue-500/15 bg-blue-500/[0.04] p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles size={13} className="text-blue-400" />
                  <span className="text-[12px] font-semibold text-blue-300">
                    Execution Trace Ready
                  </span>
                </div>
                <p className="text-[12px] text-zinc-500">
                  Captured {executionSteps.length} real execution step
                  {executionSteps.length === 1 ? "" : "s"} from this run.
                  {result.executionTraceTruncated
                    ? " The trace was truncated because the program ran for a very large number of steps."
                    : " Press Visualize to step through it."}
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Error header */}
            <div className="flex items-center gap-3 rounded-xl border border-red-500/15 bg-red-500/[0.04] p-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15">
                <AlertCircle size={16} className="text-red-400" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-red-300">
                  {result.message}
                </p>
                {result.lineNumber > 0 && (
                  <p className="mt-0.5 text-[12px] text-zinc-500">
                    Error on line {result.lineNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Error details */}
            <ErrorCard result={result} learningMode={learningMode} />
          </>
        )}
      </div>
    </div>
  );
}
