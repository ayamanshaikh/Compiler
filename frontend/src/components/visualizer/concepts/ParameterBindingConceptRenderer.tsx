"use client";

import React from "react";
import { NormalizedExecutionEvent } from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowDown, CornerDownLeft, Layers, CornerRightDown } from "lucide-react";

interface ParameterBindingConceptRendererProps {
  event: NormalizedExecutionEvent;
}

export function ParameterBindingConceptRenderer({
  event,
}: ParameterBindingConceptRendererProps) {
  const isReturn = event.conceptType === "RETURN";
  const methodName =
    event.callStack?.[0]?.methodName || event.symbol || "method";
  const callerName =
    event.callStack && event.callStack.length > 1
      ? event.callStack[1].methodName
      : "main";

  // Parse parameters if available in metadata or variables
  const rawParams =
    event.metadata?.parameters && typeof event.metadata.parameters === "object"
      ? (event.metadata.parameters as Record<string, string>)
      : null;

  const paramEntries = rawParams
    ? Object.entries(rawParams)
    : Object.entries(event.variables)
        .slice(0, 3)
        .map(([k, v]) => [k, v.value] as [string, string]);

  const returnValue = String(event.currentValue ?? event.previousValue ?? "void");

  return (
    <Card className="p-4 bg-zinc-950 border-zinc-800 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-mono font-medium text-zinc-300">
            {isReturn
              ? `Method Return Value Bubbling (${methodName})`
              : `Method Invocation & Parameter Binding (${methodName})`}
          </span>
        </div>
        <Badge variant={isReturn ? "success" : "default"} size="sm">
          {isReturn ? "FRAME POP" : "FRAME PUSH"}
        </Badge>
      </div>

      {/* Visual Invocation & Flow */}
      <div className="flex flex-col items-center gap-3 py-2">
        {/* Caller Frame Box */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono">
          <span className="text-zinc-500">Caller:</span>
          <span className="text-zinc-200 font-semibold">{callerName}()</span>
        </div>

        {isReturn ? (
          <CornerDownLeft className="w-4 h-4 text-emerald-400 shrink-0" />
        ) : (
          <ArrowDown className="w-4 h-4 text-indigo-400 shrink-0" />
        )}

        {/* Callee Frame Box */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-950/40 border border-indigo-700/80 text-xs font-mono shadow-sm">
          <span className="text-indigo-400">Executing:</span>
          <span className="text-indigo-200 font-bold text-sm">
            {methodName}()
          </span>
        </div>

        {/* Bound Parameters Cards or Return Value Box */}
        {isReturn ? (
          <div className="flex flex-col items-center mt-2 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs font-mono w-full max-w-sm">
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1 font-semibold">
              Return Value Delivered
            </span>
            <div className="text-base font-bold text-emerald-200 px-3 py-1 rounded bg-zinc-950 border border-emerald-900">
              {returnValue}
            </div>
            <span className="text-[10px] text-zinc-400 mt-2">
              Popping frame from call stack back to {callerName}()
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full max-w-md mt-1">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
              Formal Parameters Bound to Arguments
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
              {paramEntries.length > 0 ? (
                paramEntries.map(([paramName, argVal]) => (
                  <div
                    key={paramName}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono"
                  >
                    <span className="text-zinc-400">{paramName}</span>
                    <CornerRightDown className="w-3 h-3 text-indigo-400" />
                    <span className="text-zinc-100 font-bold px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-700">
                      {argVal}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-[11px] text-zinc-500 font-mono">
                  No explicit parameters passed
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Frame Status Footer */}
      <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 font-mono flex items-center justify-between">
        <span>Call Stack Depth: {event.callStack?.length ?? 1} frame(s)</span>
        <span className="text-zinc-300">
          {isReturn
            ? `Returned to ${callerName}`
            : `Control transferred to ${methodName}`}
        </span>
      </div>
    </Card>
  );
}
