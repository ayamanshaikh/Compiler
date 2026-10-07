"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AdminPracticeQuestion,
  AdminQuestionCreatePayload,
  fetchAdminQuestions,
  fetchAdminQuestionById,
  createAdminQuestion,
  updateAdminQuestion,
  deleteAdminQuestion,
} from "@/lib/api/admin";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { PracticeEditorModal } from "./PracticeEditorModal";
import {
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Code2,
  AlertCircle,
} from "lucide-react";

export function PracticeCms() {
  const [questions, setQuestions] = useState<AdminPracticeQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [topicFilter, setTopicFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editor Modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AdminPracticeQuestion | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete Modal states
  const [questionToDelete, setQuestionToDelete] = useState<AdminPracticeQuestion | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchAdminQuestions({
        topic: topicFilter.trim() || undefined,
        difficulty: difficultyFilter !== "ALL" ? difficultyFilter : undefined,
        type: typeFilter !== "ALL" ? typeFilter : undefined,
      });
      setQuestions(data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load practice questions");
    } finally {
      setIsLoading(false);
    }
  }, [topicFilter, difficultyFilter, typeFilter]);

  useEffect(() => {
    let isMounted = true;
    fetchAdminQuestions({
      topic: topicFilter.trim() || undefined,
      difficulty: difficultyFilter !== "ALL" ? difficultyFilter : undefined,
      type: typeFilter !== "ALL" ? typeFilter : undefined,
    })
      .then((data) => {
        if (isMounted) {
          setQuestions(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMsg(err instanceof Error ? err.message : "Failed to load practice questions");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [topicFilter, difficultyFilter, typeFilter]);

  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = async (question: AdminPracticeQuestion) => {
    try {
      setIsLoading(true);
      const detail = await fetchAdminQuestionById(question.id);
      setEditingQuestion(detail);
      setIsEditorOpen(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load question details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveQuestion = async (payload: AdminQuestionCreatePayload) => {
    setIsSaving(true);
    try {
      if (editingQuestion) {
        await updateAdminQuestion(editingQuestion.id, payload);
      } else {
        await createAdminQuestion(payload);
      }
      setIsEditorOpen(false);
      setEditingQuestion(null);
      await loadQuestions();
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!questionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAdminQuestion(questionToDelete.id);
      setQuestionToDelete(null);
      await loadQuestions();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to delete question");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full sm:w-auto flex-1 max-w-2xl">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by topic slug..."
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value)}
                  className="w-full bg-zinc-950/70 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                aria-label="Filter Difficulty"
                className="bg-zinc-950/70 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Difficulties</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Filter Question Type"
                className="bg-zinc-950/70 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Question Types</option>
                <option value="MCQ">Multiple Choice</option>
                <option value="PREDICT_OUTPUT">Predict Output</option>
                <option value="FIND_ERROR">Find Error</option>
                <option value="MATCH_CONCEPT">Match Concept</option>
                <option value="WRITE_CODE">Write Code</option>
                <option value="FIX_CODE">Fix Code</option>
                <option value="DEBUG_CODE">Debug Code</option>
                <option value="ALGORITHM">Algorithm</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={loadQuestions}
                isLoading={isLoading}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreate}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                New Question
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Questions Table */}
      <Card className="border-zinc-800 bg-zinc-900/30 overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-zinc-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-400" /> Practice Arena Catalog ({questions.length})
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Manage assertions, answer keys, starter templates, and OpenJDK assertions
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/70 text-zinc-400 font-mono text-[11px] border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Title & Prompt</th>
                  <th className="py-2.5 px-3">Topic</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Difficulty</th>
                  <th className="py-2.5 px-3">Answer Key</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {questions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-500">
                      {isLoading ? "Loading questions..." : "No practice questions found matching your filter."}
                    </td>
                  </tr>
                ) : (
                  questions.map((q) => (
                    <tr key={q.id} className="hover:bg-zinc-850/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-zinc-500">#{q.id}</td>
                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="font-medium text-zinc-100 truncate">{q.title}</div>
                        <div className="text-[11px] text-zinc-400 truncate">{q.prompt}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-indigo-300 text-[11px] bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {q.topicSlug}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="neutral" size="sm">
                          {q.questionType}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={
                            q.difficulty === "BEGINNER"
                              ? "success"
                              : q.difficulty === "INTERMEDIATE"
                              ? "warning"
                              : "danger"
                          }
                          size="sm"
                        >
                          {q.difficulty}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 max-w-[140px]">
                        <span className="font-mono text-[11px] text-zinc-400 truncate block bg-zinc-950 px-2 py-0.5 rounded border border-zinc-850">
                          {q.correctAnswer}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(q)}
                            className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100"
                            title="Edit Question"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setQuestionToDelete(q)}
                            className="h-7 w-7 p-0 text-zinc-400 hover:text-rose-400"
                            title="Delete Question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Question Editor Modal with Live Preview */}
      {isEditorOpen && (
        <PracticeEditorModal
          key={editingQuestion ? `question-${editingQuestion.id}` : "new-question"}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSaveQuestion}
          initialQuestion={editingQuestion}
          isSaving={isSaving}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!questionToDelete}
        onClose={() => setQuestionToDelete(null)}
        title="Delete Practice Question"
        description="Are you sure you want to delete this question? Learners will no longer see this question."
        maxWidth="sm"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="ghost" size="sm" onClick={() => setQuestionToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
            >
              Delete Question
            </Button>
          </div>
        }
      >
        {questionToDelete && (
          <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-lg text-xs space-y-1">
            <div className="text-zinc-200 font-semibold">{questionToDelete.title}</div>
            <div className="font-mono text-zinc-500">topic: {questionToDelete.topicSlug} · type: {questionToDelete.questionType}</div>
          </div>
        )}
      </Modal>
    </div>
  );
}
