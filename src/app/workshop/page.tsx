"use client";

import { useState, useCallback, useEffect } from "react";
import WorkspaceHeader from "@/components/WorkspaceHeader";
import Editor from "@/components/Editor";
import AnalysisPanel from "@/components/AnalysisPanel";
import ControlBar from "@/components/ControlBar";
import ExampleLoader from "@/components/ExampleLoader";
import LearningModeToggle from "@/components/LearningModeToggle";
import { CompileResponse, CompilationStatus, ExecutionStep } from "@/lib/types";
import { compileJava } from "@/lib/api";
import { ALGORITHM_EXAMPLES } from "@/data/examples";

const DEFAULT_CODE = ALGORITHM_EXAMPLES[0].code;

export default function WorkshopPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [status, setStatus] = useState<CompilationStatus>("idle");
  const [result, setResult] = useState<CompileResponse | null>(null);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [activeStepLine, setActiveStepLine] = useState<number | null>(null);
  const [learningMode, setLearningMode] = useState<boolean>(true);
  const [fileName, setFileName] = useState("Main.java");

  const errorLine = result && !result.success ? result.lineNumber : null;

  const runCode = useCallback(async () => {
    setStatus("compiling");
    setResult(null);
    setIsVisualizing(false);
    setExecutionSteps([]);
    setActiveStepLine(null);

    try {
      const response = await compileJava(code);
      setResult(response);
      setStatus(response.success ? "success" : "error");

      if (response.success) {
        setExecutionSteps(response.executionSteps ?? []);
      }
    } catch {
      setResult({
        success: false,
        message: "Backend connection failed",
        error:
          "Could not connect to the Java compiler backend.\n\nMake sure the Spring Boot backend is running on port 8080.",
        explanation:
          "CodeVista could not communicate with the Java compiler backend.",
        lineNumber: 0,
        suggestion:
          "Start the Spring Boot backend using: cd backend/codevista-backend && ./mvnw spring-boot:run",
        output: null,
      });
      setStatus("error");
    }
  }, [code]);

  const handleVisualize = useCallback(() => {
    if (result?.success && executionSteps.length > 0) {
      setIsVisualizing(true);
    }
  }, [result, executionSteps]);

  const handleStopVisualize = useCallback(() => {
    setIsVisualizing(false);
    setActiveStepLine(null);
  }, []);

  const handleReset = useCallback(() => {
    setCode(DEFAULT_CODE);
    setResult(null);
    setStatus("idle");
    setIsVisualizing(false);
    setExecutionSteps([]);
    setActiveStepLine(null);
  }, []);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    setResult(null);
    setStatus("idle");
    setIsVisualizing(false);
    setExecutionSteps([]);
    setActiveStepLine(null);
  }, []);

  const handleStepChange = useCallback((step: ExecutionStep) => {
    setActiveStepLine(step.lineNumber);
  }, []);

  const handleLoadExample = useCallback((exampleCode: string) => {
    setCode(exampleCode);
    setResult(null);
    setStatus("idle");
    setIsVisualizing(false);
    setExecutionSteps([]);
    setActiveStepLine(null);
    setFileName("Main.java");
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (status !== "compiling") {
          runCode();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [runCode, status]);

  // Listen for custom run event from Monaco editor
  useEffect(() => {
    const handleRunEvent = () => {
      if (status !== "compiling") {
        runCode();
      }
    };
    window.addEventListener("codevista-run", handleRunEvent);
    return () => window.removeEventListener("codevista-run", handleRunEvent);
  }, [runCode, status]);

  const canVisualize = result?.success === true && executionSteps.length > 0;

  return (
    <div className="flex h-screen flex-col bg-[#06090f] text-white">
      {/* Subtle background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-0 h-[400px] w-[400px] rounded-full bg-blue-500/[0.02] blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-purple-500/[0.02] blur-[80px]" />
      </div>

      <div className="relative z-10 flex h-screen flex-col">
        <WorkspaceHeader />

        {/* File tab bar */}
        <div className="glass-surface flex items-center justify-between border-b border-white/[0.04]">
          <div className="flex items-center">
            <div className="flex items-center gap-2.5 border-r border-white/[0.06] bg-[#06090f]/60 px-5 py-2.5">
              <div className="h-2 w-2 rounded-full bg-blue-400 shadow-sm shadow-blue-400/30" />
              <span className="text-[13px] font-medium text-zinc-300">
                {fileName}
              </span>
              <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-600">
                {code.split("\n").length} lines
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4">
            <ExampleLoader onLoad={handleLoadExample} />
            <LearningModeToggle
              learningMode={learningMode}
              onToggle={() => setLearningMode(!learningMode)}
            />
          </div>
        </div>

        {/* Main content - editor + analysis panel */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Editor */}
          <div className="relative min-h-[300px] min-w-0 flex-1 flex-col border-b border-white/[0.04] md:min-h-0 md:border-b-0 md:border-r">
            <Editor
              code={code}
              onChange={handleCodeChange}
              errorLine={errorLine}
              activeLine={isVisualizing ? activeStepLine : null}
            />
          </div>

          {/* Analysis panel */}
          <div className="panel-3d flex w-full min-w-0 flex-col md:w-[440px] md:min-w-[340px]">
            <div className="flex items-center border-b border-white/[0.04] px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                <span className="text-[12px] font-semibold uppercase tracking-wider text-zinc-400">
                  CodeVista Analysis
                </span>
              </div>
              {status === "compiling" && (
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
                  <span className="text-[11px] text-blue-400">Compiling...</span>
                </div>
              )}
              {status === "success" && result && (
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] text-emerald-400">Success</span>
                </div>
              )}
              {status === "error" && (
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  <span className="text-[11px] text-red-400">Error</span>
                </div>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <AnalysisPanel
                status={status}
                result={result}
                isVisualizing={isVisualizing}
                executionSteps={executionSteps}
                onStepChange={handleStepChange}
                learningMode={learningMode}
              />
            </div>
          </div>
        </div>

        {/* Control bar */}
        <ControlBar
          status={status}
          canVisualize={canVisualize}
          isVisualizing={isVisualizing}
          onRun={runCode}
          onVisualize={handleVisualize}
          onReset={handleReset}
          onStopVisualize={handleStopVisualize}
        />
      </div>
    </div>
  );
}
