"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminUserSummary, fetchAdminUsers, updateUserRole } from "@/lib/api/admin";
import { UserRole } from "@/lib/api/auth";
import { useAuth } from "@/lib/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  Users,
  Search,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  FileCode,
  Award,
  AlertCircle,
} from "lucide-react";

export function UserDirectory() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Role Change Modal states
  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("ROLE_STUDENT");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load user directory");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchAdminUsers()
      .then((data) => {
        if (isMounted) {
          setUsers(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMsg(err instanceof Error ? err.message : "Failed to load user directory");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenRoleModal = (target: AdminUserSummary) => {
    setSelectedUser(target);
    setNewRole(target.role);
  };

  const handleApplyRole = async () => {
    if (!selectedUser) return;
    setIsUpdatingRole(true);
    setErrorMsg(null);
    try {
      await updateUserRole(selectedUser.id, newRole);
      setSelectedUser(null);
      await loadUsers();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update user role");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const isSuperAdmin = currentUser?.role === "ROLE_ADMIN";

  return (
    <div className="space-y-4">
      {/* Search and Refresh */}
      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950/70 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadUsers}
              isLoading={isLoading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh Directory
            </Button>
          </div>
        </CardContent>
      </Card>

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Users Table */}
      <Card className="border-zinc-800 bg-zinc-900/30 overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-zinc-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" /> Platform User Directory ({filteredUsers.length})
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Inspect user learning progress, snippets count, and manage roles
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/70 text-zinc-400 font-mono text-[11px] border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Solved Questions</th>
                  <th className="py-2.5 px-3">Completed Topics</th>
                  <th className="py-2.5 px-3">Saved Snippets</th>
                  <th className="py-2.5 px-3">Joined Date</th>
                  <th className="py-2.5 px-3 text-right">Role Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-500">
                      {isLoading ? "Loading users..." : "No user accounts found matching query."}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = currentUser?.id === u.id;
                    return (
                      <tr key={u.id} className="hover:bg-zinc-850/40 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-zinc-100 flex items-center gap-1.5">
                            {u.username}
                            {isSelf && (
                              <Badge variant="neutral" size="sm">
                                You
                              </Badge>
                            )}
                          </div>
                          <div className="font-mono text-[11px] text-zinc-500">{u.email}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant={
                              u.role === "ROLE_ADMIN"
                                ? "danger"
                                : u.role === "ROLE_INSTRUCTOR"
                                ? "warning"
                                : "neutral"
                            }
                            size="sm"
                          >
                            {u.role.replace("ROLE_", "")}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 text-zinc-300 font-mono">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            {u.solvedQuestionsCount}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 text-zinc-300 font-mono">
                            <Award className="w-3.5 h-3.5 text-indigo-400" />
                            {u.completedTopicsCount}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 text-zinc-300 font-mono">
                            <FileCode className="w-3.5 h-3.5 text-blue-400" />
                            {u.savedSnippetsCount}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-400">
                          {new Date(u.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!isSuperAdmin || (isSelf && u.role === "ROLE_ADMIN")}
                            onClick={() => handleOpenRoleModal(u)}
                            className="text-xs text-indigo-400 hover:text-indigo-300"
                            title={
                              !isSuperAdmin
                                ? "Super Admin required"
                                : isSelf
                                ? "Cannot demote yourself"
                                : "Change Role"
                            }
                          >
                            Edit Role
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Change Role Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Update User Authorization Role"
        description="Assign administrative permissions or demote account privileges."
        maxWidth="sm"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleApplyRole}
              isLoading={isUpdatingRole}
            >
              Update Role
            </Button>
          </div>
        }
      >
        {selectedUser && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-lg">
              <div className="font-semibold text-zinc-100">{selectedUser.username}</div>
              <div className="text-zinc-500 font-mono text-[11px]">{selectedUser.email}</div>
              <div className="mt-2 text-zinc-400">
                Current Role: <span className="font-mono text-zinc-200">{selectedUser.role}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Target Role Assignment:
              </label>
              <div className="space-y-2">
                {(["ROLE_STUDENT", "ROLE_INSTRUCTOR", "ROLE_ADMIN"] as UserRole[]).map((r) => (
                  <label
                    key={r}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      newRole === r
                        ? "bg-indigo-600/20 border-indigo-500 text-zinc-100"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-750"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="userRole"
                        value={r}
                        checked={newRole === r}
                        onChange={() => setNewRole(r)}
                        className="accent-indigo-500"
                      />
                      <span className="font-mono text-xs">{r}</span>
                    </div>
                    {r === "ROLE_ADMIN" && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
                    {r === "ROLE_INSTRUCTOR" && <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
