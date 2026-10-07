"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import NextLink from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/context/AuthContext";
import { compilerApi } from "@/lib/api/compiler";
import { executionApi } from "@/lib/api/execution";
import {
  CompileResponsePayload,
  ExecuteResponsePayload,
  CompilerDiagnostic,
} from "@/lib/api/types";
import {
  Play,
  RotateCcw,
  Cpu,
  Terminal,
  AlertCircle,
  FileCode,
  CheckCircle2,
  Clock,
  Keyboard,
  WrapText,
  Map as MapIcon,
  Sparkles,
  Layers,
  Send,
} from "lucide-react";

const DEFAULT_JAVA_CODE = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, CodeVista AI!");
        
        int sum = 0;
        for (int i = 1; i <= 5; i++) {
            sum += i;
            System.out.println("i=" + i + ", running sum=" + sum);
        }
        
        System.out.println("Final Calculated Sum: " + sum);
    }
}`;

export default function WorkspacePage() {
  const { preferences, updatePreferences } = useAuth();

  const [sourceCode, setSourceCode] = useState<string>(DEFAULT_JAVA_CODE);
  const [stdinInput, setStdinInput] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecuteResponsePayload | null>(null);
  const [compileResult, setCompileResult] = useState<CompileResponsePayload | null>(null);
  const [activeTab, setActiveTab] = useState<"stdout" | "stdin" | "diagnostics">("stdout");
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Line wrapping and minimap settings from user preferences
  const fontSize = preferences?.fontSize || 14;
  const tabSize = preferences?.tabSize || 4;
  const isLineWrapping = preferences?.lineWrapping !== false;
  const showMinimap = preferences?.minimap || false;
  const isAutoRun = preferences?.autoRunEnabled || false;

  // Split lines for line numbering
  const lineCount = Math.max(1, sourceCode.split("\n").length);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  // Run Code Action
  const handleRun = async () => {
    setIsRunning(true);
    setErrorStatus(null);
    try {
      const res = await executionApi.execute({
        language: "JAVA",
        sourceCode,
        input: stdinInput,
      });
      setExecutionResult(res);
      if (res.diagnostics && res.diagnostics.length > 0) {
        setActiveTab("diagnostics");
      } else {
        setActiveTab("stdout");
      }
    } catch (err: unknown) {
      setErrorStatus(err instanceof Error ? err.message : "Execution failed.");
      setActiveTab("stdout");
    } finally {
      setIsRunning(false);
    }
  };

  // Compile Only Action
  const handleCompile = useCallback(async () => {
    setIsCompiling(true);
    setErrorStatus(null);
    try {
      const res = await compilerApi.compile({
        language: "JAVA",
        sourceCode,
      });
      setCompileResult(res);
      if (res.diagnostics && res.diagnostics.length > 0) {
        setActiveTab("diagnostics");
      }
    } catch (err: unknown) {
      setErrorStatus(err instanceof Error ? err.message : "Compilation failed.");
    } finally {
      setIsCompiling(false);
    }
  }, [sourceCode]);

  // Debounced auto-run compilation if autoRunEnabled
  useEffect(() => {
    if (!isAutoRun) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      handleCompile();
    }, 1500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [sourceCode, isAutoRun, handleCompile]);

  const handleReset = () => {
    setSourceCode(DEFAULT_JAVA_CODE);
    setExecutionResult(null);
    setCompileResult(null);
    setErrorStatus(null);
  };

  // Intercept Tab key to indent cleanly with user-configured spaces
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const spaces = " ".repeat(tabSize);
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newCode =
        sourceCode.substring(0, start) + spaces + sourceCode.substring(end);
      setSourceCode(newCode);

      // Re-position cursor after inserted indentation
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
      }, 0);
    }
  };

  const allDiagnostics: CompilerDiagnostic[] = [
    ...(executionResult?.diagnostics || []),
    ...(compileResult?.diagnostics || []),
  ];

  return (
    <AppShell>
      <div className="p-4 sm:p-6 lg:p-8 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Workspace Toolbar Header */}
        <PageHeader
          title="IDE Workspace"
          description="Interactive Java compilation, step tracing, and diagnostic analysis."
          badge={
            <Badge
              variant={
                isRunning
                  ? "warning"
                  : executionResult?.success
                  ? "success"
                  : "default"
              }
              size="sm"
              dot
            >
              {isRunning
                ? "Running..."
                : isCompiling
                ? "Compiling..."
                : executionResult?.success
                ? "Success"
                : "Ready"}
            </Badge>
          }
          actions={
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-mono text-zinc-400">
                <Cpu className="w-3.5 h-3.5 text-accent" />
                <span>Java 25 (OpenJDK)</span>
              </div>

              {/* Step Trace Shortcut */}
              <NextLink href={`/visualize?mode=trace`}>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Layers className="w-3.5 h-3.5 text-accent" />}
                  title="Visualize memory in Step Tracer"
                >
                  Step Trace
                </Button>
              </NextLink>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleReset}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleRun}
                disabled={isRunning}
                isLoading={isRunning}
                leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
              >
                Run Code
              </Button>
            </div>
          }
        />

        {/* Workspace Multi-Panel Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
          {/* Main Editor Panel */}
          <div className="lg:col-span-8 flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/80 overflow-hidden shadow-xs">
            {/* Editor Sub-Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/60 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-accent" />
                <span className="text-zinc-200 font-medium">Main.java</span>
                <span className="text-[11px] text-zinc-500">• {lineCount} lines</span>
              </div>

              {/* Editor Toggles / Info */}
              <div className="flex items-center gap-3 text-[11px]">
                <button
                  type="button"
                  onClick={() => updatePreferences({ lineWrapping: !isLineWrapping })}
                  className={`flex items-center gap-1 transition-colors cursor-pointer ${
                    isLineWrapping ? "text-accent font-semibold" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                  title="Toggle Soft Line Wrapping"
                >
                  <WrapText className="w-3 h-3" />
                  <span>Wrap</span>
                </button>

                <button
                  type="button"
                  onClick={() => updatePreferences({ minimap: !showMinimap })}
                  className={`flex items-center gap-1 transition-colors cursor-pointer ${
                    showMinimap ? "text-accent font-semibold" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                  title="Toggle Code Minimap Rail"
                >
                  <MapIcon className="w-3 h-3" />
                  <span>Minimap</span>
                </button>

                <span className="text-zinc-600">|</span>
                <span className="text-zinc-500 font-mono">{fontSize}px</span>
                <span className="text-zinc-500 font-mono">Tab: {tabSize}</span>
              </div>
            </div>

            {/* Editor Surface */}
            <div className="flex-1 flex overflow-hidden bg-zinc-950">
              {/* Line Numbers Gutter */}
              <div className="w-12 py-3 bg-zinc-950/90 border-r border-zinc-900 text-right pr-3 select-none font-mono text-zinc-600 overflow-hidden">
                {lineNumbers.map((num) => (
                  <div
                    key={num}
                    style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
                  >
                    {num}
                  </div>
                ))}
              </div>

              {/* Code Textarea */}
              <div className="flex-1 relative overflow-auto">
                <textarea
                  ref={textareaRef}
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  spellCheck={false}
                  className={`w-full h-full bg-transparent text-zinc-100 font-mono p-3 outline-none resize-none leading-[1.6] ${
                    isLineWrapping ? "whitespace-pre-wrap" : "whitespace-pre overflow-x-auto"
                  }`}
                  style={{
                    fontSize: `${fontSize}px`,
                    tabSize: tabSize,
                  }}
                  placeholder="// Write your Java code here..."
                />
              </div>

              {/* Minimap Preview Rail */}
              {showMinimap && (
                <div
                  className="w-24 bg-zinc-950/90 border-l border-zinc-900/80 p-2 overflow-hidden select-none pointer-events-none opacity-45 hidden md:block"
                  aria-hidden="true"
                >
                  <pre
                    className="font-mono text-[4px] leading-[5px] text-zinc-500 overflow-hidden truncate"
                    style={{ tabSize: 2 }}
                  >
                    {sourceCode}
                  </pre>
                </div>
              )}
            </div>

            {/* Editor Footer Status Bar */}
            <div className="px-4 py-1.5 bg-zinc-900/60 border-t border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Keyboard className="w-3 h-3 text-zinc-500" />
                  <span>Tab Indent: {tabSize} spaces</span>
                </span>
                {isAutoRun && (
                  <span className="text-accent flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Auto-compile on
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span>JDK 25.0 LTS</span>
              </div>
            </div>
          </div>

          {/* Right Inspection Stack: Diagnostics, Console, & Stdin */}
          <div className="lg:col-span-4 flex flex-col gap-4 overflow-hidden">
            {/* Panel Tabs Header */}
            <div className="flex items-center border-b border-zinc-800 bg-zinc-900/80 rounded-t-xl px-2 pt-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("stdout")}
                className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "stdout"
                    ? "bg-zinc-950 text-accent border-t-2 border-accent"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Console Output</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("stdin")}
                className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "stdin"
                    ? "bg-zinc-950 text-accent border-t-2 border-accent"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Standard Input</span>
                {stdinInput.trim() && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("diagnostics")}
                className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "diagnostics"
                    ? "bg-zinc-950 text-accent border-t-2 border-accent"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Diagnostics</span>
                {allDiagnostics.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono">
                    {allDiagnostics.length}
                  </span>
                )}
              </button>
            </div>

            {/* Panel Content Body */}
            <div className="flex-1 flex flex-col rounded-b-xl border border-t-0 border-zinc-800 bg-zinc-950 overflow-hidden shadow-xs">
              {/* STDOUT TAB */}
              {activeTab === "stdout" && (
                <div className="flex-1 flex flex-col p-3 overflow-hidden">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-900 text-[11px] font-mono text-zinc-400">
                    <span className="text-zinc-500">stdout & stderr stream</span>
                    {executionResult && (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-zinc-400">
                          <Clock className="w-3 h-3 text-accent" />
                          {executionResult.executionTimeMs}ms
                        </span>
                        <span
                          className={`font-semibold ${
                            executionResult.exitCode === 0
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }`}
                        >
                          exit: {executionResult.exitCode}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-auto font-mono text-xs p-2 bg-black/60 rounded-lg border border-zinc-900">
                    {errorStatus ? (
                      <div className="text-rose-400 font-mono">
                        Error: {errorStatus}
                      </div>
                    ) : executionResult ? (
                      <div>
                        {executionResult.output && (
                          <pre className="text-zinc-200 whitespace-pre-wrap leading-relaxed">
                            {executionResult.output}
                          </pre>
                        )}
                        {executionResult.runtimeError && (
                          <pre className="text-rose-400 whitespace-pre-wrap mt-2">
                            {executionResult.runtimeError}
                          </pre>
                        )}
                        {!executionResult.output && !executionResult.runtimeError && (
                          <span className="text-zinc-500 italic">
                            (Program terminated successfully with empty output)
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 text-xs py-8">
                        <Terminal className="w-8 h-8 text-zinc-700 mb-2" />
                        <p className="text-zinc-400 font-medium">Ready to compile & run</p>
                        <p className="text-zinc-600 text-[11px] mt-1 max-w-xs">
                          Click &ldquo;Run Code&rdquo; above to execute against genuine OpenJDK 25.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STDIN TAB */}
              {activeTab === "stdin" && (
                <div className="flex-1 flex flex-col p-3 overflow-hidden">
                  <div className="pb-2 mb-2 border-b border-zinc-900">
                    <label className="text-xs font-medium text-zinc-300 block mb-1">
                      Standard Input (System.in)
                    </label>
                    <p className="text-[11px] text-zinc-500">
                      Provide input lines for Scanner or BufferedReader calls.
                    </p>
                  </div>
                  <textarea
                    value={stdinInput}
                    onChange={(e) => setStdinInput(e.target.value)}
                    placeholder="Enter input here (one value or line per entry)..."
                    rows={8}
                    className="flex-1 w-full p-2.5 rounded-lg bg-black/60 border border-zinc-900 text-xs font-mono text-zinc-200 outline-none resize-none focus:border-accent"
                  />
                </div>
              )}

              {/* DIAGNOSTICS TAB */}
              {activeTab === "diagnostics" && (
                <div className="flex-1 p-3 overflow-y-auto space-y-3">
                  {allDiagnostics.length > 0 ? (
                    allDiagnostics.map((diag, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-zinc-900/80 border border-rose-500/30 text-xs"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-rose-400 font-bold">
                            Line {diag.line}:{diag.column}
                          </span>
                          <Badge variant="danger" size="sm">
                            {diag.diagnosticType}
                          </Badge>
                        </div>
                        <p className="font-mono text-zinc-200 text-xs mb-2">
                          {diag.message}
                        </p>

                        {/* Pedagogical Explanation */}
                        {diag.explanation && (
                          <div className="mt-2.5 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] space-y-1.5">
                            <div>
                              <span className="text-zinc-400 font-medium">Why it happened: </span>
                              <span className="text-zinc-300">
                                {diag.explanation.whyItHappened}
                              </span>
                            </div>
                            <div>
                              <span className="text-emerald-400 font-medium">How to fix: </span>
                              <span className="text-emerald-300">
                                {diag.explanation.howToFix}
                              </span>
                            </div>
                            {diag.explanation.suggestion && (
                              <div className="p-1.5 rounded bg-emerald-950/30 border border-emerald-500/20 text-emerald-200 font-mono text-[10px]">
                                {diag.explanation.suggestion}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 text-xs py-8">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                      <p className="text-zinc-300 font-medium">No diagnostics found</p>
                      <p className="text-zinc-600 text-[11px] mt-1 max-w-xs">
                        Your Java code passed syntactic and semantic compiler checks cleanly.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
