"use client";

import React, { useState, useEffect } from "react";
import {
  TraceHistoryEntry,
  getTraceHistory,
  deleteTraceHistoryItem,
  clearTraceHistory,
} from "@/lib/visualizer/traceHistory";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  History,
  X,
  Trash2,
  Clock,
  Play,
  FileCode,
  GitCompare,
  Layers,
} from "lucide-react";

interface TraceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrace: (entry: TraceHistoryEntry) => void;
}

export function TraceHistoryModal({
  isOpen,
  onClose,
  onSelectTrace,
}: TraceHistoryModalProps) {
  const [historyItems, setHistoryItems] = useState<TraceHistoryEntry[]>(() => getTraceHistory());
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTraceHistoryItem(id);
    setHistoryItems(getTraceHistory());
    setSelectedForCompare((prev) => prev.filter((item) => item !== id));
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all trace execution history?")) {
      clearTraceHistory();
      setHistoryItems([]);
      setSelectedForCompare([]);
      setIsComparing(false);
    }
  };

  const handleToggleCompare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedForCompare((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const compareA = historyItems.find((h) => h.id === selectedForCompare[0]);
  const compareB = historyItems.find((h) => h.id === selectedForCompare[1]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trace-history-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent/10 border border-accent/20 text-accent">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="trace-history-title" className="text-base font-bold text-zinc-100 font-sans">
                  Trace Execution History
                </h3>
                <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                  {historyItems.length} Saved
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 font-sans">
                Recall previously executed programs and compare state transitions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {historyItems.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs text-zinc-400 hover:text-rose-400"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Clear All
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors cursor-pointer"
              aria-label="Close history modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Comparison Bar (When 2 items selected) */}
        {selectedForCompare.length === 2 && (
          <div className="my-3 p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-300">
              <GitCompare className="w-4 h-4 text-indigo-400" />
              <span>2 Runs Selected for Comparison</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsComparing(!isComparing)}
              className="text-xs border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/40"
            >
              {isComparing ? "Hide Comparison" : "View Comparison"}
            </Button>
          </div>
        )}

        {/* Compare Side-by-Side View */}
        {isComparing && compareA && compareB && (
          <div className="my-3 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 grid grid-cols-2 gap-4 text-xs font-mono flex-shrink-0">
            <div className="space-y-2 p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80">
              <div className="font-bold text-zinc-200 truncate">{compareA.title}</div>
              <div className="text-zinc-400 text-[11px]">{new Date(compareA.timestamp).toLocaleTimeString()}</div>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                <span className="text-zinc-500">Steps:</span>
                <span className="text-zinc-200 font-bold">{compareA.stepCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Duration:</span>
                <span className="text-zinc-200">{compareA.executionTimeMs}ms</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onSelectTrace(compareA);
                  onClose();
                }}
                className="w-full text-xs mt-2"
              >
                Replay Run A
              </Button>
            </div>

            <div className="space-y-2 p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80">
              <div className="font-bold text-zinc-200 truncate">{compareB.title}</div>
              <div className="text-zinc-400 text-[11px]">{new Date(compareB.timestamp).toLocaleTimeString()}</div>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                <span className="text-zinc-500">Steps:</span>
                <span className="text-zinc-200 font-bold">{compareB.stepCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Duration:</span>
                <span className="text-zinc-200">{compareB.executionTimeMs}ms</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onSelectTrace(compareB);
                  onClose();
                }}
                className="w-full text-xs mt-2"
              >
                Replay Run B
              </Button>
            </div>
          </div>
        )}

        {/* History Item List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 min-h-[260px]">
          {historyItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-center text-zinc-500">
              <Clock className="w-10 h-10 text-zinc-600 mb-2 stroke-[1.5]" />
              <p className="text-sm font-medium text-zinc-300">No Execution History Yet</p>
              <p className="text-xs text-zinc-500 max-w-sm mt-1">
                Run Java programs in the visualizer. Each completed execution trace will be saved here automatically for replay and comparison.
              </p>
            </div>
          ) : (
            historyItems.map((item) => {
              const isSelected = selectedForCompare.includes(item.id);
              const dateObj = new Date(item.timestamp);
              const timeFormatted = dateObj.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });
              const dateFormatted = dateObj.toLocaleDateString([], {
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectTrace(item);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left flex items-center justify-between gap-4 ${
                    isSelected
                      ? "bg-indigo-950/20 border-indigo-500/60 shadow-sm"
                      : "bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-accent flex-shrink-0 mt-0.5">
                      <FileCode className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-zinc-200 truncate max-w-md">
                          {item.title}
                        </span>
                        <Badge
                          variant={item.status === "SUCCESS" ? "success" : "danger"}
                          size="sm"
                          className="text-[9px] uppercase font-mono px-1.5 py-0"
                        >
                          {item.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-zinc-400" />
                          <span>{item.stepCount} steps</span>
                        </span>
                        <span>•</span>
                        <span>{item.executionTimeMs}ms</span>
                        <span>•</span>
                        <span>{dateFormatted} at {timeFormatted}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleToggleCompare(item.id, e)}
                      title={isSelected ? "Remove from comparison" : "Select to compare"}
                      className={`px-2 py-1 rounded-md text-[11px] font-mono border transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600/30 border-indigo-500 text-indigo-300 font-bold"
                          : "bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Compare
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Delete from history"
                      className="p-1.5 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-zinc-800/80 transition-colors cursor-pointer"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        onSelectTrace(item);
                        onClose();
                      }}
                      className="text-xs px-2.5 py-1 h-7 font-sans"
                      leftIcon={<Play className="w-3 h-3 fill-current" />}
                    >
                      Replay
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 font-mono flex-shrink-0">
          <span>Tip: Select any 2 runs to compare step count & execution performance</span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
