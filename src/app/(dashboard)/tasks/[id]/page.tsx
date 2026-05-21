"use client";
import { useState, useEffect, useCallback, use } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import Link from "next/link";
import { ArrowLeft, Calendar, User, FolderKanban } from "lucide-react";
import { format } from "date-fns";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TaskThread from "@/components/tasks/TaskThread";
import { StatusBadge, PriorityBadge } from "@/components/shared/StatusBadge";
import { VisibilityBadge } from "@/components/shared/VisibilityBadge";
import { VisibilitySelect } from "@/components/shared/VisibilitySelect";
import { canManage } from "@/lib/utils";
import { TaskStatus, Priority, Visibility } from "@prisma/client";

interface Message {
  id: string; content: string; isEdited: boolean; createdAt: string;
  user: { id: string; name: string; avatar?: string | null; role: string } | null;
  attachments: { id: string; name: string; url: string; type: string }[];
}
interface Task {
  id: string; title: string; description?: string;
  status: TaskStatus; priority: Priority; visibility: Visibility;
  dueDate?: string;
  assignee?: { id: string; name: string; avatar?: string | null; email?: string } | null;
  creator?: { id: string; name: string; avatar?: string | null } | null;
  project: { id: string; name: string; client: { id: string; name: string } };
  messages: Message[];
}
interface TeamMember { id: string; name: string; avatar?: string | null }

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [task, setTask] = useState<Task | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);

  const load = useCallback(async () => {
    const [tRes, mRes] = await Promise.all([fetch(`/api/tasks/${id}`), fetch("/api/team")]);
    if (tRes.ok) setTask(await tRes.json());
    if (mRes.ok) setTeam(await mRes.json());
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function updateField(data: Record<string, unknown>) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) setTask((prev) => prev ? { ...prev, ...data } : prev);
  }

  const isManager = session && canManage(session.user.role);
  const canEdit = isManager || task?.assignee?.id === session?.user?.id || (task?.creator?.id && task.creator.id === session?.user?.id);

  if (!task) return <div className="flex-1 flex items-center justify-center text-slate-400">Loading…</div>;

  return (
    <div className="flex flex-col flex-1">
      <Header
        title={task.title}
        subtitle={`${task.project.client.name} · ${task.project.name}`}
        action={<Link href="/tasks"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Thread */}
        <div className="flex-1 min-w-0 flex flex-col border-r border-slate-200" style={{ minHeight: 0 }}>
          <div className="px-5 pt-4 pb-2 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Thread</h2>
          </div>
          <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
            <TaskThread
              taskId={task.id}
              currentUserId={session?.user?.id ?? ""}
              currentUserRole={session?.user?.role ?? "MEMBER"}
              initialMessages={task.messages}
            />
          </div>
        </div>

        {/* Details sidebar */}
        <div className="w-80 shrink-0 overflow-y-auto p-5 space-y-4 bg-white">
          {task.description && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Description</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Status */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Status</h3>
            {canEdit ? (
              <Select value={task.status} onValueChange={(v) => updateField({ status: v })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="IN_REVIEW">In Review</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
            ) : <StatusBadge status={task.status} />}
          </div>

          {/* Priority */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Priority</h3>
            {canEdit ? (
              <Select value={task.priority} onValueChange={(v) => updateField({ priority: v as Priority })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            ) : <PriorityBadge priority={task.priority} />}
          </div>

          {/* Assignee */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Assignee</h3>
            {isManager ? (
              <Select value={task.assignee?.id ?? "unassigned"} onValueChange={(v) => updateField({ assigneeId: v === "unassigned" ? null : v })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {team.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : task.assignee ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={task.assignee.avatar ?? undefined} />
                  <AvatarFallback className="text-[10px]">{task.assignee.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-slate-700">{task.assignee.name}</span>
              </div>
            ) : (
              <span className="text-sm text-slate-400 flex items-center gap-1"><User className="h-3 w-3" /> Unassigned</span>
            )}
          </div>

          {/* Due date */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Due Date</h3>
            {canEdit ? (
              <input
                type="date"
                value={task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : ""}
                onChange={(e) => updateField({ dueDate: e.target.value || null })}
                className="flex h-8 w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            ) : task.dueDate ? (
              <span className="text-sm text-slate-700 flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
            ) : (
              <span className="text-sm text-slate-400">No due date</span>
            )}
          </div>

          {/* Visibility */}
          <div>
            {isManager ? (
              <VisibilitySelect value={task.visibility} onChange={(v) => updateField({ visibility: v })} />
            ) : (
              <>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Visibility</h3>
                <VisibilityBadge visibility={task.visibility} />
              </>
            )}
          </div>

          {/* Project */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Project</h3>
            <Link href={`/projects/${task.project.id}`} className="flex items-center gap-2 text-sm text-indigo-600 hover:underline">
              <FolderKanban className="h-3.5 w-3.5" /> {task.project.name}
            </Link>
            <p className="text-xs text-slate-400 mt-0.5">{task.project.client.name}</p>
          </div>

          {/* Creator */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Created by</h3>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={task.creator?.avatar ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {(task.creator?.name ?? "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-slate-700">
                {task.creator?.name ?? <span className="italic text-slate-400">Deleted user</span>}
              </span>
            </div>
          </div>

          {/* Delete */}
          {isManager && (
            <Card className="border-red-100 bg-red-50/50 mt-4">
              <CardHeader className="pb-2 pt-3"><CardTitle className="text-sm text-red-700">Danger Zone</CardTitle></CardHeader>
              <CardContent className="pb-3">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={async () => {
                    if (confirm("Delete this task permanently?")) {
                      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
                      window.location.href = "/tasks";
                    }
                  }}
                >
                  Delete Task
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
