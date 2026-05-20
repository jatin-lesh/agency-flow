"use client";
import Link from "next/link";
import { Calendar, MessageSquare, User } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge, PriorityBadge } from "@/components/shared/StatusBadge";
import { VisibilityBadge } from "@/components/shared/VisibilityBadge";
import { TaskStatus, Priority, Visibility } from "@prisma/client";

interface TaskCardProps {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  visibility: Visibility;
  dueDate?: string | null;
  messageCount?: number;
  assignee?: { id: string; name: string; avatar?: string | null } | null;
  project?: { id: string; name: string; client?: { name: string } | null } | null;
}

export default function TaskCard({ id, title, status, priority, visibility, dueDate, messageCount = 0, assignee, project }: TaskCardProps) {
  const overdue = dueDate && new Date(dueDate) < new Date() && status !== "DONE";

  return (
    <Link href={`/tasks/${id}`}>
      <Card className="hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-slate-900 line-clamp-2">{title}</p>
            <PriorityBadge priority={priority} />
          </div>

          {project && (
            <p className="text-xs text-slate-500 truncate">
              {project.client?.name} · {project.name}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={status} />
            <VisibilityBadge visibility={visibility} />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-3">
              {dueDate && (
                <span className={`flex items-center gap-1 ${overdue ? "text-red-500 font-medium" : ""}`}>
                  <Calendar className="h-3 w-3" />
                  {format(new Date(dueDate), "MMM d")}
                </span>
              )}
              {messageCount > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {messageCount}
                </span>
              )}
            </div>
            {assignee ? (
              <Avatar className="h-6 w-6">
                <AvatarImage src={assignee.avatar ?? undefined} />
                <AvatarFallback className="text-[10px]">{assignee.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            ) : (
              <span className="flex items-center gap-1 text-slate-400">
                <User className="h-3 w-3" /> Unassigned
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
