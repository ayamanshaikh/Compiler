"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Zap,
  ArrowLeftRight,
  GraduationCap,
  Code,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Brain,
  Target,
} from "lucide-react";
import { ExecutionStep } from "@/lib/types";
import VariablePanel from "./VariablePanel";
import ExecutionTimeline from "./ExecutionTimeline";

interface VisualizerProps {
  steps: ExecutionStep[];
  onStepChange?: (step: ExecutionStep) => void;
  learningMode?: boolean;
}

type PlaybackSpeed = 0.5 | 1 | 2;

export default function Visualizer({
  steps,
  onStepChange,
  learningMode = true,
}: VisualizerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;

  useEffect(() => {
    if (currentStep) {
      onStepChange?.(currentStep);
    }
  }, [currentStepIndex, steps, onStepChange]);

  const goToStep = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalSteps) {
        setCurrentStepIndex(index);
      }
    },
    [totalSteps]
  );

  const goNext = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentStepIndex, totalSteps]);

  const goPrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const restart = useCallback(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        goNext();
      }, 1800 / speed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, goNext]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev]);

  if (!currentStep) return null;

  const getExplanation = () => {
    const base = currentStep.explanation;
    if (learningMode) return base;
    const codeRef = currentStep.code;
    return `${base}\n\nCode: ${codeRef}\nOperation: ${currentStep.action}`;
  };

  const getComparisonExplanation = () => {
    if (!currentStep.comparison) return null;
    const { left, right, result } = currentStep.comparison;

    if (learningMode) {
      return {
        what: `The program compares ${left} and ${right}.`,
        why: result
          ? `${left} is greater than ${right}, so the condition is true.`
          : `${left} is not greater than ${right}, so the condition is false.`,
        result: result ? "The values will be swapped." : "No swap is needed.",
      };
    }

    return {
      what: `Evaluating: ${currentStep.code}`,
      why: `Comparing values at indices ${currentStep.highlights.join(" and ")}: ${left} vs ${right}.`,
      result: result ? "Condition true — entering block." : "Condition false — skipping block.",
    };
  };

  const comparisonExplanation = getComparisonExplanation();

  // Calculate the max value for bar height normalization
  const allArrayValues = Object.values(currentStep.arrays).flat();
  const maxVal = Math.max(...allArrayValues, 1);

  return (
    <div className="animate-slide-in flex flex-col gap-4">
      {/* Header with step counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 ring-1 ring-emerald-500/20">
            <Zap size={14} className="text-emerald-400" />
          </div>
          <span className="text-sm font-semibold text-white">
            Execution Visualizer
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-1 text-[10px] text-zinc-500 ring-1 ring-white/[0.06]">
            {learningMode ? <GraduationCap size={10} /> : <Code size={10} />}
            {learningMode ? "Learning" : "Developer"}
          </span>
          <span className="rounded-full bg-gradient-to-r from-blue-500/15 to-cyan-500/15 px-2.5 py-1 text-[11px] font-medium text-blue-300 ring-1 ring-blue-500/15">
            Step {currentStepIndex + 1} of {totalSteps}
          </span>
        </div>
      </div>

      {/* Current code line */}
      <div className="glass-surface rounded-xl p-3.5">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-lg bg-blue-500/15 px-2 py-1 text-[10px] font-semibold text-blue-300 ring-1 ring-blue-500/10">
            Line {currentStep.lineNumber}
          </span>
          <span className="rounded-lg bg-zinc-500/15 px-2 py-1 text-[10px] font-medium text-zinc-400 ring-1 ring-white/[0.04]">
            {currentStep.action}
          </span>
        </div>
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-[#06090f]/60 p-3 font-mono text-[12.5px] leading-5 text-zinc-300 ring-1 ring-white/[0.04]">
          {currentStep.code}
        </pre>
      </div>

      {/* AI Explanation Panel */}
      <div className="border-gradient-green rounded-xl p-4">
        <div className="mb-2.5 flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/15">
            <Brain size={12} className="text-emerald-400" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            {learningMode ? "What is happening?" : "Execution Detail"}
          </span>
        </div>
        <p className="text-[13px] leading-6 text-zinc-300">
          {getExplanation()}
        </p>
      </div>

      {/* Comparison explanation (for if-statements) */}
      {comparisonExplanation && (
        <div className="rounded-xl border border-purple-500/10 bg-purple-500/[0.03] p-4 space-y-2.5">
          <div className="mb-1 flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-500/15">
              <Target size={12} className="text-purple-400" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400">
              {learningMode ? "Condition Analysis" : "Evaluation"}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2.5 text-[12px]">
              <span className="mt-0.5 text-zinc-600 font-medium">WHAT:</span>
              <span className="text-zinc-300">{comparisonExplanation.what}</span>
            </div>
            <div className="flex items-start gap-2.5 text-[12px]">
              <span className="mt-0.5 text-zinc-600 font-medium">WHY:</span>
              <span className="text-zinc-300">{comparisonExplanation.why}</span>
            </div>
            <div className="flex items-start gap-2.5 text-[12px]">
              <span className="mt-0.5 text-zinc-600 font-medium">RESULT:</span>
              <span
                className={`font-medium ${
                  currentStep.comparison?.result
                    ? "text-emerald-300"
                    : "text-zinc-400"
                }`}
              >
                {comparisonExplanation.result}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3D Array visualization */}
      {Object.keys(currentStep.arrays).length > 0 && (
        <div className="glass-surface rounded-xl p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <Braces size={12} className="text-zinc-500" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
              Data Structures
            </span>
          </div>
          {Object.entries(currentStep.arrays).map(([name, arr]) => (
            <div key={name} className="space-y-2">
              <div className="font-mono text-[12px] text-zinc-500">
                {name}
              </div>
              {/* 3D Bar visualization */}
              <div
                className="flex items-end gap-3 rounded-xl bg-[#06090f]/40 p-4"
                style={{ perspective: "800px" }}
              >
                {arr.map((val, idx) => {
                  const isHighlighted = currentStep.highlights.includes(idx);
                  const isSwapLeft = currentStep.swap?.indices[0] === idx;
                  const isSwapRight = currentStep.swap?.indices[1] === idx;
                  const barHeight = Math.max((val / maxVal) * 80, 24);

                  return (
                    <div key={idx} className="flex flex-col items-center gap-2">
                      {/* Value label */}
                      <span
                        className={`font-mono text-xs font-bold transition-all duration-300 ${
                          isSwapLeft || isSwapRight
                            ? "text-emerald-300"
                            : isHighlighted
                              ? "text-blue-300"
                              : "text-zinc-400"
                        }`}
                      >
                        {val}
                      </span>

                      {/* 3D Bar */}
                      <div
                        className="array-bar-3d relative"
                        style={{
                          width: "36px",
                          height: `${barHeight}px`,
                          background:
                            isSwapLeft || isSwapRight
                              ? "linear-gradient(180deg, #10b981 0%, #059669 100%)"
                              : isHighlighted
                                ? "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)"
                                : "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
                          transform:
                            isSwapLeft || isSwapRight
                              ? "rotateX(-8deg) rotateY(5deg) translateZ(6px)"
                              : "rotateX(-5deg) rotateY(3deg)",
                          boxShadow:
                            isSwapLeft || isSwapRight
                              ? "0 8px 30px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)"
                              : isHighlighted
                                ? "0 8px 30px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255,255,255,0.15)"
                                : "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
                          transition: "all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                        }}
                      >
                        {/* Index label inside bar */}
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-white/40 font-mono">
                          [{idx}]
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Comparison indicator */}
              {currentStep.comparison && (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-white/[0.02] p-2.5 ring-1 ring-white/[0.04]">
                  <ArrowLeftRight size={13} className="text-zinc-500" />
                  <span className="font-mono text-[13px] text-zinc-400">
                    {currentStep.comparison.left}{" "}
                    <span
                      className={`font-bold ${
                        currentStep.comparison.result
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {currentStep.comparison.result ? ">" : "<="}
                    </span>{" "}
                    {currentStep.comparison.right}
                  </span>
                  <span
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                      currentStep.comparison.result
                        ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/15"
                        : "bg-red-500/15 text-red-300 ring-1 ring-red-500/15"
                    }`}
                  >
                    {currentStep.comparison.result ? "TRUE" : "FALSE"}
                  </span>
                </div>
              )}

              {/* Swap indicator */}
              {currentStep.swap && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/[0.04] p-2.5 ring-1 ring-emerald-500/10">
                  <Sparkles size={12} className="text-emerald-400" />
                  <span className="text-[12px] text-emerald-300/80">
                    Swapped indices [{currentStep.swap.indices[0]}] and [{currentStep.swap.indices[1]}]
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Variables */}
      {Object.keys(currentStep.variables).length > 0 && (
        <VariablePanel
          variables={currentStep.variables}
          arrays={currentStep.arrays}
          highlightIndices={currentStep.highlights}
        />
      )}

      {/* Timeline */}
      <ExecutionTimeline
        steps={steps}
        currentStep={currentStep.step}
        onStepClick={(step) => {
          const idx = steps.findIndex((s) => s.step === step);
          if (idx >= 0) goToStep(idx);
        }}
      />

      {/* Controls */}
      <div className="glass-surface flex items-center justify-between rounded-xl p-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={restart}
            className="rounded-lg p-2 text-zinc-500 transition-all hover:bg-white/5 hover:text-zinc-300"
            title="Restart"
          >
            <RotateCcw size={15} />
          </button>
          <button
            onClick={goPrev}
            disabled={currentStepIndex === 0}
            className="rounded-lg p-2 text-zinc-500 transition-all hover:bg-white/5 hover:text-zinc-300 disabled:opacity-30"
            title="Previous step"
          >
            <SkipBack size={15} />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`rounded-xl p-2.5 transition-all ${
              isPlaying
                ? "bg-gradient-to-br from-emerald-500/20 to-cyan-500/15 text-emerald-400 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-500/10"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            }`}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            onClick={goNext}
            disabled={currentStepIndex === totalSteps - 1}
            className="rounded-lg p-2 text-zinc-500 transition-all hover:bg-white/5 hover:text-zinc-300 disabled:opacity-30"
            title="Next step"
          >
            <SkipForward size={15} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s as PlaybackSpeed)}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                speed === s
                  ? "bg-white/10 text-white ring-1 ring-white/10"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Braces({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M8 3a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2" />
      <path d="M16 3a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2" />
    </svg>
  );
}
