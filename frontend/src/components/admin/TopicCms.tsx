"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TopicSummary, TopicDetail } from "@/lib/api/types";
import {
  fetchAdminTopics,
  fetchAdminTopicById,
  createAdminTopic,
  updateAdminTopic,
  deleteAdminTopic,
  TopicCreatePayload,
} from "@/lib/api/admin";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { TopicEditorModal } from "./TopicEditorModal";
import {
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Layers,
  HelpCircle,
  AlertCircle,
} from "lucide-react";

export function TopicCms() {
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editor Modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TopicDetail | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete Modal states
  const [topicToDelete, setTopicToDelete] = useState<TopicSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTopics = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchAdminTopics({
        difficulty: difficultyFilter !== "ALL" ? difficultyFilter : undefined,
        search: searchQuery.trim() || undefined,
      });
      setTopics(data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load topics");
    } finally {
      setIsLoading(false);
    }
  }, [difficultyFilter, searchQuery]);

  useEffect(() => {
    let isMounted = true;
    fetchAdminTopics({
      difficulty: difficultyFilter !== "ALL" ? difficultyFilter : undefined,
      search: searchQuery.trim() || undefined,
    })
      .then((data) => {
        if (isMounted) {
          setTopics(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMsg(err instanceof Error ? err.message : "Failed to load topics");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [difficultyFilter, searchQuery]);

  const handleOpenCreate = () => {
    setEditingTopic(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = async (topicSummary: TopicSummary) => {
    try {
      setIsLoading(true);
      const detail = await fetchAdminTopicById(topicSummary.id);
      setEditingTopic(detail);
      setIsEditorOpen(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load topic details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTopic = async (payload: TopicCreatePayload) => {
    setIsSaving(true);
    try {
      if (editingTopic) {
        await updateAdminTopic(editingTopic.id, payload);
      } else {
        await createAdminTopic(payload);
      }
      setIsEditorOpen(false);
      setEditingTopic(null);
      await loadTopics();
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!topicToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAdminTopic(topicToDelete.id);
      setTopicToDelete(null);
      await loadTopics();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to delete topic");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search curriculum topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={loadTopics}
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
                New Topic
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

      {/* Topics Table */}
      <Card className="border-zinc-800 bg-zinc-900/30 overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-zinc-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" /> Curriculum Catalog ({topics.length})
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Manage explanations, syntax templates, and learning paths
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/70 text-zinc-400 font-mono text-[11px] border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">Order</th>
                  <th className="py-2.5 px-3">Title & Slug</th>
                  <th className="py-2.5 px-3">Difficulty</th>
                  <th className="py-2.5 px-3">Unit</th>
                  <th className="py-2.5 px-3">Questions</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {topics.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">
                      {isLoading ? "Loading topics..." : "No curriculum topics found matching your criteria."}
                    </td>
                  </tr>
                ) : (
                  topics.map((t) => (
                    <tr key={t.id} className="hover:bg-zinc-850/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-zinc-500">#{t.sortOrder}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-zinc-100">{t.title}</div>
                        <div className="font-mono text-[10px] text-zinc-500">{t.slug}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={
                            t.difficulty === "BEGINNER"
                              ? "success"
                              : t.difficulty === "INTERMEDIATE"
                              ? "warning"
                              : "danger"
                          }
                          size="sm"
                        >
                          {t.difficulty}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400">{t.internalUnit || "—"}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 text-zinc-400 font-mono text-[11px]">
                          <HelpCircle className="w-3 h-3 text-zinc-500" />
                          {t.practiceQuestionCount}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(t)}
                            className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100"
                            title="Edit Topic"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTopicToDelete(t)}
                            className="h-7 w-7 p-0 text-zinc-400 hover:text-rose-400"
                            title="Delete Topic"
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

      {/* Topic Editor Modal with Live Preview */}
      {isEditorOpen && (
        <TopicEditorModal
          key={editingTopic ? `topic-${editingTopic.id}` : "new-topic"}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSaveTopic}
          initialTopic={editingTopic}
          isSaving={isSaving}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!topicToDelete}
        onClose={() => setTopicToDelete(null)}
        title="Delete Curriculum Topic"
        description="Are you sure you want to permanently delete this curriculum topic? This action cannot be undone."
        maxWidth="sm"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="ghost" size="sm" onClick={() => setTopicToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
            >
              Delete Topic
            </Button>
          </div>
        }
      >
        {topicToDelete && (
          <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-lg text-xs space-y-1">
            <div className="text-zinc-200 font-semibold">{topicToDelete.title}</div>
            <div className="font-mono text-zinc-500">{topicToDelete.slug}</div>
            <div className="text-zinc-400 text-[11px] mt-1">{topicToDelete.description}</div>
          </div>
        )}
      </Modal>
    </div>
  );
}
