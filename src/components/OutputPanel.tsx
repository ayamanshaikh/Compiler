"use client";

import { Terminal, CheckCircle2 } from "lucide-react";

interface OutputPanelProps {
  output: string | null;
  success: boolean;
}

export default function OutputPanel({ output, success }: OutputPanelProps) {
  const hasOutput = output && output.trim().length > 0;

  return (
    <div className="animate-slide-in space-y-3">
      <div className="flex items-center gap-2">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-lg ${
            success ? "bg-green-500/15" : "bg-zinc-500/15"
          }`}
        >
          {success ? (
            <CheckCircle2 size={14} className="text-green-400" />
          ) : (
            <Terminal size={14} className="text-zinc-400" />
          )}
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Program Output
        </span>
      </div>

      <div className="glass-surface rounded-xl p-4">
        {hasOutput ? (
          <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-5 text-green-300/90">
            {output}
          </pre>
        ) : (
          <p className="font-mono text-[13px] text-zinc-600">
            (No output)
          </p>
        )}
      </div>
    </div>
  );
}
