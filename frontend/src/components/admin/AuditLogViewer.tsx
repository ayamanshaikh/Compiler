"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminAuditLog, fetchAdminAuditLogs } from "@/lib/api/admin";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  FileText,
  RefreshCw,
  Search,
  Clock,
  Shield,
  Layers,
  Code2,
  UserCheck,
} from "lucide-react";

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [limit, setLimit] = useState(50);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchAdminAuditLogs(limit);
      setLogs(data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    let isMounted = true;
    fetchAdminAuditLogs(limit)
      .then((data) => {
        if (isMounted) {
          setLogs(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMsg(err instanceof Error ? err.message : "Failed to load audit logs");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [limit]);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return log.action.toLowerCase().includes(q) || log.details.toLowerCase().includes(q);
  });

  const getActionBadge = (action: string) => {
    if (action.includes("CREATE")) {
      return (
        <Badge variant="success" size="sm">
          {action}
        </Badge>
      );
    }
    if (action.includes("DELETE")) {
      return (
        <Badge variant="danger" size="sm">
          {action}
        </Badge>
      );
    }
    if (action.includes("ROLE")) {
      return (
        <Badge variant="warning" size="sm">
          {action}
        </Badge>
      );
    }
    return (
      <Badge variant="neutral" size="sm">
        {action}
      </Badge>
    );
  };

  const getActionIcon = (action: string) => {
    if (action.startsWith("TOPIC")) return <Layers className="w-4 h-4 text-purple-400" />;
    if (action.startsWith("QUESTION")) return <Code2 className="w-4 h-4 text-indigo-400" />;
    if (action.startsWith("USER")) return <UserCheck className="w-4 h-4 text-amber-400" />;
    return <Shield className="w-4 h-4 text-zinc-400" />;
  };

  return (
    <div className="space-y-4">
      {/* Search and Limit Controls */}
      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search audit actions & details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950/70 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span>Show:</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  aria-label="Audit Log Limit"
                  className="bg-zinc-950/70 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value={25}>25 entries</option>
                  <option value={50}>50 entries</option>
                  <option value={100}>100 entries</option>
                </select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={loadLogs}
                isLoading={isLoading}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Refresh Logs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* Audit Log Table */}
      <Card className="border-zinc-800 bg-zinc-900/30 overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-zinc-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" /> Administrative Audit Trail ({filteredLogs.length})
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Immutable logging of curriculum modifications, question edits, and user role updates
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/70 text-zinc-400 font-mono text-[11px] border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Details</th>
                  <th className="py-2.5 px-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-500">
                      {isLoading ? "Loading audit logs..." : "No administrative actions found matching query."}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-850/40 transition-colors">
                      <td className="py-2.5 px-3 w-10">
                        {getActionIcon(log.action)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-zinc-300 text-xs">
                        {log.details}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap text-zinc-400 font-mono text-[11px]">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          {new Date(log.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
