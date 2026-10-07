"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { TraceVisualizer } from "@/components/visualizer/TraceVisualizer";
import { AlgorithmVisualizer } from "@/components/visualizer/AlgorithmVisualizer";
import { traceApi } from "@/lib/api/trace";
import { TraceResponsePayload } from "@/lib/api/types";
import {
  AlgorithmMetadata,
  AlgorithmTraceResponse,
  fetchAlgorithms,
  generateAlgorithmTrace,
} from "@/lib/api/algorithm";
import { FALLBACK_ALGORITHMS } from "@/lib/data/algorithmData";
import {
  Play,
  Sparkles,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Terminal,
} from "lucide-react";

const DEFAULT_JAVA_CODE = `public class Main {
    public static void main(String[] args) {
        int a = 10;
        int b = 25;
        int sum = a + b;
        System.out.println("Computed Sum: " + sum);

        int[] arr = new int[3];
        arr[0] = 5;
        arr[1] = 15;
        arr[2] = 25;
        System.out.println("Array Initialized");
    }
}`;

function VisualizeContent() {
  const searchParams = useSearchParams();
  const initialAlgoSlug = searchParams.get("algorithm") || "bubble-sort";
  const initialMode = searchParams.get("mode") === "trace" ? "trace" : "algorithm";

  // Visualizer Mode
  const [activeMode, setActiveMode] = useState<"algorithm" | "trace">(initialMode);

  // -------------------------------------------------------------
  // Algorithm Visualizer State
  // -------------------------------------------------------------
  const [algorithms, setAlgorithms] = useState<AlgorithmMetadata[]>(FALLBACK_ALGORITHMS);
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmMetadata>(FALLBACK_ALGORITHMS[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [algoTrace, setAlgoTrace] = useState<AlgorithmTraceResponse | null>(null);
  const [isAlgoLoading, setIsAlgoLoading] = useState<boolean>(false);
  const [algoError, setAlgoError] = useState<string | null>(null);

  // -------------------------------------------------------------
  // JVM Program Tracer State
  // -------------------------------------------------------------
  const [sourceCode, setSourceCode] = useState<string>(DEFAULT_JAVA_CODE);
  const [isJvmLoading, setIsJvmLoading] = useState<boolean>(false);
  const [jvmTrace, setJvmTrace] = useState<TraceResponsePayload | null>(null);
  const [jvmError, setJvmError] = useState<string | null>(null);

  // Load algorithm catalogue
  useEffect(() => {
    let isMounted = true;
    fetchAlgorithms()
      .then((data) => {
        if (!isMounted || !data || data.length === 0) return;
        setAlgorithms(data);
        const match = data.find((a) => a.slug === initialAlgoSlug) || data[0];
        setSelectedAlgo(match);
      })
      .catch(() => {
        // Fallback already pre-set
        const match =
          FALLBACK_ALGORITHMS.find((a) => a.slug === initialAlgoSlug) ||
          FALLBACK_ALGORITHMS[0];
        setSelectedAlgo(match);
      });

    return () => {
      isMounted = false;
    };
  }, [initialAlgoSlug]);

  // Load trace for selected algorithm
  useEffect(() => {
    let isMounted = true;
    generateAlgorithmTrace(
      selectedAlgo.slug,
      selectedAlgo.defaultInput,
      selectedAlgo.defaultTarget
    )
      .then((traceRes) => {
        if (!isMounted) return;
        setAlgoTrace(traceRes);
        setAlgoError(null);
        setIsAlgoLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setAlgoError(
          err instanceof Error
            ? err.message
            : "Failed to load algorithm trace simulation"
        );
        setIsAlgoLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedAlgo]);

  const handleCustomSimulate = async (input: number[], target?: number) => {
    setIsAlgoLoading(true);
    setAlgoError(null);
    try {
      const traceRes = await generateAlgorithmTrace(
        selectedAlgo.slug,
        input,
        target !== undefined ? target : selectedAlgo.defaultTarget
      );
      setAlgoTrace(traceRes);
    } catch (err: unknown) {
      setAlgoError(
        err instanceof Error ? err.message : "Failed to simulate custom parameters"
      );
    } finally {
      setIsAlgoLoading(false);
    }
  };

  // Handle JVM execution trace
  const handleRunJvmTrace = async () => {
    setIsJvmLoading(true);
    setJvmError(null);
    try {
      const response = await traceApi.trace({
        language: "java",
        sourceCode: sourceCode,
      });

      if (!response.success && response.status === "COMPILATION_ERROR") {
        const diagMsg =
          response.diagnostics?.[0]?.explanation?.simpleExplanation ||
          response.diagnostics?.[0]?.message ||
          "Compilation failed before execution.";
        setJvmError(diagMsg);
        setJvmTrace(null);
      } else {
        setJvmTrace(response);
      }
    } catch (err: unknown) {
      setJvmError(
        err instanceof Error
          ? err.message
          : "Failed to generate JVM execution trace"
      );
      setJvmTrace(null);
    } finally {
      setIsJvmLoading(false);
    }
  };

  const filteredAlgorithms = algorithms.filter(
    (a) => selectedCategory === "ALL" || a.category === selectedCategory
  );

  return (
    <AppShell>
      <PageContainer>
        <PageHeader
          title="Code & Algorithm Visualization"
          description="Understand what happens behind your Java code: watch classic sorting & searching algorithms step through arrays or inspect JVM runtime variables line-by-line."
          badge={
            <Badge variant="success" size="sm" dot>
              {activeMode === "algorithm"
                ? "Algorithm Simulator"
                : "Authentic JVM Tracer"}
            </Badge>
          }
        />

        {/* Top Visualizer Mode Switcher */}
        <div className="flex items-center gap-2 mb-6 border-b border-zinc-800 pb-3">
          <Button
            variant={activeMode === "algorithm" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveMode("algorithm")}
            className={
              activeMode === "algorithm"
                ? "bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }
          >
            <BarChart3 className="w-4 h-4 mr-1.5" />
            Algorithm Visualizer
          </Button>

          <Button
            variant={activeMode === "trace" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveMode("trace")}
            className={
              activeMode === "trace"
                ? "bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }
          >
            <Terminal className="w-4 h-4 mr-1.5" />
            JVM Program Tracer
          </Button>
        </div>

        {/* MODE 1: Algorithm Visualizer */}
        {activeMode === "algorithm" && (
          <div className="space-y-6">
            {/* Category Filter Pills & Algorithm Selector */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {(["ALL", "SORTING", "SEARCHING", "TWO_POINTERS", "DATA_STRUCTURES"] as const).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                          : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-900"
                      }`}
                    >
                      {cat === "ALL" ? "All Archetypes" : cat.replace(/_/g, " ")}
                    </button>
                  )
                )}
              </div>

              {/* Algorithm Quick Select dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400">Algorithm:</span>
                <select
                  value={selectedAlgo?.slug || ""}
                  onChange={(e) => {
                    const match = algorithms.find((a) => a.slug === e.target.value);
                    if (match) setSelectedAlgo(match);
                  }}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-zinc-700"
                >
                  {filteredAlgorithms.map((a) => (
                    <option key={a.slug} value={a.slug}>
                      {a.name} ({a.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Algorithm Selector Horizontal Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {filteredAlgorithms.map((algo) => {
                const isSelected = selectedAlgo?.slug === algo.slug;
                return (
                  <button
                    key={algo.slug}
                    type="button"
                    onClick={() => setSelectedAlgo(algo)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-indigo-600/10 border-indigo-500 shadow-md shadow-indigo-950/20"
                        : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800/40 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-zinc-400">
                        {algo.category}
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-amber-400">
                        {algo.timeComplexityAverage}
                      </span>
                    </div>
                    <div
                      className={`text-sm font-semibold truncate ${
                        isSelected ? "text-indigo-300" : "text-zinc-200"
                      }`}
                    >
                      {algo.name}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Error or Loading state */}
            {algoError && (
              <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-800/80 rounded-lg text-red-200 text-sm">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{algoError}</span>
              </div>
            )}

            {isAlgoLoading && !algoTrace ? (
              <LoadingState message="Generating algorithm trace steps..." />
            ) : algoTrace ? (
              <AlgorithmVisualizer
                key={`${selectedAlgo.slug}-${algoTrace.totalSteps}`}
                algorithm={selectedAlgo}
                trace={algoTrace}
                isSimulating={isAlgoLoading}
                onCustomSimulate={handleCustomSimulate}
              />
            ) : null}
          </div>
        )}

        {/* MODE 2: JVM Program Tracer (Line-by-line Child JVM) */}
        {activeMode === "trace" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">
                  JVM Line-by-Line Execution Tracer
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Type any custom Java program to compile and trace internal variable mutations.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRunJvmTrace}
                disabled={isJvmLoading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
              >
                {isJvmLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Play className="w-4 h-4 fill-current mr-1.5" />
                )}
                {isJvmLoading ? "Tracing JVM..." : "Generate Execution Trace"}
              </Button>
            </div>

            {jvmError && (
              <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-800/80 rounded-lg text-red-200 text-sm">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{jvmError}</span>
              </div>
            )}

            {jvmTrace && jvmTrace.steps && jvmTrace.steps.length > 0 ? (
              <div className="flex flex-col gap-6">
                <TraceVisualizer trace={jvmTrace} sourceCode={sourceCode} />
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setJvmTrace(null)}
                  >
                    Edit Source Code
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 flex flex-col gap-3">
                  <Card className="flex flex-col flex-1 bg-zinc-950 border-zinc-800">
                    <CardHeader className="py-2.5 px-4 border-b border-zinc-800 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Java Program to Trace</span>
                      </div>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        Main.java
                      </span>
                    </CardHeader>
                    <CardContent className="p-0">
                      <textarea
                        value={sourceCode}
                        onChange={(e) => setSourceCode(e.target.value)}
                        rows={14}
                        className="w-full bg-zinc-950 font-mono text-xs text-zinc-200 p-4 outline-none resize-none leading-relaxed"
                        placeholder="Enter Java source code..."
                      />
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-4">
                  <Card className="p-4 bg-zinc-900 border-zinc-800 text-xs flex flex-col gap-2">
                    <h4 className="font-semibold text-zinc-200">
                      Authentic Execution Intelligence
                    </h4>
                    <p className="text-zinc-400 leading-relaxed">
                      CodeVista never renders fake mock animations. The source code is compiled with OpenJDK and executed in an isolated child JVM sandbox.
                    </p>
                  </Card>

                  <Card className="p-4 bg-zinc-900 border-zinc-800 text-xs flex flex-col gap-2">
                    <h4 className="font-semibold text-zinc-200">What You Can Inspect:</h4>
                    <ul className="text-zinc-400 list-disc list-inside space-y-1">
                      <li>Variable declarations & mutation values</li>
                      <li>Array indexing and element assignments</li>
                      <li>Call stack frames and method depth</li>
                      <li>Step-by-step console output sync</li>
                    </ul>
                  </Card>
                </div>
              </div>
            )}
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}

export default function VisualizePage() {
  return (
    <Suspense fallback={<LoadingState message="Initializing visualizer..." />}>
      <VisualizeContent />
    </Suspense>
  );
}
