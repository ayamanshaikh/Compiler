"use client";

import { useEffect, useRef, useState } from "react";
import { Braces, Variable } from "lucide-react";
import { animate, stagger } from "animejs";

interface VariablePanelProps {
  variables: Record<string, string>;
  arrays: Record<string, number[]>;
  highlightIndices?: number[];
}

export default function VariablePanel({
  variables,
  arrays,
  highlightIndices = [],
}: VariablePanelProps) {
  const hasVariables = Object.keys(variables).length > 0;
  const hasArrays = Object.keys(arrays).length > 0;
  const [changedVars, setChangedVars] = useState<Set<string>>(new Set());
  const prevVarsRef = useRef<Record<string, string>>({});
  const varRowsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const changed = new Set<string>();
    for (const [key, val] of Object.entries(variables)) {
      if (prevVarsRef.current[key] !== undefined && prevVarsRef.current[key] !== val) {
        changed.add(key);
      }
    }
    if (changed.size > 0) {
      setChangedVars(changed);

      // Animate changed variable rows with anime.js
      varRowsRef.current.forEach((row, i) => {
        if (!row) return;
        const name = Object.keys(variables)[i];
        if (changed.has(name)) {
          animate(row, {
            scale: [1, 1.02, 1],
            boxShadow: [
              "0 0 0px rgba(59, 130, 246, 0)",
              "0 0 20px rgba(59, 130, 246, 0.3)",
              "0 0 0px rgba(59, 130, 246, 0)",
            ],
            duration: 600,
            ease: "outExpo",
          });
        }
      });

      const timer = setTimeout(() => setChangedVars(new Set()), 800);
      return () => clearTimeout(timer);
    }
    prevVarsRef.current = { ...variables };
  }, [variables]);

  // Stagger-animate array items when they change
  const arrayValuesRef = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    if (arrayValuesRef.current.length > 0) {
      animate(Array.from(arrayValuesRef.current).filter(Boolean) as Element[], {
        scale: [0.8, 1],
        opacity: [0, 1],
        duration: 300,
        ease: "outExpo",
        delay: stagger(40),
      });
    }
  }, [arrays]);

  if (!hasVariables && !hasArrays) {
    return (
      <div className="glass-surface rounded-xl p-4">
        <p className="text-[12px] text-zinc-600">No variables tracked yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hasVariables && (
        <div className="glass-surface rounded-xl p-3.5">
          <div className="mb-3 flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-500/15">
              <Variable size={11} className="text-blue-400" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Variables
            </span>
          </div>
          <div className="space-y-1.5">
            {Object.entries(variables).map(([name, value], idx) => {
              const isChanged = changedVars.has(name);
              return (
                <div
                  key={name}
                  ref={(el) => { varRowsRef.current[idx] = el; }}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 font-mono text-[13px] transition-all duration-300 ${
                    isChanged
                      ? "bg-blue-500/10 ring-1 ring-blue-500/20 shadow-sm shadow-blue-500/10"
                      : "bg-white/[0.02] ring-1 ring-white/[0.04]"
                  }`}
                >
                  <span className="text-zinc-400">{name}</span>
                  <span className={`font-bold transition-all ${isChanged ? "text-blue-300 animate-value-change" : "text-zinc-200"}`}>
                    {value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hasArrays && (
        <div className="glass-surface rounded-xl p-3.5">
          <div className="mb-3 flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-500/15">
              <Braces size={11} className="text-purple-400" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Arrays
            </span>
          </div>
          {Object.entries(arrays).map(([name, arr]) => (
            <div key={name} className="space-y-2">
              <div className="font-mono text-[12px] text-zinc-500">{name}</div>
              <div className="flex gap-2">
                {arr.map((val, idx) => {
                  const isHighlighted = highlightIndices.includes(idx);
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5">
                      <div
                        ref={(el) => { arrayValuesRef.current[idx] = el; }}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border font-mono text-[13px] font-semibold transition-all duration-300 ${
                          isHighlighted
                            ? "border-blue-400/30 bg-blue-500/15 text-blue-300 shadow-sm shadow-blue-500/10"
                            : "border-white/[0.06] bg-white/[0.03] text-zinc-300"
                        }`}
                      >
                        {val}
                      </div>
                      <span className="text-[10px] text-zinc-700">[{idx}]</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
