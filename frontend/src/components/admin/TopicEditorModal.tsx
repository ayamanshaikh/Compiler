"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { TopicDifficulty, CodeExample } from "@/lib/api/types";
import { TopicCreatePayload } from "@/lib/api/admin";
import {
  Eye,
  Edit3,
  Plus,
  Trash2,
  Code,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

interface TopicEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: TopicCreatePayload) => Promise<void>;
  initialTopic?: TopicCreatePayload | null;
  isSaving: boolean;
}

export function TopicEditorModal({
  isOpen,
  onClose,
  onSave,
  initialTopic,
  isSaving,
}: TopicEditorModalProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // Form states initialized directly from initialTopic
  const [title, setTitle] = useState(initialTopic?.title || "");
  const [slug, setSlug] = useState(initialTopic?.slug || "");
  const [description, setDescription] = useState(initialTopic?.description || "");
  const [difficulty, setDifficulty] = useState<TopicDifficulty>(initialTopic?.difficulty || "BEGINNER");
  const [internalUnit, setInternalUnit] = useState(initialTopic?.internalUnit || "Unit 1: Fundamentals");
  const [sortOrder, setSortOrder] = useState(initialTopic?.sortOrder ?? 1);
  const [explanation, setExplanation] = useState(initialTopic?.explanation || "");
  const [whyItMatters, setWhyItMatters] = useState(initialTopic?.whyItMatters || "");
  const [syntax, setSyntax] = useState(initialTopic?.syntax || "");
  const [keyPoints, setKeyPoints] = useState<string[]>(
    initialTopic?.keyPoints?.length ? initialTopic.keyPoints : [""]
  );
  const [commonMistakes, setCommonMistakes] = useState<string[]>(
    initialTopic?.commonMistakes?.length ? initialTopic.commonMistakes : [""]
  );
  const [relatedTopicSlugs, setRelatedTopicSlugs] = useState(
    (initialTopic?.relatedTopicSlugs || []).join(", ")
  );
  const [codeExamples, setCodeExamples] = useState<CodeExample[]>(
    initialTopic?.codeExamples?.length
      ? initialTopic.codeExamples
      : [
          {
            title: "Basic Example",
            code: "public class Example {\n    public static void main(String[] args) {\n        // Your code\n    }\n}",
            explanation: "Basic usage demonstration.",
          },
        ]
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!initialTopic) {
      // Auto-generate slug from title
      const derivedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(derivedSlug);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMsg("Topic title is required");
      return;
    }
    if (!slug.trim()) {
      setErrorMsg("Topic slug is required");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Topic description is required");
      return;
    }

    const payload: TopicCreatePayload = {
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim(),
      difficulty,
      internalUnit: internalUnit.trim(),
      sortOrder: Number(sortOrder) || 0,
      explanation: explanation.trim(),
      whyItMatters: whyItMatters.trim(),
      syntax: syntax.trim(),
      keyPoints: keyPoints.map((k) => k.trim()).filter(Boolean),
      commonMistakes: commonMistakes.map((m) => m.trim()).filter(Boolean),
      relatedTopicSlugs: relatedTopicSlugs
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      codeExamples: codeExamples.filter((ex) => ex.title.trim() && ex.code.trim()),
    };

    try {
      setErrorMsg(null);
      await onSave(payload);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save topic");
    }
  };

  // List helpers
  const updateKeyPoint = (index: number, val: string) => {
    const next = [...keyPoints];
    next[index] = val;
    setKeyPoints(next);
  };
  const addKeyPoint = () => setKeyPoints([...keyPoints, ""]);
  const removeKeyPoint = (index: number) => {
    if (keyPoints.length > 1) {
      setKeyPoints(keyPoints.filter((_, i) => i !== index));
    } else {
      setKeyPoints([""]);
    }
  };

  const updateMistake = (index: number, val: string) => {
    const next = [...commonMistakes];
    next[index] = val;
    setCommonMistakes(next);
  };
  const addMistake = () => setCommonMistakes([...commonMistakes, ""]);
  const removeMistake = (index: number) => {
    if (commonMistakes.length > 1) {
      setCommonMistakes(commonMistakes.filter((_, i) => i !== index));
    } else {
      setCommonMistakes([""]);
    }
  };

  const updateCodeExample = (index: number, field: keyof CodeExample, val: string) => {
    const next = [...codeExamples];
    next[index] = { ...next[index], [field]: val };
    setCodeExamples(next);
  };
  const addCodeExample = () =>
    setCodeExamples([
      ...codeExamples,
      { title: "New Example", code: "// code here", explanation: "" },
    ]);
  const removeCodeExample = (index: number) => {
    if (codeExamples.length > 1) {
      setCodeExamples(codeExamples.filter((_, i) => i !== index));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTopic ? `Edit Topic: ${initialTopic.title}` : "Create New Curriculum Topic"}
      description="Manage curriculum unit, explanations, canonical syntax, and code demonstrations."
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
              {initialTopic ? "Update Topic" : "Publish Topic"}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Topic Title <span className="text-rose-400">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Java Streams & Lambdas"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  URL Slug <span className="text-rose-400">*</span>
                </label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. java-streams-lambdas"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as TopicDifficulty)}
                  aria-label="Topic Difficulty"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="BEGINNER">BEGINNER</option>
                  <option value="INTERMEDIATE">INTERMEDIATE</option>
                  <option value="ADVANCED">ADVANCED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Internal Unit</label>
                <Input
                  value={internalUnit}
                  onChange={(e) => setInternalUnit(e.target.value)}
                  placeholder="e.g. Unit 3: Object-Oriented Programming"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Sort Order</label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Related Topics (comma-separated slugs)
                </label>
                <Input
                  value={relatedTopicSlugs}
                  onChange={(e) => setRelatedTopicSlugs(e.target.value)}
                  placeholder="arrays, loops, methods"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Description / Overview <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of the concept..."
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* In-depth Explanation */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Detailed Conceptual Explanation (Markdown Supported)
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Comprehensive breakdown of how this topic works under the hood..."
                rows={5}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Why It Matters & Syntax */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Why It Matters
                </label>
                <textarea
                  value={whyItMatters}
                  onChange={(e) => setWhyItMatters(e.target.value)}
                  placeholder="Practical engineering importance in enterprise Java..."
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Canonical Syntax Blueprint
                </label>
                <textarea
                  value={syntax}
                  onChange={(e) => setSyntax(e.target.value)}
                  placeholder="Type identifier = expression;"
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Key Points List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-zinc-300">Key Takeaways</label>
                <Button type="button" variant="ghost" size="sm" onClick={addKeyPoint} leftIcon={<Plus className="w-3 h-3" />}>
                  Add Point
                </Button>
              </div>
              <div className="space-y-2">
                {keyPoints.map((point, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={point}
                      onChange={(e) => updateKeyPoint(idx, e.target.value)}
                      placeholder={`Key point #${idx + 1}`}
                      className="text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeKeyPoint(idx)}
                      className="text-zinc-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Common Mistakes List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-zinc-300">Common Pitfalls & Mistakes</label>
                <Button type="button" variant="ghost" size="sm" onClick={addMistake} leftIcon={<Plus className="w-3 h-3" />}>
                  Add Pitfall
                </Button>
              </div>
              <div className="space-y-2">
                {commonMistakes.map((mistake, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={mistake}
                      onChange={(e) => updateMistake(idx, e.target.value)}
                      placeholder={`Common mistake #${idx + 1}`}
                      className="text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMistake(idx)}
                      className="text-zinc-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Code Examples List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-zinc-300">Code Demonstrations</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addCodeExample}
                  leftIcon={<Plus className="w-3 h-3" />}
                >
                  Add Example
                </Button>
              </div>
              <div className="space-y-4">
                {codeExamples.map((example, idx) => (
                  <div key={idx} className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-400">Example #{idx + 1}</span>
                      {codeExamples.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCodeExample(idx)}
                          className="text-zinc-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                    <Input
                      value={example.title}
                      onChange={(e) => updateCodeExample(idx, "title", e.target.value)}
                      placeholder="Example Title"
                    />
                    <textarea
                      value={example.code}
                      onChange={(e) => updateCodeExample(idx, "code", e.target.value)}
                      placeholder="Java Code..."
                      rows={4}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 font-mono text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                    />
                    <Input
                      value={example.explanation || ""}
                      onChange={(e) => updateCodeExample(idx, "explanation", e.target.value)}
                      placeholder="Example explanation / walkthrough"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Live Learner Preview Mode */
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-5 text-zinc-200">
            {/* Header Preview */}
            <div className="border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2 mb-2">
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
                {internalUnit && <Badge variant="neutral" size="sm">{internalUnit}</Badge>}
                <span className="text-xs font-mono text-zinc-500">Order #{sortOrder}</span>
              </div>
              <h1 className="text-2xl font-bold text-zinc-100">{title || "Untitled Topic"}</h1>
              <p className="text-xs text-zinc-400 mt-1">{description || "No description provided."}</p>
            </div>

            {/* Why it matters */}
            {whyItMatters && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-amber-300 mb-0.5">Why It Matters</div>
                  <div className="text-xs text-zinc-300 leading-relaxed">{whyItMatters}</div>
                </div>
              </div>
            )}

            {/* Canonical Syntax */}
            {syntax && (
              <div>
                <div className="text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-indigo-400" /> Syntax
                </div>
                <pre className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto">
                  {syntax}
                </pre>
              </div>
            )}

            {/* Explanation */}
            {explanation && (
              <div>
                <div className="text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Deep Dive Explanation
                </div>
                <div className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/80">
                  {explanation}
                </div>
              </div>
            )}

            {/* Key Points */}
            {keyPoints.filter(Boolean).length > 0 && (
              <div>
                <div className="text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Key Takeaways
                </div>
                <ul className="space-y-1 pl-4 list-disc text-xs text-zinc-300">
                  {keyPoints.filter(Boolean).map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pitfalls */}
            {commonMistakes.filter(Boolean).length > 0 && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                <div className="text-xs font-semibold text-rose-300 mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Common Pitfalls
                </div>
                <ul className="space-y-1 pl-4 list-disc text-xs text-zinc-300">
                  {commonMistakes.filter(Boolean).map((mistake, i) => (
                    <li key={i}>{mistake}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Code Examples */}
            {codeExamples.filter((e) => e.title && e.code).length > 0 && (
              <div>
                <div className="text-xs font-semibold text-zinc-400 mb-2">Code Examples</div>
                <div className="space-y-3">
                  {codeExamples
                    .filter((e) => e.title && e.code)
                    .map((ex, i) => (
                      <div key={i} className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/60">
                        <div className="px-3 py-1.5 bg-zinc-850/80 text-xs font-medium text-zinc-300 flex items-center justify-between border-b border-zinc-800">
                          <span>{ex.title}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">Java</span>
                        </div>
                        <pre className="p-3 font-mono text-xs text-zinc-200 overflow-x-auto">
                          {ex.code}
                        </pre>
                        {ex.explanation && (
                          <div className="px-3 py-1.5 bg-zinc-950/80 text-[11px] text-zinc-400 border-t border-zinc-800/80">
                            {ex.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
