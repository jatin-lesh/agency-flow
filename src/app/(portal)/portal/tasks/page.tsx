import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/shared/StatusBadge";
import { format } from "date-fns";

export default async function PortalTasksPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const access = await db.clientPortalAccess.findUnique({
    where: { userId: session.user.id },
  });

  if (!access) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader><CardTitle>No portal access</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">Please contact your account manager.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tasks = await db.task.findMany({
    where: {
      visibility: "CLIENT",
      project: { clientId: access.clientId, visibility: "CLIENT" },
    },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
        <p className="text-sm text-slate-500">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</p>
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-slate-100">
          {tasks.length === 0 && (
            <p className="p-6 text-sm text-slate-400 text-center">No tasks shared with you yet.</p>
          )}
          {tasks.map((t) => (
            <div key={t.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{t.title}</p>
                <p className="text-xs text-slate-400 truncate">
                  {t.project?.name}
                  {t.assignee && ` · Assigned to ${t.assignee.name}`}
                  {t.dueDate && ` · Due ${format(new Date(t.dueDate), "MMM d, yyyy")}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <PriorityBadge priority={t.priority} />
                <StatusBadge status={t.status} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
