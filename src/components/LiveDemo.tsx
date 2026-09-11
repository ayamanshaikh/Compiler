"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { animate, stagger } from "animejs";

/* ─── demo data ────────────────────────────────────────────────────── */

const DEMO_CODE = `public class Main {
    public static void main(String[] args) {
        int[] arr = {5, 3, 8, 1};

        for (int i = 0; i < arr.length; i++) {
            for (int j = 0; j < arr.length - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }

        System.out.println("Sorted!");
    }
}`;

interface DemoStep {
  line: number;
  array: number[];
  compare?: { left: number; right: number; result: boolean; indices: [number, number] };
  swap?: { indices: [number, number]; before: number[]; after: number[] };
  explanation: string;
  whatHappening: string;
  why: string;
}

const DEMO_STEPS: DemoStep[] = [
  { line: 4, array: [5,3,8,1], explanation: "Array initialized", whatHappening: "Declaring and initializing an integer array", why: "This stores the values we want to sort in memory" },
  { line: 8, array: [5,3,8,1], compare: { left: 5, right: 3, result: true, indices: [0,1] }, explanation: "Comparing 5 and 3. TRUE.", whatHappening: "Comparing two adjacent elements in the array", why: "Bubble Sort checks if adjacent elements are in the wrong order" },
  { line: 9, array: [3,5,8,1], swap: { indices: [0,1], before: [5,3,8,1], after: [3,5,8,1] }, explanation: "Swapped!", whatHappening: "Swapping elements that are in the wrong order", why: "When left > right, the larger value bubbles up rightward" },
  { line: 8, array: [3,5,8,1], compare: { left: 5, right: 8, result: false, indices: [1,2] }, explanation: "Comparing 5 and 8. FALSE.", whatHappening: "Comparing the next pair of adjacent elements", why: "No swap needed - 5 is already less than 8" },
  { line: 8, array: [3,5,8,1], compare: { left: 8, right: 1, result: true, indices: [2,3] }, explanation: "Comparing 8 and 1. TRUE.", whatHappening: "Comparing the last pair in this pass", why: "8 is much larger than 1, so they need to be swapped" },
  { line: 9, array: [3,5,1,8], swap: { indices: [2,3], before: [3,5,8,1], after: [3,5,1,8] }, explanation: "Swapped!", whatHappening: "The largest value reaches the end", why: "After pass 1, element 8 is in its final position" },
  { line: 8, array: [3,5,1,8], compare: { left: 3, right: 5, result: false, indices: [0,1] }, explanation: "Comparing 3 and 5. FALSE.", whatHappening: "Starting pass 2 of the sort", why: "Pass 2 only needs to check the unsorted portion" },
  { line: 8, array: [3,5,1,8], compare: { left: 5, right: 1, result: true, indices: [1,2] }, explanation: "Comparing 5 and 1. TRUE.", whatHappening: "Checking the next pair in pass 2", why: "5 is still out of order relative to 1" },
  { line: 9, array: [3,1,5,8], swap: { indices: [1,2], before: [3,5,1,8], after: [3,1,5,8] }, explanation: "Swapped!", whatHappening: "Swapping another pair in pass 2", why: "Larger values continue bubbling rightward" },
  { line: 8, array: [3,1,5,8], compare: { left: 3, right: 1, result: true, indices: [0,1] }, explanation: "Comparing 3 and 1. TRUE.", whatHappening: "Last comparison of pass 2", why: "3 is still greater than 1 - one more swap needed" },
  { line: 9, array: [1,3,5,8], swap: { indices: [0,1], before: [3,1,5,8], after: [1,3,5,8] }, explanation: "Swapped! Array sorted!", whatHappening: "Final swap - the array is now fully sorted", why: "All elements are now in ascending order" },
];

/* ─── helpers ──────────────────────────────────────────────────────── */

function barHeight(val: number) {
  return 24 + (val / 8) * 56;
}

/* ─── component ─────────────────────────────────────────────────────── */

export default function LiveDemo() {
  const [phase, setPhase] = useState<"typing" | "compiling" | "visualizing">("typing");
  const [typedCode, setTypedCode] = useState("");
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [activeArray, setActiveArray] = useState<number[]>([5, 3, 8, 1]);
  const [highlightIndices, setHighlightIndices] = useState<number[]>([]);
  const [swapping, setSwapping] = useState(false);
  const [swapPositions, setSwapPositions] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const typingRef = useRef<NodeJS.Timeout | null>(null);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const explanationRef = useRef<HTMLDivElement>(null);
  const prevArrayRef = useRef<number[]>([5, 3, 8, 1]);

  // Typing phase
  useEffect(() => {
    let idx = 0;
    const type = () => {
      if (idx < DEMO_CODE.length) {
        idx = Math.min(idx + 3, DEMO_CODE.length);
        setTypedCode(DEMO_CODE.slice(0, idx));
        typingRef.current = setTimeout(type, 18);
      } else {
        setTimeout(() => setPhase("compiling"), 400);
      }
    };
    type();
    return () => { if (typingRef.current) clearTimeout(typingRef.current); };
  }, []);

  // Compile phase
  useEffect(() => {
    if (phase !== "compiling") return;
    const t = setTimeout(() => setPhase("visualizing"), 1600);
    return () => clearTimeout(t);
  }, [phase]);

  // Animate array bars with anime.js
  const animateBars = useCallback((newArray: number[], compareIndices?: number[], isSwap?: boolean, swapIdxs?: number[]) => {
    const prevArray = prevArrayRef.current;
    barRefs.current.forEach((bar, i) => {
      if (!bar) return;
      animate(bar, {
        height: [barHeight(prevArray[i] ?? newArray[i]), barHeight(newArray[i])],
        duration: 500,
        ease: "outExpo",
      });
      if (compareIndices && compareIndices.includes(i)) {
        animate(bar, {
          scale: [1, 1.15, 1],
          duration: 600,
          ease: "outElastic(1, 0.5)",
          delay: i === compareIndices[0] ? 0 : 80,
        });
      }
      if (isSwap && swapIdxs && swapIdxs.includes(i)) {
        animate(bar, {
          scale: [1, 1.2, 0.95, 1.05, 1],
          translateY: [0, -12, 0],
          duration: 700,
          ease: "outElastic(1, 0.4)",
          delay: i === swapIdxs[0] ? 0 : 100,
        });
      }
    });
    prevArrayRef.current = [...newArray];
  }, []);

  // Animate explanation card
  const animateExplanation = useCallback(() => {
    if (!explanationRef.current) return;
    const els = explanationRef.current.querySelectorAll("[data-animate]");
    if (els.length) {
      animate(Array.from(els), {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 400,
        ease: "outExpo",
        delay: stagger(80),
      });
    }
  }, []);

  // Visualization auto-step. advanceStep schedules its own next call via a
  // ref so the callback never references itself during its initializer
  // (keeps it compliant with React 19's "no access before declaration" rule).
  const advanceStepRef = useRef<(idx: number) => void>(() => {});

  const advanceStep = useCallback((idx: number) => {
    if (idx >= DEMO_STEPS.length) {
      stepTimerRef.current = setTimeout(() => {
        setCurrentStepIdx(0);
        setActiveArray([5, 3, 8, 1]);
        setHighlightIndices([]);
        setShowExplanation(false);
        prevArrayRef.current = [5, 3, 8, 1];
      }, 3000);
      return;
    }

    const step = DEMO_STEPS[idx];
    setCurrentStepIdx(idx);
    setActiveArray(step.array);
    setShowExplanation(true);

    if (step.compare) {
      setHighlightIndices(step.compare.indices);
      setSwapping(false);
      setSwapPositions([]);
      animateBars(step.array, step.compare.indices, false);
    } else if (step.swap) {
      setSwapping(true);
      setSwapPositions(step.swap.indices);
      animateBars(step.array, undefined, true, step.swap.indices);
      setTimeout(() => {
        setSwapping(false);
        setHighlightIndices([]);
        setSwapPositions([]);
        setShowExplanation(false);
      }, 700);
    } else {
      setHighlightIndices([]);
      setSwapping(false);
      animateBars(step.array);
    }

    setTimeout(animateExplanation, 50);

    const delay = step.swap ? 1200 : step.compare ? 1500 : 1000;
    stepTimerRef.current = setTimeout(() => advanceStepRef.current(idx + 1), delay);
  }, [animateBars, animateExplanation]);

  useEffect(() => {
    advanceStepRef.current = advanceStep;
  }, [advanceStep]);

  useEffect(() => {
    if (phase !== "visualizing") return;
    // Defer so the state updates advanceStep performs happen in a timer
    // callback, not synchronously inside the effect body.
    const startTimer = setTimeout(() => advanceStep(0), 0);
    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      clearTimeout(startTimer);
    };
  }, [phase, advanceStep]);

  const currentStep = phase === "visualizing" ? DEMO_STEPS[Math.min(currentStepIdx, DEMO_STEPS.length - 1)] : null;
  const displayLine = currentStep ? currentStep.line : 0;

  return (
    <div className="grid md:grid-cols-2">
      {/* Mock Editor */}
      <div className="border-b border-white/[0.06] p-5 md:border-b-0 md:border-r">
        <div className="rounded-xl bg-[#06090f] p-5 font-mono text-[12.5px] leading-[22px]">
          {typedCode.split("\n").map((line, i) => {
            const lineNum = i + 1;
            const isActive = phase === "visualizing" && displayLine === lineNum;
            return (
              <div key={i} className={`-mx-5 px-5 transition-all duration-300 ${isActive ? "bg-blue-500/10 border-l-2 border-blue-500/60" : ""}`}>
                <span className="mr-4 select-none text-zinc-700">{lineNum}</span>
                <SyntaxLine text={line} />
                {isActive && <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-blue-400" />}
              </div>
            );
          })}
          {phase === "typing" && <div className="-mx-5 px-5"><span className="mr-4 select-none text-zinc-700">{typedCode.split("\n").length}</span><span className="inline-block h-4 w-2 animate-pulse bg-blue-400" /></div>}
        </div>
      </div>

      {/* Right panel */}
      <div className="p-5">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[11px] text-zinc-600">
            {phase === "typing" && <><div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" /> Writing code...</>}
            {phase === "compiling" && <><Loader2 size={12} className="animate-spin text-blue-400" /><span className="text-blue-400">Compiling & running...</span></>}
            {phase === "visualizing" && currentStep && <><div className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Step {Math.min(currentStepIdx + 1, DEMO_STEPS.length)} of {DEMO_STEPS.length} - {currentStep.compare ? "Comparing" : currentStep.swap ? "Swapping" : "Init"}</>}
          </div>

          {phase === "compiling" && (
            <div className="animate-scale-in flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span className="text-[12px] text-emerald-300">Compiled successfully - launching visualization...</span>
            </div>
          )}

          {phase === "visualizing" && currentStep && showExplanation && (
            <div ref={explanationRef} className="border-gradient-green rounded-xl p-4">
              <div data-animate className="mb-2 flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/15">
                  <Sparkles size={12} className="text-emerald-400" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">What is happening?</span>
              </div>
              <p data-animate className="text-[13px] leading-6 text-zinc-300">{currentStep.whatHappening}</p>
              <div data-animate className="mt-3 border-t border-white/[0.04] pt-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400">Why?</span>
                <p className="mt-1 text-[13px] leading-6 text-zinc-400">{currentStep.why}</p>
              </div>
              {currentStep.compare && (
                <div data-animate className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-white/[0.02] p-2">
                  <span className="font-mono text-[12px] text-zinc-400">{currentStep.compare.left}</span>
                  <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${currentStep.compare.result ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>{">"}</span>
                  <span className="font-mono text-[12px] text-zinc-400">{currentStep.compare.right}</span>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${currentStep.compare.result ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>{currentStep.compare.result ? "TRUE" : "FALSE"}</span>
                </div>
              )}
            </div>
          )}

          {/* Array Viz */}
          <div className="rounded-xl bg-[#06090f] p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Array State</p>
            <div className="flex items-end justify-center gap-3" style={{ perspective: "600px" }}>
              {activeArray.map((val, i) => {
                const isHighlighted = highlightIndices.includes(i);
                const isSwapPos = swapPositions.includes(i);
                return (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div
                      ref={(el) => { barRefs.current[i] = el; }}
                      className={`array-bar-3d flex items-center justify-center rounded-xl border font-mono text-sm font-bold ${
                        isSwapPos && swapping
                          ? "border-emerald-400/50 bg-gradient-to-b from-emerald-500/30 to-emerald-500/10 text-emerald-300 shadow-lg shadow-emerald-500/15"
                          : isHighlighted
                            ? "border-blue-400/40 bg-gradient-to-b from-blue-500/25 to-cyan-500/10 text-blue-300 shadow-lg shadow-blue-500/10"
                            : "border-white/[0.06] bg-white/[0.03] text-zinc-400"
                      }`}
                      style={{ width: 48, height: barHeight(val) }}
                    >
                      {val}
                    </div>
                    <span className="text-[10px] text-zinc-700">[{i}]</span>
                  </div>
                );
              })}
            </div>

            {currentStep?.compare && (
              <div className="animate-slide-in mt-4 flex items-center justify-center gap-2 rounded-lg bg-white/[0.02] p-2">
                <span className="font-mono text-[12px] text-zinc-400">{currentStep.compare.left}</span>
                <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${currentStep.compare.result ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>{">"}</span>
                <span className="font-mono text-[12px] text-zinc-400">{currentStep.compare.right}</span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${currentStep.compare.result ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>{currentStep.compare.result ? "TRUE" : "FALSE"}</span>
              </div>
            )}
            {currentStep?.swap && (
              <div className="animate-slide-in mt-4 flex items-center justify-center gap-2 rounded-lg bg-emerald-500/5 p-2">
                <span className="text-[11px] font-medium text-emerald-400">Swapped positions [{swapPositions[0]}] and [{swapPositions[1]}]</span>
              </div>
            )}
          </div>

          {phase === "visualizing" && currentStep && (
            <div className="flex gap-2">
              <div className="rounded-lg border border-blue-500/15 bg-blue-500/10 px-3 py-1.5 text-[11px] font-medium text-blue-300">Line {currentStep.line}</div>
              <div className="rounded-lg border border-purple-500/15 bg-purple-500/10 px-3 py-1.5 text-[11px] font-medium text-purple-300">{currentStep.compare ? "COMPARE" : currentStep.swap ? "SWAP" : "INIT"}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Token-based Java syntax highlighter ────────────────────────────── */

type TokenType = "keyword" | "type" | "string" | "method" | "number" | "operator" | "plain";
interface Token { text: string; type: TokenType; }
const KEYWORDS = new Set(["public", "class", "static", "void", "new", "return", "if", "for", "while", "else", "break", "continue"]);
const TYPES = new Set(["int", "double", "float", "long", "boolean", "char", "String", "var"]);

function tokenize(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let end = i + 1;
      while (end < line.length && line[end] !== '"') { if (line[end] === '\\') end++; end++; }
      end = Math.min(end + 1, line.length);
      tokens.push({ text: line.slice(i, end), type: "string" });
      i = end; continue;
    }
    if (/[0-9]/.test(line[i]) && (i === 0 || !/[a-zA-Z]/.test(line[i - 1]))) {
      let end = i;
      while (end < line.length && /[0-9]/.test(line[end])) end++;
      tokens.push({ text: line.slice(i, end), type: "number" });
      i = end; continue;
    }
    if (/[a-zA-Z_]/.test(line[i])) {
      let end = i;
      while (end < line.length && /[a-zA-Z0-9_]/.test(line[end])) end++;
      const word = line.slice(i, end);
      let type: TokenType = "plain";
      if (KEYWORDS.has(word)) type = "keyword";
      else if (TYPES.has(word)) type = "type";
      else if (end < line.length && line[end] === "(") type = "method";
      tokens.push({ text: word, type });
      i = end; continue;
    }
    if ("=<>!+-*/%".includes(line[i])) {
      let end = i + 1;
      while (end < line.length && "=<>!+-*/%".includes(line[end])) end++;
      tokens.push({ text: line.slice(i, end), type: "operator" });
      i = end; continue;
    }
    tokens.push({ text: line[i], type: "plain" });
    i++;
  }
  return tokens;
}

function SyntaxLine({ text }: { text: string }) {
  if (!text.trim()) return <span>{"\u00A0"}</span>;
  return (
    <span>
      {tokenize(text).map((token, i) => {
        switch (token.type) {
          case "keyword": return <span key={i} className="text-purple-400 font-semibold">{token.text}</span>;
          case "type": return <span key={i} className="text-purple-400">{token.text}</span>;
          case "string": return <span key={i} className="text-emerald-400">{token.text}</span>;
          case "method": return <span key={i} className="text-blue-300">{token.text}</span>;
          case "number": return <span key={i} className="text-amber-300">{token.text}</span>;
          case "operator": return <span key={i} className="text-red-400">{token.text}</span>;
          default: return <span key={i}>{token.text}</span>;
        }
      })}
    </span>
  );
}
