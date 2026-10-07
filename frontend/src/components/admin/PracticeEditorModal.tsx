"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { TopicDifficulty } from "@/lib/api/types";
import { QuestionType, AdminPracticeQuestion, AdminQuestionCreatePayload } from "@/lib/api/admin";
import {
  Eye,
  Edit3,
  Plus,
  Trash2,
  Code2,
  CheckCircle2,
  Lightbulb,
  FileCode,
} from "lucide-react";

interface PracticeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: AdminQuestionCreatePayload) => Promise<void>;
  initialQuestion?: AdminPracticeQuestion | null;
  isSaving: boolean;
}

const QUESTION_TYPES: { type: QuestionType; label: string; isCode: boolean }[] = [
  { type: "MCQ", label: "Multiple Choice", isCode: false },
  { type: "PREDICT_OUTPUT", label: "Predict Output", isCode: false },
  { type: "FIND_ERROR", label: "Find Error", isCode: false },
  { type: "MATCH_CONCEPT", label: "Match Concept", isCode: false },
  { type: "WRITE_CODE", label: "Write Code", isCode: true },
  { type: "FIX_CODE", label: "Fix Code", isCode: true },
  { type: "DEBUG_CODE", label: "Debug Code", isCode: true },
  { type: "ALGORITHM", label: "Algorithm Challenge", isCode: true },
];

export function PracticeEditorModal({
  isOpen,
  onClose,
  onSave,
  initialQuestion,
  isSaving,
}: PracticeEditorModalProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // Form states initialized directly from initialQuestion
  const [title, setTitle] = useState(initialQuestion?.title || "");
  const [topicSlug, setTopicSlug] = useState(initialQuestion?.topicSlug || "variables");
  const [questionType, setQuestionType] = useState<QuestionType>(initialQuestion?.questionType || "MCQ");
  const [difficulty, setDifficulty] = useState<TopicDifficulty>(initialQuestion?.difficulty || "BEGINNER");
  const [prompt, setPrompt] = useState(initialQuestion?.prompt || "");
  const [codeSnippet, setCodeSnippet] = useState(initialQuestion?.codeSnippet || "");
  const [options, setOptions] = useState<string[]>(
    initialQuestion?.options?.length
      ? initialQuestion.options
      : ["Option A", "Option B", "Option C", "Option D"]
  );
  const [correctAnswer, setCorrectAnswer] = useState(initialQuestion?.correctAnswer || "");
  const [expectedOutput, setExpectedOutput] = useState(initialQuestion?.expectedOutput || "");
  const [starterCode, setStarterCode] = useState(initialQuestion?.starterCode || "");
  const [explanation, setExplanation] = useState(initialQuestion?.explanation || "");
  const [hint, setHint] = useState(initialQuestion?.hint || "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isCodeChallenge =
    questionType === "WRITE_CODE" ||
    questionType === "FIX_CODE" ||
    questionType === "DEBUG_CODE" ||
    questionType === "ALGORITHM";

  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMsg("Question title is required");
      return;
    }
    if (!topicSlug.trim()) {
      setErrorMsg("Topic slug is required");
      return;
    }
    if (!prompt.trim()) {
      setErrorMsg("Question prompt is required");
      return;
    }
    if (!correctAnswer.trim()) {
      setErrorMsg("Correct answer / solution is required");
      return;
    }
    if (!explanation.trim()) {
      setErrorMsg("Explanation is required");
      return;
    }

    const payload: AdminQuestionCreatePayload = {
      title: title.trim(),
      topicSlug: topicSlug.trim(),
      questionType,
      difficulty,
      prompt: prompt.trim(),
      codeSnippet: codeSnippet.trim() || undefined,
      options: isCodeChallenge ? [] : options.map((o) => o.trim()).filter(Boolean),
      correctAnswer: correctAnswer.trim(),
      expectedOutput: expectedOutput.trim() || undefined,
      starterCode: starterCode.trim() || undefined,
      explanation: explanation.trim(),
      hint: hint.trim() || undefined,
    };

    try {
      setErrorMsg(null);
      await onSave(payload);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save question");
    }
  };

  const updateOption = (index: number, val: string) => {
    const next = [...options];
    next[index] = val;
    setOptions(next);
  };
  const addOption = () => setOptions([...options, ""]);
  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialQuestion ? `Edit Question: ${initialQuestion.title}` : "Create Practice Question"}
      description="Design coding questions, output predictions, and multiple-choice assertions."
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={activeTab === "edit" ? "primary" : "outline"}
              size="sm"
              onClick={() => setActiveTab("edit")}
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            >
              Form Editor
            </Button>
            <Button
              type="button"
              variant={activeTab === "preview" ? "primary" : "outline"}
              size="sm"
              onClick={() => setActiveTab("preview")}
              leftIcon={<Eye className="w-3.5 h-3.5" />}
            >
              Live Preview
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving}>
              {initialQuestion ? "Update Question" : "Publish Question"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg">
            {errorMsg}
          </div>
        )}

        {activeTab === "edit" ? (
          <div className="space-y-5">
            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Question Title <span className="text-rose-400">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Reverse an Array In-Place"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Topic Slug <span className="text-rose-400">*</span>
                </label>
                <Input
                  value={topicSlug}
                  onChange={(e) => setTopicSlug(e.target.value)}
                  placeholder="e.g. arrays, variables"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as TopicDifficulty)}
                  aria-label="Question Difficulty"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="BEGINNER">BEGINNER</option>
                  <option value="INTERMEDIATE">INTERMEDIATE</option>
                  <option value="ADVANCED">ADVANCED</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-zinc-300 mb-1">Archetype / Question Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {QUESTION_TYPES.map((qt) => (
                    <button
                      key={qt.type}
                      type="button"
                      onClick={() => setQuestionType(qt.type)}
                      className={`px-2.5 py-1.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${
                        questionType === qt.type
                          ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                          : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <span className="truncate">{qt.label}</span>
                      {qt.isCode && <Code2 className="w-3 h-3 text-indigo-400 shrink-0 ml-1" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Question Prompt <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Clear question statement explaining the task or question..."
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Code Snippet (Optional for display) */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Context Code Snippet (Optional)
              </label>
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="Code snippet shown above options or challenge..."
                rows={4}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Options (If Choice / Predict / Match) */}
            {!isCodeChallenge && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-zinc-300">Answer Options</label>
                  <Button type="button" variant="ghost" size="sm" onClick={addOption} leftIcon={<Plus className="w-3 h-3" />}>
                    Add Option
                  </Button>
                </div>
                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-5 text-center text-xs font-mono text-zinc-500">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <Input
                        value={opt}
                        onChange={(e) => updateOption(idx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        className="text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(idx)}
                        className="text-zinc-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Starter Code (If Code Challenge) */}
            {isCodeChallenge && (
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Starter Code (Provided to student in editor)
                </label>
                <textarea
                  value={starterCode}
                  onChange={(e) => setStarterCode(e.target.value)}
                  placeholder="public class Solution {\n    // Student template\n}"
                  rows={4}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Correct Answer & Expected Output */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Correct Answer / Solution Key <span className="text-rose-400">*</span>
                </label>
                <Input
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  placeholder={isCodeChallenge ? "Full reference solution" : "e.g. A or 42"}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Expected Console Output (Optional for OpenJDK check)
                </label>
                <Input
                  value={expectedOutput}
                  onChange={(e) => setExpectedOutput(e.target.value)}
                  placeholder="e.g. [1, 2, 3] or 42"
                />
              </div>
            </div>

            {/* Explanation & Hint */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Pedagogical Explanation <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain why the answer is correct and break down the solution..."
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Optional Hint
                </label>
                <Input
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="Subtle clue for students when stuck..."
                />
              </div>
            </div>
          </div>
        ) : (
          /* Live Learner Preview Mode */
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-4 text-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    difficulty === "BEGINNER"
                      ? "success"
                      : difficulty === "INTERMEDIATE"
                      ? "warning"
                      : "danger"
                  }
                  size="sm"
                >
                  {difficulty}
                </Badge>
                <Badge variant="neutral" size="sm">
                  {questionType}
                </Badge>
                <span className="text-xs font-mono text-zinc-500">topic: {topicSlug}</span>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-zinc-100">{title || "Untitled Question"}</h2>
              <p className="text-xs text-zinc-300 mt-1 whitespace-pre-wrap leading-relaxed">
                {prompt || "No prompt provided."}
              </p>
            </div>

            {/* Context Code */}
            {codeSnippet && (
              <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/80">
                <div className="px-3 py-1 bg-zinc-850 text-[11px] font-mono text-zinc-400 border-b border-zinc-800">
                  Snippet
                </div>
                <pre className="p-3 font-mono text-xs text-zinc-200 overflow-x-auto">
                  {codeSnippet}
                </pre>
              </div>
            )}

            {/* Options Preview */}
            {!isCodeChallenge && options.filter(Boolean).length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-zinc-400">Options:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {options.filter(Boolean).map((opt, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs text-zinc-300 flex items-center gap-2"
                    >
                      <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 text-[11px] flex items-center justify-center font-mono">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Starter Code Preview */}
            {isCodeChallenge && starterCode && (
              <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/80">
                <div className="px-3 py-1 bg-zinc-850 text-[11px] font-mono text-indigo-400 border-b border-zinc-800 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5" /> Student Starter Template
                </div>
                <pre className="p-3 font-mono text-xs text-zinc-200 overflow-x-auto">
                  {starterCode}
                </pre>
              </div>
            )}

            {/* Admin Answer Reveal */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-1">
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Correct Answer / Key
              </div>
              <div className="font-mono text-xs text-zinc-200 bg-zinc-900/80 p-2 rounded border border-emerald-500/30">
                {correctAnswer || "(None specified)"}
              </div>
              {expectedOutput && (
                <div className="text-[11px] text-zinc-400 mt-1">
                  Expected Standard Output: <span className="font-mono text-zinc-200">{expectedOutput}</span>
                </div>
              )}
            </div>

            {/* Explanation Preview */}
            {explanation && (
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                <div className="text-xs font-semibold text-zinc-400 mb-1">Explanation Walkthrough</div>
                <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{explanation}</div>
              </div>
            )}

            {/* Hint */}
            {hint && (
              <div className="text-xs text-amber-300/80 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Hint: {hint}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
