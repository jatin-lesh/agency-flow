"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VisibilitySelect } from "@/components/shared/VisibilitySelect";
import { Visibility, Priority, TaskStatus } from "@prisma/client";

interface TeamMember { id: string; name: string }
interface Project { id: string; name: string; client?: { name: string } | null }

interface Props {
  projectId?: string;
  onSuccess: (task: unknown) => void;
  onCancel: () => void;
}

export default function TaskForm({ projectId, onSuccess, onCancel }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selProjectId, setSelProjectId] = useState(projectId ?? "");
  const [assigneeId, setAssigneeId] = useState("unassigned");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [visibility, setVisibility] = useState<Visibility>("TEAM");
  const [dueDate, setDueDate] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/projects").then((r) => r.json()).then(setProjects);
    fetch("/api/team").then((r) => r.json()).then(setTeam);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !selProjectId) { setError("Title and project are required."); return; }
    setSaving(true);
    setError("");
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        projectId: selProjectId,
        assigneeId: assigneeId === "unassigned" ? null : assigneeId,
        priority,
        status,
        visibility,
        dueDate: dueDate || null,
      }),
    });
    setSaving(false);
    if (!res.ok) { setError("Failed to create task."); return; }
    onSuccess(await res.json());
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Title *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" autoFocus />
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What needs to be done?" />
      </div>

      {!projectId && (
        <div className="space-y-1.5">
          <Label>Project *</Label>
          <Select value={selProjectId} onValueChange={setSelProjectId}>
            <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.client?.name ? `${p.client.name} — ` : ""}{p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Assign To</Label>
          <Select value={assigneeId} onValueChange={setAssigneeId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {team.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="IN_REVIEW">In Review</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
              <SelectItem value="BLOCKED">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Due Date</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>

      <VisibilitySelect value={visibility} onChange={setVisibility} />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create Task"}</Button>
      </div>
    </form>
  );
}
