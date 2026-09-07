"use client";

import { GraduationCap, Code } from "lucide-react";

interface LearningModeToggleProps {
  learningMode: boolean;
  onToggle: () => void;
}

export default function LearningModeToggle({
  learningMode,
  onToggle,
}: LearningModeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all duration-300 ${
        learningMode
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 shadow-sm shadow-emerald-500/10 ring-1 ring-emerald-500/15"
          : "border-white/[0.06] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-white ring-1 ring-white/[0.04]"
      }`}
      title={learningMode ? "Learning Mode: simple explanations" : "Developer Mode: technical details"}
    >
      <div className="relative">
        {learningMode ? <GraduationCap size={13} /> : <Code size={13} />}
      </div>
      <span>{learningMode ? "Learning" : "Developer"}</span>

      {/* Mini 3D toggle indicator */}
      <div
        className={`relative h-4 w-7 rounded-full transition-all duration-300 ${
          learningMode
            ? "bg-emerald-500/25 ring-1 ring-emerald-500/20"
            : "bg-white/[0.06] ring-1 ring-white/[0.06]"
        }`}
      >
        <div
          className={`absolute top-0.5 h-3 w-3 rounded-full transition-all duration-300 ${
            learningMode
              ? "left-3.5 bg-emerald-400 shadow-sm shadow-emerald-400/50"
              : "left-0.5 bg-zinc-400"
          }`}
        />
      </div>
    </button>
  );
}
