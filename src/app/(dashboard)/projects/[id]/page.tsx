"use client";
import { useState, useEffect, useCallback, use } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus, ArrowLeft, Calendar, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TaskCard from "@/components/tasks/TaskCard";
import TaskForm from "@/components/tasks/TaskForm";
import { VisibilityBadge } from "@/components/shared/VisibilityBadge";
import { canManage } from "@/lib/utils";
import { TaskStatus, Visibility, Priority } from "@prisma/client";

interface Task {
  id: string; title: string; status: TaskStatus; priority: Priority;
  visibility: Visibility; dueDate?: string;
  assignee?: { id: string; name: string; avatar?: string | null } | null;
  _count?: { messages: number };
}
interface Project {
  id: string; name: string; description?: string; status: string;
  visibility: Visibility; dueDate?: string;
  client: { id: string; name: string };
  tasks: Task[];
}

const STATUS_COLS: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"];

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [project, setProject] = useState<Project | null>(null);
  const [view, setView] = useState<"board" | "list">("board");
  const [taskOpen, setTaskOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const load = useCallback(async () => {
    const res = await fetch(`/api/projects/${id}`);
    if (res.ok) setProject(await res.json());
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function updateProjectStatus(status: string) {
    await fetch(`/api/projects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  }

  const isManager = session && canManage(session.user.role);
  if (!project) return <div className="flex-1 flex items-center justify-center text-slate-400">Loading…</div>;

  const filteredTasks = project.tasks.filter((t) => statusFilter === "ALL" || t.status === statusFilter);

  return (
    <div className="flex flex-col flex-1">
      <Header
        title={project.name}
        subtitle={project.client.name}
        action={
          <div className="flex gap-2">
            <Link href="/projects"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>
            {isManager && <Button size="sm" onClick={() => setTaskOpen(true)}><Plus className="h-4 w-4" /> Add Task</Button>}
          </div>
        }
      />

      <div className="p-6 space-y-5">
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3">
          <VisibilityBadge visibility={project.visibility} />
          {isManager ? (
            <Select value={project.status} onValueChange={updateProjectStatus}>
              <SelectTrigger className="w-36 h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="secondary">{project.status.replace("_", " ")}</Badge>
          )}
          {project.dueDate && (
            <span className="flex items-center gap-1 text-sm text-slate-500">
              <Calendar className="h-4 w-4" /> Due {format(new Date(project.dueDate), "MMM d, yyyy")}
            </span>
          )}
          <span className="flex items-center gap-1 text-sm text-slate-500">
            <CheckSquare className="h-4 w-4" /> {project.tasks.length} tasks
          </span>
        </div>

        {project.description && <p className="text-sm text-slate-600">{project.description}</p>}

        {/* View toggle + filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button onClick={() => setView("board")} className={`px-3 py-1.5 text-sm font-medium transition-colors ${view === "board" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>Board</button>
            <button onClick={() => setView("list")} className={`px-3 py-1.5 text-sm font-medium transition-colors ${view === "list" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>List</button>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="IN_REVIEW">In Review</SelectItem>
              <SelectItem value="BLOCKED">Blocked</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Board view */}
        {view === "board" && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUS_COLS.filter((s) => statusFilter === "ALL" || s === statusFilter).map((status) => {
              const colTasks = filteredTasks.filter((t) => t.status === status);
              const labels: Record<string, string> = { TODO: "To Do", IN_PROGRESS: "In Progress", IN_REVIEW: "In Review", BLOCKED: "Blocked", DONE: "Done" };
              return (
                <div key={status} className="min-w-72 w-72 shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-700">{labels[status]}</span>
                    <Badge variant="secondary">{colTasks.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {colTasks.map((t) => (
                      <TaskCard key={t.id} {...t} messageCount={t._count?.messages} />
                    ))}
                    {colTasks.length === 0 && (
                      <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List view */}
        {view === "list" && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Tasks</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {filteredTasks.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No tasks yet</p>}
              {filteredTasks.map((t) => (
                <TaskCard key={t.id} {...t} messageCount={t._count?.messages} />
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
          <TaskForm projectId={id} onSuccess={() => { setTaskOpen(false); load(); }} onCancel={() => setTaskOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
