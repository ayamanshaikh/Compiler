"use client";

import { useEffect, useRef } from "react";
import {
  AlertCircle,
  Bot,
  Lightbulb,
  ChevronRight,
  GraduationCap,
  Code,
  Shield,
} from "lucide-react";
import { animate, stagger } from "animejs";
import { CompileResponse } from "@/lib/types";

interface ErrorCardProps {
  result: CompileResponse;
  learningMode?: boolean;
}

export default function ErrorCard({ result, learningMode = true }: ErrorCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const isRuntime =
    result.error?.startsWith("Runtime Error:") ||
    result.error?.startsWith("Server Error:");
  const isConnectionError =
    result.message === "Backend connection failed" ||
    result.message === "Could not connect to Java backend";

  // Anime.js entrance animation on mount
  useEffect(() => {
    if (!cardRef.current) return;
    const sections = cardRef.current.querySelectorAll("[data-error-section]");
    animate(Array.from(sections), {
      opacity: [0, 1],
      translateX: [-16, 0],
      duration: 400,
      ease: "outExpo",
      delay: stagger(60),
    });
  }, [result]);

  return (
    <div ref={cardRef} className="space-y-3">
      {/* Error header */}
      <div data-error-section className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/15 ring-1 ring-red-500/15 shadow-sm shadow-red-500/10">
            <AlertCircle size={14} className="text-red-400" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
            {isRuntime
              ? "Runtime Error"
              : isConnectionError
                ? "Connection Error"
                : "Compilation Error"}
          </span>
        </div>
        {result.lineNumber > 0 && (
          <span className="rounded-lg bg-red-500/10 px-2.5 py-1 font-mono text-[11px] font-medium text-red-300 ring-1 ring-red-500/10">
            Line {result.lineNumber}
          </span>
        )}
      </div>

      {/* Raw error with glow */}
      <div data-error-section className="rounded-xl border border-red-500/15 bg-red-500/[0.03] p-3.5 shadow-sm shadow-red-500/5">
        <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-5 text-red-300/90">
          {result.error}
        </pre>
      </div>

      {/* Mode indicator */}
      <div data-error-section className="flex items-center gap-1.5 text-[11px] text-zinc-600">
        {learningMode ? (
          <><GraduationCap size={11} /><span>Learning Mode — simplified explanation</span></>
        ) : (
          <><Code size={11} /><span>Developer Mode — technical explanation</span></>
        )}
      </div>

      {/* Explanation */}
      {result.explanation && (
        <div data-error-section className="rounded-xl border border-purple-500/15 bg-purple-500/[0.03] p-4">
          <div className="mb-2.5 flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-500/15">
              <Bot size={12} className="text-purple-400" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400">
              {learningMode ? "What this means" : "Analysis"}
            </span>
          </div>
          <p className="text-[13px] leading-6 text-zinc-300">{result.explanation}</p>
        </div>
      )}

      {/* Suggestion with glow */}
      {result.suggestion && (
        <div data-error-section className="rounded-xl border border-blue-500/15 bg-blue-500/[0.03] p-4">
          <div className="mb-2.5 flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-500/15">
              <Lightbulb size={12} className="text-blue-400" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">
              How to fix it
            </span>
          </div>
          <p className="text-[13px] leading-6 text-zinc-300">{result.suggestion}</p>
        </div>
      )}

      {/* Security note for connection errors */}
      {isConnectionError && (
        <div data-error-section className="rounded-xl border border-amber-500/15 bg-amber-500/[0.03] p-4">
          <div className="mb-2.5 flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/15">
              <Shield size={12} className="text-amber-400" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
              Backend Required
            </span>
          </div>
          <p className="text-[13px] leading-6 text-zinc-300">
            The Spring Boot backend must be running to compile Java code.
          </p>
        </div>
      )}

      {/* Compiler raw output detail */}
      {!isRuntime && !isConnectionError && result.error && (
        <details data-error-section className="group">
          <summary className="flex cursor-pointer items-center gap-1.5 text-[11px] text-zinc-500 transition-colors hover:text-zinc-400">
            <ChevronRight size={12} className="transition-transform group-open:rotate-90" />
            Raw compiler output
          </summary>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-[#06090f]/40 p-3 font-mono text-[12px] leading-4 text-zinc-500 ring-1 ring-white/[0.04]">
            {result.error}
          </pre>
        </details>
      )}
    </div>
  );
}
