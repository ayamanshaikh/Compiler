"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Keyboard, Play, ChevronRight, ChevronLeft, FastForward, Rewind, Eye, HelpCircle, Bookmark } from "lucide-react";

interface TraceShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keyDesc: string;
  action: string;
  icon: React.ReactNode;
}

const SHORTCUTS: ShortcutItem[] = [
  {
    keyDesc: "Space",
    action: "Toggle Play / Pause simulation",
    icon: <Play className="w-3.5 h-3.5 text-accent" />,
  },
  {
    keyDesc: "→ (Right Arrow)",
    action: "Step forward by 1 execution event",
    icon: <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />,
  },
  {
    keyDesc: "← (Left Arrow)",
    action: "Step backward by 1 execution event",
    icon: <ChevronLeft className="w-3.5 h-3.5 text-zinc-300" />,
  },
  {
    keyDesc: "] or PageDown",
    action: "Jump to Next Keyframe (state mutation)",
    icon: <FastForward className="w-3.5 h-3.5 text-accent" />,
  },
  {
    keyDesc: "[ or PageUp",
    action: "Jump to Previous Keyframe",
    icon: <Rewind className="w-3.5 h-3.5 text-accent" />,
  },
  {
    keyDesc: "Home / End",
    action: "Jump to First / Final execution step",
    icon: <Keyboard className="w-3.5 h-3.5 text-zinc-300" />,
  },
  {
    keyDesc: "V",
    action: "Toggle Visual Inspector vs Narrative View",
    icon: <Eye className="w-3.5 h-3.5 text-zinc-300" />,
  },
  {
    keyDesc: "B",
    action: "Toggle Step Bookmark / Pin",
    icon: <Bookmark className="w-3.5 h-3.5 text-accent" />,
  },
  {
    keyDesc: "? (Shift + /)",
    action: "Show / hide keyboard shortcuts guide",
    icon: <HelpCircle className="w-3.5 h-3.5 text-zinc-300" />,
  },
];

export function TraceShortcutsModal({ isOpen, onClose }: TraceShortcutsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Trace Visualizer Keyboard Shortcuts"
      description="Navigate through execution traces rapidly with hardware keyboard controls."
      maxWidth="md"
    >
      <div className="space-y-2 py-2">
        {SHORTCUTS.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800 text-xs font-mono"
          >
            <div className="flex items-center gap-2.5 text-zinc-300">
              {item.icon}
              <span>{item.action}</span>
            </div>
            <kbd className="px-2 py-1 rounded bg-zinc-950 border border-zinc-700 text-zinc-200 font-bold text-[11px] shadow-xs">
              {item.keyDesc}
            </kbd>
          </div>
        ))}
      </div>
    </Modal>
  );
}
