"use client";

import { useState, useRef, useEffect } from "react";
import { BookOpen, ChevronDown, Code2, Sparkles } from "lucide-react";
import { ALGORITHM_EXAMPLES } from "@/data/examples";

interface ExampleLoaderProps {
  onLoad: (code: string, name: string) => void;
}

export default function ExampleLoader({ onLoad }: ExampleLoaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categories = Array.from(new Set(ALGORITHM_EXAMPLES.map((e) => e.category)));

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-3d btn-3d-ghost btn-3d-sm"
        title="Load an example algorithm"
      >
        <BookOpen size={13} />
        Load Example
        <ChevronDown size={12} className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 animate-scale-in overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0e1424]/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
          {/* Header */}
          <div className="border-b border-white/[0.04] px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-blue-400" />
              <span className="text-[12px] font-semibold text-zinc-300">
                Example Algorithms
              </span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-600">
              Load a pre-built algorithm to explore
            </p>
          </div>

          {/* Examples */}
          <div className="max-h-80 overflow-y-auto p-2">
            {categories.map((category) => (
              <div key={category}>
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                  {category}
                </div>
                {ALGORITHM_EXAMPLES.filter((e) => e.category === category).map((example) => (
                  <button
                    key={example.name}
                    onClick={() => {
                      onLoad(example.code, example.name);
                      setIsOpen(false);
                    }}
                    className="group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-white/[0.04]"
                  >
                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/15 to-purple-500/10 ring-1 ring-white/[0.04] transition-all group-hover:ring-blue-500/20">
                      <Code2 size={14} className="text-blue-400/70" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-zinc-200 transition-colors group-hover:text-white">
                        {example.name}
                      </div>
                      <div className="mt-0.5 text-[11px] leading-4 text-zinc-500">
                        {example.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
