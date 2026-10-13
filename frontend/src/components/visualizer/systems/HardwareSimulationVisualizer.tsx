"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  TraceResponsePayload,
  BytecodeInstruction,
} from "@/lib/api/types";
import {
  generateSystemsSimulation,
  SystemsStepSnapshot,
} from "@/lib/visualizer/systemsSimulation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Cpu,
  Layers,
  Database,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Sparkles,
  Binary,
  Code,
  Box,
} from "lucide-react";

interface HardwareSimulationVisualizerProps {
  trace: TraceResponsePayload;
  sourceCode: string;
  bytecodeInstructions?: BytecodeInstruction[];
  currentStepIndex?: number;
  onStepChange?: (stepIndex: number) => void;
  className?: string;
}

export function HardwareSimulationVisualizer({
  trace,
  sourceCode,
  bytecodeInstructions = [],
  currentStepIndex: controlledStepIndex,
  onStepChange,
  className = "",
}: HardwareSimulationVisualizerProps) {
  const [internalStepIndex, setInternalStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"cpu_alu" | "stack_operand" | "heap_memory">("cpu_alu");
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stepIndex = controlledStepIndex !== undefined ? controlledStepIndex : internalStepIndex;

  const setStep = useCallback(
    (newIndex: number) => {
      const clamped = Math.max(0, Math.min(trace.steps.length - 1, newIndex));
      if (controlledStepIndex === undefined) {
        setInternalStepIndex(clamped);
      }
      onStepChange?.(clamped);
    },
    [controlledStepIndex, onStepChange, trace.steps.length]
  );

  // Generate systems simulation data once or when trace/bytecode changes
  const simulation = useMemo(() => {
    return generateSystemsSimulation(trace, bytecodeInstructions);
  }, [trace, bytecodeInstructions]);

  const currentSnapshot: SystemsStepSnapshot | undefined = simulation.steps[stepIndex];

  // Playback timer
  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      return;
    }

    playTimerRef.current = setInterval(() => {
      setStep(stepIndex + 1 >= trace.steps.length ? 0 : stepIndex + 1);
    }, 1200);

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, stepIndex, trace.steps.length, setStep]);

  const sourceLines = useMemo(() => sourceCode.split(/\r?\n/), [sourceCode]);

  if (!currentSnapshot) {
    return (
      <Card className="p-6 bg-zinc-900 border-zinc-800 text-center text-zinc-400">
        No execution simulation steps available for this program.
      </Card>
    );
  }

  const cycleNumber = stepIndex * 4 + 1;

  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {/* 1. Hardware Simulation Top Header & Controls */}
      <Card className="p-3 bg-zinc-900/95 border-zinc-800 flex flex-col gap-2.5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-accent shrink-0" />
            <span className="text-xs font-bold text-zinc-200 tracking-wide uppercase font-mono">
              Hardware & Computer Systems Simulator
            </span>
            <Badge variant="outline" size="sm">
              Cycle #{cycleNumber} of {simulation.totalCycles}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="neutral" size="sm">
              CPU Phase: {currentSnapshot.cpuPhase}
            </Badge>
            <Badge variant="success" size="sm">
              Zero-Fabrication Demarcation Active
            </Badge>
          </div>
        </div>

        {/* Step Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStep(0)}
              disabled={stepIndex === 0}
              title="Jump to Start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStep(stepIndex - 1)}
              disabled={stepIndex === 0}
              title="Step Backward"
            >
              <SkipBack className="w-3.5 h-3.5 mr-1" />
              Prev Step
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-indigo-600 hover:bg-indigo-500 font-medium"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 mr-1" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-1 fill-current" /> Play Cycles
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStep(stepIndex + 1)}
              disabled={stepIndex >= trace.steps.length - 1}
              title="Step Forward"
            >
              Next Step
              <SkipForward className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          {/* Scrubber slider */}
          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <input
              type="range"
              min={0}
              max={trace.steps.length - 1}
              value={stepIndex}
              onChange={(e) => setStep(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
            <span className="text-[11px] font-mono text-zinc-400 whitespace-nowrap">
              {stepIndex + 1} / {trace.steps.length}
            </span>
          </div>

          {/* Subsystem Panel Switcher */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab("cpu_alu")}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === "cpu_alu"
                  ? "bg-zinc-800 text-accent font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Cpu className="w-3 h-3" />
              <span>CPU & Registers</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("stack_operand")}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === "stack_operand"
                  ? "bg-zinc-800 text-indigo-400 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Stack & Operand</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("heap_memory")}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === "heap_memory"
                  ? "bg-zinc-800 text-emerald-400 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Database className="w-3 h-3" />
              <span>Heap Memory ({currentSnapshot.heapBlocks.length})</span>
            </button>
          </div>
        </div>
      </Card>

      {/* 2. Educational Systems Insight Banner */}
      <Card className="p-3 bg-zinc-900/90 border-zinc-800 flex flex-col gap-1.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold text-zinc-200">Hardware & JVM Execution Insight</span>
          </div>
          <span className="font-mono text-[11px] text-zinc-400">
            Source Line {currentSnapshot.sourceLine} • PC {currentSnapshot.programCounter}
          </span>
        </div>
        <p className="text-zinc-300 leading-relaxed font-mono text-[11px] bg-zinc-950 p-2 rounded border border-zinc-800/80">
          {currentSnapshot.systemsInsight}
        </p>
      </Card>

      {/* 3. Main Multi-Subsystem Simulation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Left Column: Synchronized Source Code & Current Opcode */}
        <Card className="lg:col-span-4 p-3 bg-zinc-900/90 border-zinc-800 flex flex-col gap-2">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
              <Code className="w-3.5 h-3.5 text-accent" />
              <span>Synchronized Source Code</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              Active: Line {currentSnapshot.sourceLine}
            </span>
          </div>

          <div className="font-mono text-xs bg-zinc-950 p-2 rounded-lg border border-zinc-800/80 max-h-[380px] overflow-y-auto">
            {sourceLines.map((lineText, idx) => {
              const lineNum = idx + 1;
              const isActive = currentSnapshot.sourceLine === lineNum;
              return (
                <div
                  key={lineNum}
                  onClick={() => {
                    const stepForLine = trace.steps.findIndex((s) => s.line === lineNum);
                    if (stepForLine >= 0) setStep(stepForLine);
                  }}
                  className={`flex items-start px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                    isActive
                      ? "bg-accent/25 border-l-2 border-accent text-accent font-semibold"
                      : "text-zinc-300 hover:bg-zinc-900/80"
                  }`}
                  title={`Line ${lineNum}`}
                >
                  <span className="w-6 text-right text-zinc-600 select-none mr-3 shrink-0">
                    {lineNum}
                  </span>
                  <span className="whitespace-pre">{lineText || " "}</span>
                </div>
              );
            })}
          </div>

          {/* Current Instruction Register Box */}
          <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 font-mono text-xs flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Instruction Register (IR):</span>
              <span className="text-accent font-semibold">PC = 0x{currentSnapshot.programCounter.toString(16).padStart(4, "0")}</span>
            </div>
            <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800 font-bold text-amber-300">
              {currentSnapshot.instructionRegister}
            </div>
          </div>
        </Card>

        {/* Right Column: Active Subsystem Panel */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          {/* TAB 1: CPU Core, ALU, & Conceptual Registers */}
          {activeTab === "cpu_alu" && (
            <div className="flex flex-col gap-3">
              {/* ALU Unit Box */}
              <Card className="p-3 bg-zinc-900/90 border-zinc-800 flex flex-col gap-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Binary className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-zinc-200">
                      Arithmetic Logic Unit (ALU)
                    </span>
                  </div>
                  {currentSnapshot.alu ? (
                    <Badge variant="success" size="sm">
                      ALU Active
                    </Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      ALU Idle / Data Movement
                    </Badge>
                  )}
                </div>

                {currentSnapshot.alu ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
                      <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 block">Operation</span>
                        <span className="font-semibold text-amber-300">{currentSnapshot.alu.op}</span>
                      </div>
                      <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 block">Operands</span>
                        <span className="font-semibold text-zinc-200">
                          {currentSnapshot.alu.operandA} {currentSnapshot.alu.operandB !== undefined ? `• ${currentSnapshot.alu.operandB}` : ""}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-zinc-950 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 block">Result</span>
                        <span className="font-bold text-emerald-400">{currentSnapshot.alu.result}</span>
                      </div>
                    </div>

                    {/* Flags */}
                    <div className="flex items-center gap-3 p-2 rounded bg-zinc-950 border border-zinc-800 text-[11px] font-mono">
                      <span className="text-zinc-500">Status Flags:</span>
                      <span className={`px-2 py-0.5 rounded ${currentSnapshot.alu.flags.zero ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-zinc-900 text-zinc-500"}`}>
                        ZF (Zero): {currentSnapshot.alu.flags.zero ? "1" : "0"}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${currentSnapshot.alu.flags.sign ? "bg-rose-950 text-rose-300 border border-rose-800" : "bg-zinc-900 text-zinc-500"}`}>
                        SF (Sign): {currentSnapshot.alu.flags.sign ? "1" : "0"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-400 font-mono">
                    Current instruction performs register/memory load or control jump. No mathematical ALU computation required for this cycle.
                  </div>
                )}
              </Card>

              {/* Conceptual Hardware Registers Grid */}
              <Card className="p-3 bg-zinc-900/90 border-zinc-800 flex flex-col gap-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-accent" />
                    <span className="text-xs font-semibold text-zinc-200">
                      Simulated CPU Register File
                    </span>
                  </div>
                  <Badge variant="outline" size="sm">
                    Conceptual Architecture Model
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {currentSnapshot.conceptualRegisters.map((reg) => (
                    <div
                      key={reg.name}
                      className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-accent">{reg.name}</span>
                        <span className="text-[9px] text-zinc-500">{reg.label}</span>
                      </div>
                      <span className="text-xs font-semibold text-zinc-100 truncate">
                        {reg.value}
                      </span>
                      <span className="text-[10px] text-zinc-500 mt-1 line-clamp-1" title={reg.role}>
                        {reg.role}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* TAB 2: JVM Stack Frames, LIFO Operand Stack & Local Variable Table */}
          {activeTab === "stack_operand" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* LIFO Operand Stack Visualizer */}
              <Card className="p-3 bg-zinc-900/90 border-zinc-800 flex flex-col gap-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>JVM Operand Stack (LIFO)</span>
                  </div>
                  <Badge variant="neutral" size="sm">
                    Depth: {currentSnapshot.activeFrame?.operandStack.length || 0}
                  </Badge>
                </div>

                <div className="flex flex-col-reverse gap-1.5 min-h-[160px] p-2 bg-zinc-950 rounded-lg border border-zinc-800/80 justify-start">
                  {currentSnapshot.activeFrame && currentSnapshot.activeFrame.operandStack.length > 0 ? (
                    currentSnapshot.activeFrame.operandStack.map((entry, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded border font-mono text-xs ${
                          entry.isTop
                            ? "bg-indigo-950/40 border-indigo-700 text-indigo-200 ring-1 ring-indigo-500"
                            : "bg-zinc-900 border-zinc-800 text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {entry.isTop && (
                            <span className="text-[10px] font-bold text-indigo-400">TOP →</span>
                          )}
                          <span className="font-semibold text-zinc-100">{entry.value}</span>
                        </div>
                        <Badge variant="outline" size="sm">
                          {entry.type}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-zinc-600 font-mono text-xs italic py-6">
                      Operand stack empty in current frame
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  LIFO pushdown stack used by JVM opcodes for intermediate evaluation.
                </span>
              </Card>

              {/* Local Variable Table (LVT) */}
              <Card className="p-3 bg-zinc-900/90 border-zinc-800 flex flex-col gap-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                    <Box className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Local Variable Table (LVT)</span>
                  </div>
                  <Badge variant="neutral" size="sm">
                    Slots: {currentSnapshot.activeFrame?.localSlots.length || 0}
                  </Badge>
                </div>

                <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                  {currentSnapshot.activeFrame && currentSnapshot.activeFrame.localSlots.length > 0 ? (
                    currentSnapshot.activeFrame.localSlots.map((slot) => (
                      <div
                        key={slot.slot}
                        className="flex items-center justify-between p-2 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-zinc-900 text-zinc-400 text-[10px] flex items-center justify-center font-bold">
                            #{slot.slot}
                          </span>
                          <span className="font-semibold text-zinc-100">{slot.name}</span>
                          <span className="text-zinc-500 text-[10px]">({slot.type})</span>
                        </div>
                        <span className="text-emerald-400 font-semibold">{slot.value}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-zinc-600 font-mono text-xs py-4">
                      No local variables allocated
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* TAB 3: Heap Memory Blocks & Object References */}
          {activeTab === "heap_memory" && (
            <Card className="p-3 bg-zinc-900/90 border-zinc-800 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-zinc-200">
                    Dynamic Heap Memory Space (64-bit Aligned Blocks)
                  </span>
                </div>
                <Badge variant="outline" size="sm">
                  {currentSnapshot.heapBlocks.length} Active Object Allocations
                </Badge>
              </div>

              {currentSnapshot.heapBlocks.length > 0 ? (
                <div className="space-y-3">
                  {currentSnapshot.heapBlocks.map((block) => (
                    <div
                      key={block.id}
                      className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col gap-2 font-mono text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-900">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold">{block.addressLabel}</span>
                          <Badge variant="default" size="sm">
                            {block.type}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-zinc-400">
                          {block.sizeBytes} bytes (8-byte aligned)
                        </span>
                      </div>

                      {/* Object Header */}
                      <div className="p-2 rounded bg-zinc-900/80 border border-zinc-800/80 text-[11px] space-y-1">
                        <span className="text-[10px] text-zinc-500 block uppercase font-semibold">
                          JVM Object Header (12 Bytes)
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Mark Word (64-bit):</span>
                          <span className="text-zinc-200">{block.header.markWord}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Klass Word (32-bit compressed):</span>
                          <span className="text-zinc-200">{block.header.klassWord}</span>
                        </div>
                      </div>

                      {/* Instance Fields */}
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                          Instance Data Fields
                        </span>
                        {Object.entries(block.fields).length > 0 ? (
                          <div className="grid grid-cols-2 gap-1.5">
                            {Object.entries(block.fields).map(([fieldName, fieldVal]) => (
                              <div
                                key={fieldName}
                                className="p-1.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between text-[11px]"
                              >
                                <span className="text-zinc-400">{fieldName}:</span>
                                <span className="text-zinc-100 font-semibold">{fieldVal}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-zinc-600 italic text-[11px]">No instance fields</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500 font-mono text-xs flex flex-col items-center justify-center gap-1.5">
                  <Database className="w-8 h-8 text-zinc-700 mb-1" />
                  <span>No Heap Objects Allocated In This Execution Step</span>
                  <span className="text-[11px] text-zinc-600 max-w-sm">
                    This step uses primitive types stored entirely in stack frame local variable slots.
                  </span>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
