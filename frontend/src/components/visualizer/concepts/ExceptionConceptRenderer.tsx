"use client";

import React, { useMemo } from "react";
import { NormalizedExecutionEvent } from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AlertOctagon, ShieldAlert, ArrowDown, CheckCircle2, CornerDownRight } from "lucide-react";

interface ExceptionConceptRendererProps {
  event: NormalizedExecutionEvent;
}

export function ExceptionConceptRenderer({ event }: ExceptionConceptRendererProps) {
  const { sourceLine, currentValue, metadata, callStack, description } = event;

  const exceptionDetails = useMemo(() => {
    const rawType = String(
      metadata?.exceptionType ||
      metadata?.exceptionClass ||
      (currentValue && currentValue.includes("Exception") ? currentValue : "java.lang.RuntimeException")
    );
    const simpleType = rawType.includes(".") ? rawType.split(".").pop() : rawType;
    const msg = String(metadata?.message || metadata?.detail || description || "Runtime exception occurred");
    const isCaught = Boolean(metadata?.isCaught || metadata?.catchLine);
    const catchLine = metadata?.catchLine ? Number(metadata.catchLine) : undefined;
    const finallyLine = metadata?.finallyLine ? Number(metadata.finallyLine) : undefined;

    return {
      rawType,
      simpleType,
      message: msg,
      isCaught,
      catchLine,
      finallyLine,
    };
  }, [metadata, currentValue, description]);

  return (
    <Card className="p-4 bg-zinc-900 border-red-900/50 flex flex-col gap-3.5">
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-semibold text-rose-200">
            JVM Exception Propagation
          </span>
          <Badge variant="danger" size="sm" className="font-mono text-[10px]">
            {exceptionDetails.simpleType}
          </Badge>
        </div>
        <Badge
          variant={exceptionDetails.isCaught ? "success" : "danger"}
          size="sm"
          className="font-mono text-[10px]"
        >
          {exceptionDetails.isCaught ? "CAUGHT" : "UNCAUGHT"}
        </Badge>
      </div>

      {/* Exception Message Card */}
      <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/60 flex flex-col gap-1 text-xs">
        <div className="flex items-center gap-1.5 text-rose-300 font-semibold font-mono">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>{exceptionDetails.rawType}</span>
        </div>
        <p className="text-zinc-300 text-xs pl-5 font-mono">
          {exceptionDetails.message}
        </p>
      </div>

      {/* Unwinding Control Flow Ladder */}
      <div className="flex flex-col gap-2 p-3 bg-zinc-950/80 rounded-lg border border-zinc-800">
        <span className="text-[11px] font-mono text-zinc-400 font-semibold uppercase tracking-wider">
          Exception Propagation Flow
        </span>

        <div className="flex flex-col gap-1.5 pl-1">
          {/* Step 1: Throw */}
          <div className="flex items-start gap-2.5 text-xs font-mono">
            <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center justify-center text-[10px] shrink-0 font-bold">
              1
            </span>
            <div className="flex flex-col">
              <span className="text-rose-200 font-semibold">
                Exception Instantiated / Thrown at Line {sourceLine}
              </span>
              <span className="text-zinc-500 text-[11px]">
                Normal instruction pipeline halted; searching call stack frames
              </span>
            </div>
          </div>

          <div className="pl-2.5 py-0.5">
            <ArrowDown className="w-3 h-3 text-zinc-600" />
          </div>

          {/* Step 2: Stack Inspection */}
          <div className="flex items-start gap-2.5 text-xs font-mono">
            <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center text-[10px] shrink-0 font-bold">
              2
            </span>
            <div className="flex flex-col">
              <span className="text-zinc-200">
                Stack Frame Inspection ({callStack?.length || 1} frame{callStack?.length === 1 ? "" : "s"})
              </span>
              <span className="text-zinc-500 text-[11px]">
                Current frame: {callStack?.[0]?.methodName || "main"}()
              </span>
            </div>
          </div>

          <div className="pl-2.5 py-0.5">
            <ArrowDown className="w-3 h-3 text-zinc-600" />
          </div>

          {/* Step 3: Catch / Unwind */}
          <div className="flex items-start gap-2.5 text-xs font-mono">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold border ${
                exceptionDetails.isCaught
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/40"
              }`}
            >
              3
            </span>
            <div className="flex flex-col">
              {exceptionDetails.isCaught ? (
                <>
                  <span className="text-emerald-300 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Catch Block Matched at Line {exceptionDetails.catchLine ?? "target"}
                  </span>
                  <span className="text-zinc-500 text-[11px]">
                    Handler variable bound; resuming managed execution
                  </span>
                </>
              ) : (
                <>
                  <span className="text-amber-300 font-semibold">
                    No Matching Catch Block in Frame
                  </span>
                  <span className="text-zinc-500 text-[11px]">
                    Unwinding to caller stack or terminating program thread
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Step 4: Finally block if present */}
          {exceptionDetails.finallyLine && (
            <>
              <div className="pl-2.5 py-0.5">
                <ArrowDown className="w-3 h-3 text-zinc-600" />
              </div>
              <div className="flex items-start gap-2.5 text-xs font-mono">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center justify-center text-[10px] shrink-0 font-bold">
                  4
                </span>
                <div className="flex flex-col">
                  <span className="text-blue-200 font-semibold flex items-center gap-1">
                    <CornerDownRight className="w-3 h-3 text-blue-400" />
                    Finally Block Guaranteed at Line {exceptionDetails.finallyLine}
                  </span>
                  <span className="text-zinc-500 text-[11px]">
                    Clean-up logic guaranteed to execute before leaving block
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
