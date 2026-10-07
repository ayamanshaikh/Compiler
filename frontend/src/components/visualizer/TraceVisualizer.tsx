"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Database,
  Layers,
  Code2,
} from "lucide-react";
import { TraceResponsePayload, TraceStep } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/lib/context/AuthContext";

interface TraceVisualizerProps {
  trace: TraceResponsePayload;
  sourceCode: string;
}

export function TraceVisualizer({ trace, sourceCode }: TraceVisualizerProps) {
  const { preferences } = useAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1); // 0.5x, 1x, 2x
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const steps = trace.steps || [];
  const currentStep: TraceStep | undefined = steps[currentStepIndex];
  const sourceLines = sourceCode.split(/\r?\n/);

  const baseSpeed = preferences?.visualizerSpeed || 600;
  const isCompact = preferences?.visualDensity === "compact";
  const detailLevel = preferences?.visualizationDetail || "standard";

  // Playback timer loop
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.round(baseSpeed / speedMultiplier);
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < steps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, intervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speedMultiplier, steps.length, baseSpeed]);

  const handleStepForward = () => {
    setIsPlaying(false);
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleStepBackward = () => {
    setIsPlaying(false);
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  if (steps.length === 0) {
    return (
      <Card className="p-6 text-center text-zinc-400">
        No execution trace steps available to visualize.
      </Card>
    );
  }

  const activeLineNum = currentStep ? currentStep.line : 1;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Control Bar */}
      <Card className="p-3 bg-zinc-900 border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRestart}
            title="Restart (Step 0)"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Restart
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStepBackward}
            disabled={currentStepIndex === 0}
            title="Step Backward"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant={isPlaying ? "secondary" : "primary"}
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-1" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" /> Play
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStepForward}
            disabled={currentStepIndex >= steps.length - 1}
            title="Step Forward"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrubber & Step Info */}
        <div className="flex items-center gap-3 flex-1 max-w-md mx-2">
          <span className="text-xs text-zinc-400 whitespace-nowrap">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <input
            type="range"
            min={0}
            max={steps.length - 1}
            value={currentStepIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentStepIndex(Number(e.target.value));
            }}
            className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
          />
        </div>

        {/* Speed Multiplier */}
        <div className="flex items-center gap-1">
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              onClick={() => setSpeedMultiplier(s)}
              className={`px-2 py-1 text-xs rounded font-mono transition-colors ${
                speedMultiplier === s
                  ? "bg-accent/20 text-accent border border-accent/40 font-semibold"
                  : "text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </Card>

      {/* Step Event Indicator */}
      {currentStep && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-900/80 border border-zinc-800/80 rounded-lg">
          <Badge variant="default">{currentStep.eventType}</Badge>
          <span className="text-sm text-zinc-200 font-medium">
            {currentStep.description}
          </span>
          <span className="text-xs text-accent ml-auto font-mono">
            Line {currentStep.line}
          </span>
        </div>
      )}

      {/* Main Grid: Code Editor View + Execution Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Source Code Line View with Step Highlight */}
        <div className={`lg:col-span-7 bg-zinc-950 border border-zinc-800 rounded-lg p-3 font-mono overflow-auto max-h-[460px] ${isCompact ? "text-[11px]" : "text-xs"}`}>
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-zinc-800 text-zinc-400">
            <Code2 className="w-3.5 h-3.5" />
            <span className="font-semibold text-zinc-300">Program Execution Line Highlight</span>
          </div>
          {sourceLines.map((lineText, idx) => {
            const lineNum = idx + 1;
            const isCurrent = lineNum === activeLineNum;
            return (
              <div
                key={idx}
                className={`flex items-start rounded transition-colors ${
                  isCompact ? "py-0 px-1" : "py-0.5 px-2"
                } ${
                  isCurrent
                    ? "bg-accent/15 border-l-2 border-accent text-accent font-semibold"
                    : "text-zinc-300 hover:bg-zinc-900/50"
                }`}
              >
                <span className="w-8 text-right text-zinc-500 select-none mr-3 shrink-0">
                  {lineNum}
                </span>
                <span className="whitespace-pre">{lineText || " "}</span>
              </div>
            );
          })}
        </div>

        {/* Runtime State Inspector Panels */}
        <div className="lg:col-span-5 flex flex-col gap-4 max-h-[460px] overflow-y-auto">
          {/* Variables Table */}
          <Card className={`bg-zinc-900 border-zinc-800 ${isCompact ? "p-2.5" : "p-3"}`}>
            <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-zinc-800 text-xs text-zinc-300 font-semibold">
              <Database className="w-3.5 h-3.5 text-accent" />
              <span>Scope Variables</span>
              {detailLevel === "compact" && (
                <span className="text-[10px] text-zinc-500 ml-auto font-mono">Compact</span>
              )}
            </div>
            {currentStep && Object.keys(currentStep.variables).length > 0 ? (
              <div className={`flex flex-col ${isCompact ? "gap-1" : "gap-1.5"}`}>
                {Object.entries(currentStep.variables).map(([key, v]) => (
                  <div
                    key={key}
                    className={`flex items-center justify-between rounded bg-zinc-950 border border-zinc-800/80 font-mono ${isCompact ? "p-1.5 text-[11px]" : "p-2 text-xs"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400">{v.type}</span>
                      <span className="text-zinc-200 font-medium">{v.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {v.previousValue && (
                        <span className="text-zinc-500 line-through text-[11px]">
                          {v.previousValue}
                        </span>
                      )}
                      <span className="text-accent font-semibold">
                        {v.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic">No variables declared in current step.</p>
            )}
          </Card>

          {/* Heap / Array Elements */}
          {currentStep && Object.keys(currentStep.heapObjects).length > 0 && (
            <Card className="p-3 bg-zinc-900 border-zinc-800">
              <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-zinc-800 text-xs text-zinc-300 font-semibold">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Heap & Array Mutations</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(currentStep.heapObjects).map(([id, heapObj]) => (
                  <div
                    key={id}
                    className="p-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono flex justify-between"
                  >
                    <span className="text-zinc-400">{id}:</span>
                    <span className="text-blue-300 font-semibold">
                      {String(heapObj.state?.value ?? "")}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Call Stack */}
          <Card className="p-3 bg-zinc-900 border-zinc-800">
            <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-zinc-800 text-xs text-zinc-300 font-semibold">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Call Stack</span>
            </div>
            {currentStep && currentStep.callStack.length > 0 ? (
              <div className="flex flex-col gap-1 text-xs font-mono text-zinc-300">
                {currentStep.callStack.map((frame, fIdx) => (
                  <div
                    key={fIdx}
                    className="p-1.5 rounded bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 truncate"
                  >
                    {frame.methodName}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic">Main execution frame</p>
            )}
          </Card>

          {/* Cumulative Standard Output */}
          <Card className="p-3 bg-zinc-900 border-zinc-800">
            <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-zinc-800 text-xs text-zinc-300 font-semibold">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>Synchronized Output</span>
            </div>
            <pre className="p-2 rounded bg-black/70 border border-zinc-800 font-mono text-xs text-zinc-200 min-h-[48px] whitespace-pre-wrap">
              {currentStep?.output || "(no output generated yet)"}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  );
}
