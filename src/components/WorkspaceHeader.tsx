"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Code2,
  Settings,
  FileCode,
  Keyboard,
  Cpu,
  History,
} from "lucide-react";

export default function WorkspaceHeader() {
  return (
    <header
      className="glass-surface flex items-center justify-between border-b border-white/[0.04] px-5 py-3"
      role="banner"
    >
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg p-1.5 text-zinc-400 transition-all hover:bg-white/5 hover:text-white"
          aria-label="Back to home"
        >
          <ArrowLeft size={16} />
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
            <Code2 size={16} className="text-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-white">
            CodeVista<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">AI</span>
          </span>
        </div>

        <div className="h-5 w-px bg-white/[0.06]" />

        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Cpu size={12} className="text-zinc-600" />
          Interactive Java Workspace
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/history"
          className="hidden items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:text-white sm:flex"
          title="View execution history"
        >
          <History size={13} className="text-zinc-500" />
          History
        </Link>

        <div
          className="hidden items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-xs text-zinc-400 sm:flex"
          title="Language: Java"
        >
          <FileCode size={13} className="text-blue-400/70" />
          Java
        </div>

        <div
          className="hidden items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-zinc-500 md:flex"
          title="Keyboard shortcuts: Ctrl+Enter to run, Arrow keys to navigate"
        >
          <Keyboard size={12} />
          <span className="hidden lg:inline">Ctrl+Enter</span>
          <span className="lg:hidden">⌘↵</span>
        </div>

        <button
          className="rounded-lg p-2 text-zinc-500 transition-all hover:bg-white/5 hover:text-zinc-300"
          title="Settings"
          aria-label="Settings"
        >
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
}
