"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  AlgorithmMetadata,
  AlgorithmStep,
  AlgorithmTraceResponse,
  HighlightType,
} from "@/lib/api/algorithm";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Sparkles,
  Code2,
  CheckCircle2,
  Sliders,
  Shuffle,
  Bookmark,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

interface AlgorithmVisualizerProps {
  algorithm: AlgorithmMetadata;
  trace: AlgorithmTraceResponse;
  onCustomSimulate?: (customInput: number[], target?: number) => void;
  isSimulating?: boolean;
}

const HIGHLIGHT_STYLES: Record<
  HighlightType,
  { bg: string; border: string; text: string; label: string }
> = {
  COMPARING: {
    bg: "bg-amber-500",
    border: "border-amber-400",
    text: "text-amber-100",
    label: "Comparing",
  },
  SWAPPING: {
    bg: "bg-rose-500 animate-pulse",
    border: "border-rose-400",
    text: "text-rose-100",
    label: "Swapping",
  },
  SORTED: {
    bg: "bg-emerald-500",
    border: "border-emerald-400",
    text: "text-emerald-100",
    label: "Sorted",
  },
  PIVOT: {
    bg: "bg-purple-500",
    border: "border-purple-400",
    text: "text-purple-100",
    label: "Pivot / Min",
  },
  POINTER_LEFT: {
    bg: "bg-cyan-500",
    border: "border-cyan-400",
    text: "text-cyan-100",
    label: "Left Ptr",
  },
  POINTER_RIGHT: {
    bg: "bg-blue-500",
    border: "border-blue-400",
    text: "text-blue-100",
    label: "Right Ptr",
  },
  POINTER_MID: {
    bg: "bg-indigo-500",
    border: "border-indigo-400",
    text: "text-indigo-100",
    label: "Mid / Probe",
  },
  ACTIVE: {
    bg: "bg-indigo-600",
    border: "border-indigo-400",
    text: "text-indigo-100",
    label: "Active Key",
  },
  FOUND: {
    bg: "bg-emerald-400 ring-2 ring-emerald-300",
    border: "border-emerald-300",
    text: "text-emerald-950 font-bold",
    label: "Match Found",
  },
  DISCARDED: {
    bg: "bg-zinc-800/40",
    border: "border-zinc-800",
    text: "text-zinc-600 opacity-30",
    label: "Excluded",
  },
};

export function AlgorithmVisualizer({
  algorithm,
  trace,
  onCustomSimulate,
  isSimulating = false,
}: AlgorithmVisualizerProps) {
  const { preferences, progress, toggleAlgorithmBookmark } = useAuth();
  const isBookmarked = progress.bookmarkedAlgorithms.includes(algorithm.slug);

  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [userSpeedOverride, setUserSpeedOverride] = useState<number | null>(null);
  const playbackSpeed = userSpeedOverride ?? (preferences?.visualizerSpeed || 800);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Custom input form state
  const [inputStr, setInputStr] = useState<string>(
    algorithm.defaultInput.join(", ")
  );
  const [targetVal, setTargetVal] = useState<string>(
    algorithm.defaultTarget !== undefined ? String(algorithm.defaultTarget) : ""
  );

  // Handle Playback Interval
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev >= trace.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, trace.steps.length]);

  const currentStep: AlgorithmStep | undefined = trace.steps[currentStepIdx];
  const maxVal = Math.max(
    10,
    ...(currentStep?.arrayState && currentStep.arrayState.length > 0
      ? currentStep.arrayState
      : [10])
  );

  const handleNext = () => {
    if (currentStepIdx < trace.steps.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIdx(0);
  };

  const handleRandomize = () => {
    const size = Math.floor(Math.random() * 4) + 6; // 6 to 9 items
    const randoms = Array.from({ length: size }, () =>
      Math.floor(Math.random() * 85) + 10
    );
    if (algorithm.category === "SEARCHING" || algorithm.slug === "two-sum-sorted") {
      randoms.sort((a, b) => a - b);
      const chosenTarget = randoms[Math.floor(Math.random() * randoms.length)];
      setTargetVal(String(chosenTarget));
      setInputStr(randoms.join(", "));
      if (onCustomSimulate) onCustomSimulate(randoms, chosenTarget);
    } else {
      setInputStr(randoms.join(", "));
      if (onCustomSimulate) onCustomSimulate(randoms);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = inputStr
      .split(/[\s,]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));

    if (parsed.length === 0) return;
    const target = targetVal ? parseInt(targetVal.trim(), 10) : undefined;
    if (onCustomSimulate) onCustomSimulate(parsed, target);
  };

  // Split code lines for synchronous line highlighting
  const codeLines = algorithm.javaCode.split("\n");

  return (
    <div className="space-y-6">
      {/* 1. Algorithm Narrative & Complexity Header Bar */}
      <Card className="p-5 bg-zinc-900/70 border-zinc-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <h2 className="text-xl font-bold text-zinc-100">{algorithm.name}</h2>
              <Badge variant="neutral" size="sm" className="font-mono text-[11px]">
                {algorithm.category}
              </Badge>
              <button
                type="button"
                onClick={() => toggleAlgorithmBookmark(algorithm.slug)}
                title={isBookmarked ? "Remove Bookmark" : "Bookmark Algorithm"}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isBookmarked
                    ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                    : "bg-zinc-800/60 border-zinc-750 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-purple-400 text-purple-400" : ""}`} />
              </button>
            </div>
            <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
              {algorithm.description}
            </p>
          </div>

          {/* Complexity Cards */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800/80 font-mono text-center">
              <span className="text-[10px] text-zinc-400 block uppercase">Time (Avg)</span>
              <span className="text-xs font-bold text-amber-400">
                {algorithm.timeComplexityAverage}
              </span>
            </div>
            <div className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800/80 font-mono text-center">
              <span className="text-[10px] text-zinc-400 block uppercase">Time (Worst)</span>
              <span className="text-xs font-bold text-rose-400">
                {algorithm.timeComplexityWorst}
              </span>
            </div>
            <div className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800/80 font-mono text-center">
              <span className="text-[10px] text-zinc-400 block uppercase">Space</span>
              <span className="text-xs font-bold text-emerald-400">
                {algorithm.spaceComplexity}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Visual Canvas & Synchronized Code View Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Visual Canvas & Playback (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 bg-zinc-950 border-zinc-800 min-h-[380px] flex flex-col justify-between">
            {/* Step Explanation Banner */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-3 mb-6">
              <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono text-zinc-400">
                    Step {currentStepIdx + 1} of {trace.steps.length}
                  </span>
                  <span className="text-[11px] font-mono text-indigo-400 font-medium">
                    Line {currentStep?.line ?? "—"}
                  </span>
                </div>
                <p className="text-xs text-zinc-200 font-sans leading-relaxed">
                  {currentStep?.description || "Initializing algorithm execution..."}
                </p>
              </div>
            </div>

            {/* Visual Bars Container */}
            <div className="py-6 flex items-end justify-center gap-2 sm:gap-3 min-h-[190px] px-2 overflow-x-auto">
              {currentStep?.arrayState.map((val, idx) => {
                const hlType = currentStep.highlights[idx];
                const hlStyle = hlType ? HIGHLIGHT_STYLES[hlType] : null;

                // Height proportional calculation (min 20%, max 95%)
                const heightPercent = Math.max(
                  20,
                  Math.min(95, Math.round((val / maxVal) * 90))
                );

                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center flex-1 max-w-[56px] min-w-[32px] transition-all duration-300"
                  >
                    {/* Element Value Label */}
                    <span
                      className={`text-xs font-mono font-bold mb-1.5 transition-colors ${
                        hlStyle ? "text-zinc-100" : "text-zinc-400"
                      }`}
                    >
                      {val}
                    </span>

                    {/* Animated Vertical Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-lg border transition-all duration-300 relative flex items-center justify-center ${
                        hlStyle
                          ? `${hlStyle.bg} ${hlStyle.border}`
                          : "bg-zinc-800 border-zinc-700/80 hover:bg-zinc-700/80"
                      }`}
                    >
                      {hlStyle && (
                        <span className="text-[9px] font-mono font-bold uppercase tracking-tight text-white/90 transform -rotate-90 sm:rotate-0 truncate px-0.5">
                          {hlStyle.label}
                        </span>
                      )}
                    </div>

                    {/* Array Index Label */}
                    <span className="text-[10px] font-mono text-zinc-400 mt-2">
                      [{idx}]
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Performance Counters Footer */}
            <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-4">
                <span>
                  Comparisons:{" "}
                  <strong className="text-amber-400 font-bold">
                    {currentStep?.comparisons ?? 0}
                  </strong>
                </span>
                <span>
                  Swaps:{" "}
                  <strong className="text-rose-400 font-bold">
                    {currentStep?.swaps ?? 0}
                  </strong>
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">
                {currentStepIdx === trace.steps.length - 1 ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Finished
                  </span>
                ) : (
                  <span>In progress</span>
                )}
              </div>
            </div>
          </Card>

          {/* Playback Controls & Timeline Scrubber */}
          <Card className="p-4 bg-zinc-900/80 border-zinc-800 space-y-4">
            {/* Timeline Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>Progress Scrubber</span>
                <span>
                  {currentStepIdx + 1} / {trace.steps.length}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(0, trace.steps.length - 1)}
                value={currentStepIdx}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentStepIdx(parseInt(e.target.value, 10));
                }}
                className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Control Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  title="Reset to Step 1"
                  className="px-2.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentStepIdx === 0}
                  title="Previous Step"
                  className="px-2.5"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 mr-1.5 fill-current" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 mr-1.5 fill-current" /> Play
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentStepIdx >= trace.steps.length - 1}
                  title="Next Step"
                  className="px-2.5"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Speed Controller */}
              <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800 font-mono text-xs">
                <span className="text-[10px] text-zinc-400 px-1.5">Speed:</span>
                {[
                  { label: "0.5x", ms: 1400 },
                  { label: "1x", ms: 800 },
                  { label: "2x", ms: 400 },
                  { label: "4x", ms: 150 },
                ].map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setUserSpeedOverride(s.ms)}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                      playbackSpeed === s.ms
                        ? "bg-indigo-600 text-white font-bold"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* 3. Custom Input Formulation Form */}
          <Card className="p-4 bg-zinc-900/60 border-zinc-800">
            <form onSubmit={handleApplyCustom} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-zinc-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  Custom Simulation Parameters
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRandomize}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                  <Shuffle className="w-3 h-3 mr-1" /> Randomize
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={inputStr}
                    onChange={(e) => setInputStr(e.target.value)}
                    placeholder="e.g. 45, 22, 89, 14, 67"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 font-mono text-xs text-zinc-200 outline-none focus:border-indigo-500"
                  />
                </div>

                {(algorithm.category === "SEARCHING" ||
                  algorithm.slug === "two-sum-sorted") && (
                  <div className="w-full sm:w-28">
                    <input
                      type="number"
                      value={targetVal}
                      onChange={(e) => setTargetVal(e.target.value)}
                      placeholder="Target"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 font-mono text-xs text-zinc-200 outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSimulating}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-4"
                >
                  {isSimulating ? "Simulating..." : "Simulate Trace"}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Synchronized Canonical Java Code (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <Card className="bg-zinc-950 border-zinc-800 shadow-xl overflow-hidden">
            <div className="py-2.5 px-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Canonical Java Implementation</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                Active Line Sync
              </span>
            </div>

            {/* Monospace Code Listing with Real-Time Line Highlights */}
            <div className="p-3 font-mono text-xs leading-relaxed overflow-x-auto max-h-[580px] overflow-y-auto">
              {codeLines.map((line, index) => {
                const lineNum = index + 1;
                const isCurrentLine = currentStep?.line === lineNum;

                return (
                  <div
                    key={index}
                    className={`flex items-start rounded px-2 py-0.5 transition-colors ${
                      isCurrentLine
                        ? "bg-indigo-950/80 border-l-2 border-indigo-400 text-zinc-100 font-semibold"
                        : "text-zinc-400 hover:text-zinc-300"
                    }`}
                  >
                    {/* Line Number & Indicator */}
                    <span className="w-8 text-[11px] text-zinc-400 select-none flex-shrink-0">
                      {isCurrentLine ? (
                        <span className="text-amber-400 font-bold mr-1">▶</span>
                      ) : (
                        " "
                      )}
                      {lineNum}
                    </span>

                    {/* Code Content */}
                    <pre className="flex-1 whitespace-pre">{line}</pre>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Highlight Legend Card */}
          <Card className="p-3.5 bg-zinc-900/40 border-zinc-800 text-[11px] font-mono space-y-2">
            <span className="text-zinc-400 font-semibold uppercase tracking-wider block">
              Color Legend:
            </span>
            <div className="grid grid-cols-2 gap-2 text-zinc-300">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
                <span>Comparing Elements</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
                <span>Swapping / Shift</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                <span>Sorted Partition</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-purple-500 inline-block" />
                <span>Pivot / Min Element</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-cyan-500 inline-block" />
                <span>Active Pointer / Mid</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-zinc-800 inline-block" />
                <span>Default Unsorted</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
