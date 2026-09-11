"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  History as HistoryIcon,
  Terminal,
} from "lucide-react";
import { HistoryEntry } from "@/lib/types";
import { getHistory } from "@/lib/api";

function formatTime(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return timestamp;
  }
}

function snippet(text: string | null | undefined, max = 220): string {
  if (!text) return "(no output)";
  const single = text.replace(/\n/g, " · ").trim();
  return single.length > max ? single.slice(0, max) + "…" : single;
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyData = useCallback((data: HistoryEntry[]) => {
    setEntries(data);
    setError(null);
  }, []);

  const applyError = useCallback(() => {
    setError(
      "Could not load history. Make sure the CodeVista backend is running on port 8080."
    );
    setEntries([]);
  }, []);

  const load = useCallback(() => {
    getHistory().then(applyData).catch(applyError);
  }, [applyData, applyError]);

  useEffect(() => {
    let cancelled = false;
    getHistory()
      .then((data) => {
        if (!cancelled) applyData(data);
      })
      .catch(() => {
        if (!cancelled) applyError();
      });
    return () => {
      cancelled = true;
    };
  }, [applyData, applyError]);

  return (
    <div className="flex min-h-screen flex-col bg-[#06090f] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-0 h-[400px] w-[400px] rounded-full bg-blue-500/[0.03] blur-[100px]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <header className="glass-surface flex items-center justify-between border-b border-white/[0.04] px-5 py-3">
          <div className="flex items-center gap-4">
            <Link
              href="/workshop"
              className="flex items-center gap-2 rounded-lg p-1.5 text-zinc-400 transition-all hover:bg-white/5 hover:text-white"
              aria-label="Back to workspace"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
                <HistoryIcon size={16} className="text-white" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight">
                  Execution History
                </span>
                <span className="ml-2 hidden text-[11px] text-zinc-600 sm:inline">
                  Recent compile/run attempts (in-memory)
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={load}
            className="btn-3d btn-3d-ghost btn-3d-sm"
            aria-label="Refresh history"
          >
            <Terminal size={13} />
            Refresh
          </button>
        </header>

        {/* Body */}
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
          {error && (
            <div className="rounded-xl border border-red-500/15 bg-red-500/[0.04] p-4">
              <p className="text-[13px] text-red-300">{error}</p>
              <button
                onClick={load}
                className="mt-3 rounded-lg bg-white/[0.04] px-3 py-1.5 text-[12px] text-zinc-300 ring-1 ring-white/[0.06] transition-colors hover:bg-white/[0.08]"
              >
                Try again
              </button>
            </div>
          )}

          {!entries && !error && (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <Loader2 size={20} className="animate-spin text-blue-400" />
              <p className="text-[13px] text-zinc-500">Loading history…</p>
            </div>
          )}

          {entries && entries.length === 0 && !error && (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.05]">
                <Clock size={22} className="text-zinc-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-300">
                  No executions yet
                </h3>
                <p className="mt-1.5 max-w-sm text-[12px] leading-5 text-zinc-600">
                  Run some code in the workspace and it will show up here —
                  successes and failures alike.
                </p>
              </div>
              <Link href="/workshop" className="btn-3d btn-3d-primary btn-3d-sm mt-2">
                Go to workspace
              </Link>
            </div>
          )}

          {entries && entries.length > 0 && (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="card-3d p-4"
                >
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex items-center gap-2">
                      {entry.success ? (
                        <CheckCircle2 size={15} className="text-emerald-400" />
                      ) : (
                        <XCircle size={15} className="text-red-400" />
                      )}
                      <span
                        className={`text-[12px] font-semibold ${
                          entry.success ? "text-emerald-300" : "text-red-300"
                        }`}
                      >
                        {entry.success ? "Success" : "Failed"}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-zinc-600">
                      #{entry.id}
                    </span>
                    <span className="rounded-md bg-white/[0.03] px-2 py-0.5 text-[11px] text-zinc-500 ring-1 ring-white/[0.05]">
                      {entry.language}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-zinc-600">
                      <Clock size={11} />
                      {formatTime(entry.timestamp)}
                    </span>
                    <span className="ml-auto max-w-[280px] truncate text-[11px] text-zinc-500">
                      {entry.message}
                    </span>
                  </div>

                  <details className="group mt-3">
                    <summary className="flex cursor-pointer items-center gap-1.5 text-[11px] text-zinc-500 transition-colors hover:text-zinc-300">
                      <span className="transition-transform group-open:rotate-90">▸</span>
                      View details
                    </summary>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                          Code
                        </p>
                        <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-[#06090f]/60 p-3 font-mono text-[11.5px] leading-4 text-zinc-400 ring-1 ring-white/[0.04]">
                          {entry.code}
                        </pre>
                      </div>
                      <div className="space-y-3">
                        {entry.success && (
                          <div>
                            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                              Output
                            </p>
                            <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#06090f]/60 p-3 font-mono text-[11.5px] leading-4 text-emerald-300/80 ring-1 ring-white/[0.04]">
                              {snippet(entry.output, 600)}
                            </pre>
                          </div>
                        )}
                        {!entry.success && entry.error && (
                          <div>
                            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                              Error
                            </p>
                            <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#06090f]/60 p-3 font-mono text-[11.5px] leading-4 text-red-300/80 ring-1 ring-white/[0.04]">
                              {entry.error}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}