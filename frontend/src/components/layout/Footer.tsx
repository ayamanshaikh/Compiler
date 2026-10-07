import React from "react";
import NextLink from "next/link";
import { Code2, Cpu } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800/80 bg-zinc-950/70 text-zinc-400 text-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 font-semibold text-zinc-200">
            <Code2 className="w-4 h-4 text-blue-500" />
            <span>CodeVista AI</span>
          </div>
          <span className="hidden sm:inline text-zinc-600">|</span>
          <p className="text-zinc-500 italic">
            &ldquo;Don&apos;t just run your code. Understand what happens.&rdquo;
          </p>
        </div>

        <div className="flex items-center gap-6 text-zinc-500 text-xs">
          <NextLink
            href="/learn"
            className="hover:text-zinc-300 transition-colors"
          >
            Curriculum
          </NextLink>
          <NextLink
            href="/visualize"
            className="hover:text-zinc-300 transition-colors"
          >
            Visualizer
          </NextLink>
          <NextLink
            href="/settings"
            className="hover:text-zinc-300 transition-colors"
          >
            Settings
          </NextLink>
          <div className="flex items-center gap-1.5 pl-4 border-l border-zinc-800 font-mono text-[11px] text-zinc-400">
            <Cpu className="w-3.5 h-3.5 text-emerald-500" />
            <span>Java 25 LTS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
