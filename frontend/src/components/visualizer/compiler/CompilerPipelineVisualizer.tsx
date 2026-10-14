"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CompilerPipelineResponsePayload,
  CompilerStageType,
  AstNode,
} from "@/lib/api/types";
import { compilerPipelineApi } from "@/lib/api/compilerPipeline";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  FileCode,
  Binary,
  GitFork,
  Table,
  Cpu,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Search,
  Code,
  Layers,
  ArrowRight,
} from "lucide-react";

interface CompilerPipelineVisualizerProps {
  sourceCode: string;
  className?: string;
  language?: string;
  onSelectSourceLine?: (lineNumber: number) => void;
  classNameOverride?: string;
}

export function CompilerPipelineVisualizer({
  sourceCode,
  className = "Main",
  language = "JAVA",
  onSelectSourceLine,
  classNameOverride = "",
}: CompilerPipelineVisualizerProps) {
  const [activeStage, setActiveStage] = useState<CompilerStageType>("LEXICAL_ANALYSIS");
  const [pipelineData, setPipelineData] = useState<CompilerPipelineResponsePayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cross-stage synchronization state
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(null);
  const [selectedAstNodeId, setSelectedAstNodeId] = useState<string | null>(null);
  const [tokenFilter, setTokenFilter] = useState<string>("ALL");
  const [showRawBytecode, setShowRawBytecode] = useState<boolean>(false);
  const [bytecodeSearch, setBytecodeSearch] = useState<string>("");

  // Fetch pipeline analysis callback for manual retry
  const handleFetch = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await compilerPipelineApi.inspectPipeline({
        sourceCode,
        className,
        language,
      });
      setPipelineData(res);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to analyze compiler pipeline.");
    } finally {
      setIsLoading(false);
    }
  }, [sourceCode, className, language]);

  useEffect(() => {
    let cancelled = false;
    compilerPipelineApi
      .inspectPipeline({ sourceCode, className, language })
      .then((res) => {
        if (!cancelled) {
          setPipelineData(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : "Failed to load compiler pipeline.");
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [sourceCode, className, language]);

  const sourceLines = useMemo(() => sourceCode.split(/\r?\n/), [sourceCode]);

  const handleLineClick = (lineNum: number) => {
    setHighlightedLine(lineNum);
    onSelectSourceLine?.(lineNum);
  };

  const activeStageInfo = useMemo(() => {
    if (!pipelineData) return null;
    return pipelineData.stages.find((s) => s.stage === activeStage) || pipelineData.stages[0];
  }, [pipelineData, activeStage]);

  // Filtered tokens
  const filteredTokens = useMemo(() => {
    if (!pipelineData) return [];
    return pipelineData.tokens.filter((t) => {
      if (highlightedLine !== null && t.line !== highlightedLine) {
        return false;
      }
      if (tokenFilter !== "ALL" && t.category !== tokenFilter) {
        return false;
      }
      return true;
    });
  }, [pipelineData, highlightedLine, tokenFilter]);

  // Filtered bytecode
  const filteredBytecode = useMemo(() => {
    if (!pipelineData) return [];
    return pipelineData.bytecode.filter((inst) => {
      if (highlightedLine !== null && inst.line !== highlightedLine) {
        return false;
      }
      if (bytecodeSearch.trim()) {
        const q = bytecodeSearch.toLowerCase();
        return (
          inst.opcode.toLowerCase().includes(q) ||
          inst.arguments.toLowerCase().includes(q) ||
          inst.explanation.toLowerCase().includes(q) ||
          inst.methodName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [pipelineData, highlightedLine, bytecodeSearch]);

  const STAGE_ICONS: Record<CompilerStageType, React.ReactNode> = {
    SOURCE_CODE: <FileCode className="w-3.5 h-3.5 text-blue-400" />,
    LEXICAL_ANALYSIS: <Binary className="w-3.5 h-3.5 text-amber-400" />,
    SYNTAX_ANALYSIS: <GitFork className="w-3.5 h-3.5 text-emerald-400" />,
    SYMBOL_RESOLUTION: <Table className="w-3.5 h-3.5 text-purple-400" />,
    BYTECODE_DISASSEMBLY: <Cpu className="w-3.5 h-3.5 text-rose-400" />,
  };

  if (isLoading) {
    return (
      <Card className="p-8 bg-zinc-900 border-zinc-800 flex flex-col items-center justify-center min-h-[300px]">
        <LoadingState message="Executing authentic OpenJDK compiler pipeline analysis..." />
        <p className="text-xs text-zinc-500 mt-2 font-mono">
          Generating tokens, compiling AST via JavacTask, and disassembling bytecode via javap...
        </p>
      </Card>
    );
  }

  if (errorMessage || !pipelineData) {
    return (
      <Card className="p-6 bg-zinc-900 border-zinc-800 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold text-sm">Compiler Pipeline Analysis Error</span>
        </div>
        <p className="text-xs text-zinc-300 font-mono bg-zinc-950 p-3 rounded border border-zinc-800">
          {errorMessage || "Unable to retrieve compiler pipeline response."}
        </p>
        <Button variant="secondary" size="sm" onClick={handleFetch} className="w-fit">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Retry Analysis
        </Button>
      </Card>
    );
  }

  return (
    <div className={`flex flex-col gap-3 w-full ${classNameOverride}`}>
      {/* 1. Sequential Stage Progression Rail */}
      <Card className="p-3 bg-zinc-900/95 border-zinc-800 flex flex-col gap-2.5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent shrink-0" />
            <span className="text-xs font-bold text-zinc-200 tracking-wide uppercase font-mono">
              Compiler Pipeline Progression
            </span>
            <Badge variant="neutral" size="sm">
              {pipelineData.compilationTimeMs}ms
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm">
              100% Authentic Compiler Artifacts
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleFetch} title="Re-analyze compiler pipeline">
              <RefreshCw className="w-3 h-3 text-zinc-400" />
            </Button>
          </div>
        </div>

        {/* Stage Steps Selector Rail */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
          {pipelineData.stages.map((stageInfo, idx) => {
            const isActive = stageInfo.stage === activeStage;
            const isSuccess = stageInfo.status === "SUCCESS";
            return (
              <button
                key={stageInfo.stage}
                type="button"
                onClick={() => setActiveStage(stageInfo.stage)}
                className={`flex flex-col items-start p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  isActive
                    ? "bg-accent/15 border-accent text-zinc-100 shadow-sm"
                    : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5">
                    {STAGE_ICONS[stageInfo.stage]}
                    <span className="text-[10px] font-mono text-zinc-500 font-bold">
                      0{idx + 1}
                    </span>
                  </div>
                  {isSuccess ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-rose-400" />
                  )}
                </div>
                <span className="text-xs font-semibold truncate w-full">{stageInfo.name.split(" ")[0]}</span>
                <span className="text-[10px] text-zinc-500 font-mono truncate w-full">
                  {stageInfo.stage === "LEXICAL_ANALYSIS"
                    ? `${pipelineData.tokens.length} tokens`
                    : stageInfo.stage === "SYNTAX_ANALYSIS"
                    ? "AST nodes"
                    : stageInfo.stage === "SYMBOL_RESOLUTION"
                    ? `${pipelineData.symbols.length} symbols`
                    : stageInfo.stage === "BYTECODE_DISASSEMBLY"
                    ? `${pipelineData.bytecode.length} opcodes`
                    : "Source text"}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 2. Educational Explainer Banner for Active Stage */}
      {activeStageInfo && (
        <Card className="p-3 bg-zinc-900/80 border-zinc-800 flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-accent shrink-0" />
              <span className="text-xs font-bold text-zinc-200">
                Stage {activeStageInfo.name}: Educational Purpose & Architecture
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-400">
              <span>Toolchain:</span>
              <span className="text-accent font-semibold">{activeStageInfo.toolchain}</span>
            </div>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">{activeStageInfo.description}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono pt-1 border-t border-zinc-800/60">
            <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-zinc-200">Why it matters:</strong> {activeStageInfo.purpose}
            </span>
          </div>
        </Card>
      )}

      {/* Diagnostics & Error Grounding Banner if compilation had issues */}
      {pipelineData.diagnostics && pipelineData.diagnostics.length > 0 && (
        <Card className="p-3 bg-rose-950/20 border-rose-800/60 flex flex-col gap-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-rose-900/40">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="text-xs font-bold text-rose-200">
                Compiler Halting Stage & Diagnostics ({pipelineData.diagnostics.length})
              </span>
            </div>
            <Badge variant="danger" size="sm">
              Compilation Halted
            </Badge>
          </div>
          <div className="space-y-2">
            {pipelineData.diagnostics.map((diag, dIdx) => (
              <div
                key={dIdx}
                onClick={() => {
                  if (diag.line > 0) {
                    setHighlightedLine(diag.line);
                    onSelectSourceLine?.(diag.line);
                  }
                }}
                className="p-2.5 rounded-lg bg-zinc-950 border border-rose-500/30 text-xs cursor-pointer hover:border-rose-500/60 transition-colors"
                title={`Click to jump to Line ${diag.line}`}
              >
                <div className="flex items-center justify-between font-mono mb-1">
                  <span className="text-rose-400 font-bold">
                    Line {diag.line}:{diag.column}
                  </span>
                  <Badge variant="danger" size="sm">
                    {diag.diagnosticType}
                  </Badge>
                </div>
                <p className="font-mono text-zinc-200 text-xs mb-1.5">
                  {diag.message}
                </p>
                {diag.explanation && (
                  <div className="mt-1 p-2 rounded bg-zinc-900 border border-zinc-800 text-[11px] space-y-1">
                    <div>
                      <span className="text-zinc-400 font-medium">Why it happened: </span>
                      <span className="text-zinc-300">{diag.explanation.whyItHappened}</span>
                    </div>
                    <div>
                      <span className="text-emerald-400 font-medium">How to fix: </span>
                      <span className="text-emerald-300">{diag.explanation.howToFix}</span>
                    </div>
                    {diag.explanation.suggestion && (
                      <div className="p-1 rounded bg-emerald-950/30 border border-emerald-500/20 text-emerald-200 font-mono text-[10px]">
                        {diag.explanation.suggestion}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 3. Main Stage Content & Source Synchronization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Left Column: Interactive Source Code Viewer */}
        <Card className="lg:col-span-5 p-3 bg-zinc-900/90 border-zinc-800 flex flex-col gap-2">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Code className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-semibold text-zinc-200">Interactive Source Code</span>
            </div>
            {highlightedLine !== null && (
              <button
                type="button"
                onClick={() => setHighlightedLine(null)}
                className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 underline cursor-pointer"
              >
                Clear Line Highlight (Line {highlightedLine})
              </button>
            )}
          </div>

          <div className="font-mono text-xs bg-zinc-950 p-2 rounded-lg border border-zinc-800/80 max-h-[500px] overflow-y-auto">
            {sourceLines.map((lineText, idx) => {
              const lineNum = idx + 1;
              const isSelected = highlightedLine === lineNum;
              const hasError = pipelineData.diagnostics?.some((d) => d.line === lineNum);
              return (
                <div
                  key={lineNum}
                  onClick={() => handleLineClick(lineNum)}
                  className={`flex items-start px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-accent/25 border-l-2 border-accent text-accent font-semibold"
                      : hasError
                      ? "bg-rose-950/20 border-l-2 border-rose-500 text-rose-200"
                      : "text-zinc-300 hover:bg-zinc-900/80"
                  }`}
                  title={`Click to filter tokens, AST, and bytecode for line ${lineNum}`}
                >
                  <span className="w-6 text-right text-zinc-600 select-none mr-3 shrink-0 flex items-center justify-end gap-1">
                    {hasError && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />}
                    {lineNum}
                  </span>
                  <span className="whitespace-pre">{lineText || " "}</span>
                </div>
              );
            })}
          </div>
          <span className="text-[10px] text-zinc-500 italic font-mono">
            Click any source line above to isolate matching tokens, AST nodes, and JVM bytecode instructions.
          </span>
        </Card>

        {/* Right Column: Stage Inspection Panels */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* Stage 1: Source Code Overview */}
          {activeStage === "SOURCE_CODE" && (
            <Card className="p-4 bg-zinc-900/90 border-zinc-800 flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-zinc-200">Source Program Overview</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 font-mono">
                  <span className="text-[10px] text-zinc-500 block">Class Name</span>
                  <span className="text-xs font-semibold text-zinc-200">{pipelineData.className}</span>
                </div>
                <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 font-mono">
                  <span className="text-[10px] text-zinc-500 block">Total Lines</span>
                  <span className="text-xs font-semibold text-zinc-200">{sourceLines.length}</span>
                </div>
                <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 font-mono">
                  <span className="text-[10px] text-zinc-500 block">Total Tokens</span>
                  <span className="text-xs font-semibold text-accent">{pipelineData.tokens.length}</span>
                </div>
                <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 font-mono">
                  <span className="text-[10px] text-zinc-500 block">Bytecode Opcodes</span>
                  <span className="text-xs font-semibold text-rose-400">{pipelineData.bytecode.length}</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed font-mono">
                Compilation time: {pipelineData.compilationTimeMs} ms using OpenJDK 25.0.4.1 Toolchain.
              </div>
            </Card>
          )}

          {/* Stage 2: Lexical Analysis (Tokens) */}
          {activeStage === "LEXICAL_ANALYSIS" && (
            <Card className="p-3 bg-zinc-900/90 border-zinc-800 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Binary className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-zinc-200">
                    Token Stream ({filteredTokens.length} of {pipelineData.tokens.length})
                  </span>
                </div>
                {/* Category Filters */}
                <div className="flex flex-wrap gap-1">
                  {["ALL", "KEYWORD", "IDENTIFIER", "LITERAL", "OPERATOR", "SEPARATOR", "COMMENT"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setTokenFilter(cat)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                        tokenFilter === cat
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold"
                          : "text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tokens Cloud / Grid */}
              <div className="flex flex-wrap gap-1.5 max-h-[460px] overflow-y-auto p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                {filteredTokens.map((tok) => {
                  const isSelected = selectedTokenIndex === tok.index;
                  const isLineMatched = highlightedLine === tok.line;

                  const catColor =
                    tok.category === "KEYWORD"
                      ? "text-purple-400 bg-purple-950/40 border-purple-800/50"
                      : tok.category === "IDENTIFIER"
                      ? "text-sky-300 bg-sky-950/40 border-sky-800/50"
                      : tok.category === "LITERAL"
                      ? "text-emerald-400 bg-emerald-950/40 border-emerald-800/50"
                      : tok.category === "OPERATOR"
                      ? "text-rose-400 bg-rose-950/40 border-rose-800/50"
                      : tok.category === "SEPARATOR"
                      ? "text-zinc-400 bg-zinc-900 border-zinc-800"
                      : "text-zinc-500 bg-zinc-900 border-zinc-800 italic";

                  return (
                    <div
                      key={tok.index}
                      onClick={() => {
                        setSelectedTokenIndex(tok.index);
                        setHighlightedLine(tok.line);
                        onSelectSourceLine?.(tok.line);
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded border font-mono text-xs cursor-pointer transition-all ${catColor} ${
                        isSelected || isLineMatched ? "ring-2 ring-accent scale-[1.03]" : "opacity-90 hover:opacity-100"
                      }`}
                      title={`Token #${tok.index}: '${tok.value}' (${tok.type}) on Line ${tok.line}:${tok.column}`}
                    >
                      <span className="font-bold">{tok.value}</span>
                      <span className="text-[9px] text-zinc-500 ml-1">L{tok.line}</span>
                    </div>
                  );
                })}
              </div>

              {/* Selected Token Detail Card */}
              {selectedTokenIndex !== null && (
                <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 font-mono text-xs flex flex-wrap items-center justify-between gap-2">
                  {(() => {
                    const tok = pipelineData.tokens[selectedTokenIndex];
                    if (!tok) return null;
                    return (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400">Selected:</span>
                          <span className="text-accent font-semibold">{tok.value}</span>
                          <Badge variant="default" size="sm">
                            {tok.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
                          <span>
                            Line {tok.line}, Col {tok.column}-{tok.endColumn}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </Card>
          )}

          {/* Stage 3: Syntax Analysis (AST Tree) */}
          {activeStage === "SYNTAX_ANALYSIS" && (
            <Card className="p-3 bg-zinc-900/90 border-zinc-800 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <GitFork className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-zinc-200">
                    Abstract Syntax Tree (Javac CompilationUnit)
                  </span>
                </div>
                <Badge variant="neutral" size="sm">
                  {pipelineData.astRoot.kind}
                </Badge>
              </div>

              {/* Recursive AST Tree Explorer */}
              <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800 max-h-[460px] overflow-y-auto">
                <AstTreeNode
                  node={pipelineData.astRoot}
                  highlightedLine={highlightedLine}
                  selectedNodeId={selectedAstNodeId}
                  onSelectNode={(node) => {
                    setSelectedAstNodeId(node.id);
                    setHighlightedLine(node.line);
                    onSelectSourceLine?.(node.line);
                  }}
                />
              </div>
            </Card>
          )}

          {/* Stage 4: Symbol Resolution */}
          {activeStage === "SYMBOL_RESOLUTION" && (
            <Card className="p-3 bg-zinc-900/90 border-zinc-800 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-zinc-200">
                    Symbol Table & Scope Declarations ({pipelineData.symbols.length})
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 max-h-[460px] overflow-y-auto">
                {pipelineData.symbols.length > 0 ? (
                  pipelineData.symbols.map((sym, idx) => {
                    const isLineMatched = highlightedLine === sym.line;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setHighlightedLine(sym.line);
                          onSelectSourceLine?.(sym.line);
                        }}
                        className={`flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg border font-mono text-xs cursor-pointer transition-colors ${
                          isLineMatched
                            ? "bg-purple-950/30 border-purple-800 text-purple-200 ring-1 ring-purple-600"
                            : "bg-zinc-950 border-zinc-800/80 text-zinc-300 hover:bg-zinc-900"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              sym.kind === "CLASS"
                                ? "default"
                                : sym.kind === "METHOD"
                                ? "outline"
                                : sym.kind === "PARAMETER"
                                ? "neutral"
                                : "success"
                            }
                            size="sm"
                          >
                            {sym.kind}
                          </Badge>
                          <span className="font-semibold text-zinc-100">{sym.name}</span>
                          <span className="text-zinc-500">:</span>
                          <span className="text-accent">{sym.type}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                          <span className="text-zinc-500 truncate max-w-[180px]">{sym.scope}</span>
                          <span className="font-semibold text-zinc-300">Line {sym.line}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-zinc-500 italic p-4 text-center">
                    No declared symbols identified in source code.
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Stage 5: Bytecode Disassembly */}
          {activeStage === "BYTECODE_DISASSEMBLY" && (
            <Card className="p-3 bg-zinc-900/90 border-zinc-800 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-zinc-200">
                    JVM Bytecode Disassembly ({filteredBytecode.length} of {pipelineData.bytecode.length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRawBytecode(!showRawBytecode)}
                    className="text-xs font-mono text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
                  >
                    {showRawBytecode ? "View Opcode Table" : "View Raw javap Output"}
                  </button>
                </div>
              </div>

              {!showRawBytecode ? (
                <>
                  {/* Search Bar */}
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 text-zinc-500 pointer-events-none" />
                    <input
                      type="text"
                      value={bytecodeSearch}
                      onChange={(e) => setBytecodeSearch(e.target.value)}
                      placeholder="Search opcodes (bipush, istore, invokevirtual)..."
                      className="pl-8 pr-2.5 py-1 text-xs rounded bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-accent w-full font-mono"
                    />
                  </div>

                  {/* Bytecode Table */}
                  <div className="flex flex-col gap-1.5 max-h-[440px] overflow-y-auto">
                    {filteredBytecode.map((inst, idx) => {
                      const isLineMatched = highlightedLine === inst.line;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setHighlightedLine(inst.line);
                            onSelectSourceLine?.(inst.line);
                          }}
                          className={`flex flex-col gap-1 p-2 rounded-lg border font-mono text-xs cursor-pointer transition-colors ${
                            isLineMatched
                              ? "bg-rose-950/25 border-rose-800/80 text-rose-200 ring-1 ring-rose-600"
                              : "bg-zinc-950 border-zinc-800/80 text-zinc-300 hover:bg-zinc-900"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-500 font-bold w-7 text-right">
                                {inst.offset}:
                              </span>
                              <span className="text-rose-400 font-bold">{inst.opcode}</span>
                              {inst.arguments && (
                                <span className="text-zinc-300 font-medium">{inst.arguments}</span>
                              )}
                            </div>
                            <span className="text-[10px] text-accent font-semibold">
                              Line {inst.line}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 pl-9 leading-relaxed">
                            {inst.explanation}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="font-mono text-xs bg-zinc-950 p-3 rounded-lg border border-zinc-800 max-h-[460px] overflow-y-auto whitespace-pre text-zinc-300 leading-relaxed">
                  {pipelineData.rawBytecodeOutput}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Subcomponent: Recursive AST Tree Node
function AstTreeNode({
  node,
  highlightedLine,
  selectedNodeId,
  onSelectNode,
}: {
  node: AstNode;
  highlightedLine: number | null;
  selectedNodeId: string | null;
  onSelectNode: (node: AstNode) => void;
}) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNodeId === node.id;
  const isLineMatched = highlightedLine !== null && node.line === highlightedLine;

  return (
    <div className="flex flex-col gap-1 pl-2 border-l border-zinc-800/60 my-1">
      <div
        onClick={() => onSelectNode(node)}
        className={`flex items-center gap-1.5 p-1 rounded font-mono text-xs cursor-pointer transition-all ${
          isSelected || isLineMatched
            ? "bg-emerald-950/40 border border-emerald-800 text-emerald-200"
            : "text-zinc-300 hover:bg-zinc-900"
        }`}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 text-zinc-500 hover:text-zinc-300"
          >
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        ) : (
          <span className="w-3" />
        )}

        <Badge variant="neutral" size="sm">
          {node.kind}
        </Badge>
        <span className="font-semibold text-zinc-200 truncate">{node.label}</span>
        <span className="text-[10px] text-zinc-500 ml-auto shrink-0">
          L{node.line}:{node.column}
        </span>
      </div>

      {isExpanded && hasChildren && (
        <div className="flex flex-col pl-2">
          {node.children.map((child) => (
            <AstTreeNode
              key={child.id}
              node={child}
              highlightedLine={highlightedLine}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
