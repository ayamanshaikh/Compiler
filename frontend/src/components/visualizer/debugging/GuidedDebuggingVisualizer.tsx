"use client";

import React, { useState } from "react";
import { GuidedErrorRemediation } from "@/lib/visualizer/guidedDebugging";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  AlertTriangle,
  Wrench,
  Check,
  Copy,
  Sparkles,
  Info,
  ArrowRight,
  ShieldCheck,
  FileCode,
  X,
} from "lucide-react";

interface GuidedDebuggingVisualizerProps {
  remediation: GuidedErrorRemediation;
  onApplyFix?: (correctedSourceCode: string) => void;
  onDismiss?: () => void;
}

export function GuidedDebuggingVisualizer({
  remediation,
  onApplyFix,
  onDismiss,
}: GuidedDebuggingVisualizerProps) {
  const [pedagogicalMode, setPedagogicalMode] = useState<"beginner" | "detailed">("beginner");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(remediation.correctedSourceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCompiler = remediation.category.startsWith("COMPILER_");

  return (
    <Card className="bg-zinc-900 border-rose-500/30 p-4 sm:p-5 flex flex-col gap-4 shadow-2xl relative overflow-hidden">
      {/* Background Accent Gradient */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-rose-500/5 blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-semibold text-zinc-100">
                Guided Error Diagnosis & Remediation
              </h3>
              <Badge
                variant="outline"
                size="sm"
                className="text-[10px] bg-rose-950/40 text-rose-400 border-rose-500/30 font-bold font-mono"
              >
                Line {remediation.line}
              </Badge>
              <Badge
                variant="outline"
                size="sm"
                className="text-[10px] bg-zinc-800 text-zinc-300 border-zinc-700 font-mono"
              >
                {isCompiler ? "Compiler Diagnostic" : "JVM Runtime Exception"}
              </Badge>
            </div>
            <p className="text-xs text-rose-300/80 font-mono mt-0.5 truncate max-w-xl">
              {remediation.observedMessage}
            </p>
          </div>
        </div>

        {/* Level Switcher & Dismiss */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setPedagogicalMode("beginner")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                pedagogicalMode === "beginner"
                  ? "bg-zinc-800 text-zinc-100 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Beginner
            </button>
            <button
              type="button"
              onClick={() => setPedagogicalMode("detailed")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                pedagogicalMode === "detailed"
                  ? "bg-zinc-800 text-zinc-100 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Detailed
            </button>
          </div>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
              title="Dismiss Diagnostic"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Contract & Expectation Box */}
      <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 flex items-start gap-3">
        <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <div className="flex-1 text-xs">
          <span className="font-semibold text-zinc-300">Expected Contract: </span>
          <span className="text-zinc-400">{remediation.expectedContract}</span>
        </div>
      </div>

      {/* Pedagogical Explanation */}
      {pedagogicalMode === "beginner" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              What Happened in Simple Terms
            </span>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {remediation.beginnerExplanation.summary}
            </p>
            <div className="p-2 rounded bg-amber-500/5 border border-amber-500/15 text-[11px] text-amber-300/90 mt-1 leading-relaxed">
              💡 <span className="font-semibold">Analogy:</span> {remediation.beginnerExplanation.analogy}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-emerald-400" />
              How to Fix It
            </span>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {remediation.beginnerExplanation.howToFix}
            </p>
            <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">
              {remediation.beginnerExplanation.whyItHappened}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
            <span className="text-xs font-semibold text-zinc-200 font-mono">
              Root Cause & Technical Specification
            </span>
            <Badge variant="outline" size="sm" className="font-mono text-[10px] text-zinc-400 border-zinc-700">
              {remediation.detailedExplanation.jvmOrCompilerSpec}
            </Badge>
          </div>
          <p className="text-xs text-zinc-300 font-mono leading-relaxed">
            {remediation.detailedExplanation.rootCauseAnalysis}
          </p>
          <div className="space-y-1 pt-1 border-t border-zinc-800/50">
            <span className="text-[11px] font-semibold text-zinc-400">Formal Remediation Sequence:</span>
            <ul className="list-decimal list-inside text-xs text-zinc-300 space-y-1">
              {remediation.detailedExplanation.remediationSteps.map((step, idx) => (
                <li key={idx} className="font-mono text-[11px] text-zinc-300">
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Suggested Code Fix Diff */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-zinc-400" />
            Suggested Line Modification (Line {remediation.line})
          </span>
          <span className="text-[11px] text-zinc-400 font-mono">
            {remediation.suggestedFix.explanation}
          </span>
        </div>

        <div className="rounded-lg border border-zinc-800 overflow-hidden font-mono text-xs">
          {/* Original Failing Line */}
          <div className="p-2.5 bg-rose-950/20 border-b border-rose-500/20 flex items-center justify-between gap-3 text-rose-300">
            <div className="flex items-center gap-2">
              <span className="text-rose-500 font-bold select-none">-</span>
              <span className="text-zinc-500 select-none">{remediation.line}:</span>
              <span className="whitespace-pre">{remediation.suggestedFix.originalLine}</span>
            </div>
            <Badge variant="outline" size="sm" className="text-[10px] text-rose-400 border-rose-500/30">
              Failing
            </Badge>
          </div>

          {/* Corrected Line */}
          <div className="p-2.5 bg-emerald-950/20 flex items-center justify-between gap-3 text-emerald-300">
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold select-none">+</span>
              <span className="text-zinc-500 select-none">{remediation.line}:</span>
              <span className="whitespace-pre font-semibold">{remediation.suggestedFix.correctedLine}</span>
            </div>
            <Badge variant="outline" size="sm" className="text-[10px] text-emerald-400 border-emerald-500/30">
              Proposed Fix
            </Badge>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800">
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80" />
          <span>Grounded in authentic javac & JVM runtime diagnostics. Zero fabricated causes.</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="text-xs text-zinc-300 border-zinc-700 hover:bg-zinc-800"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                Copied Full Code
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1" />
                Copy Corrected Code
              </>
            )}
          </Button>

          {onApplyFix && remediation.canSimulateFix && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onApplyFix(remediation.correctedSourceCode)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs"
            >
              <Wrench className="w-3.5 h-3.5 mr-1.5" />
              Apply Fix to Code
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
