import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/shared/StatusBadge";
import { format } from "date-fns";

export default async function PortalHome() {
  const session = await auth();
  if (!session) redirect("/login");

  const access = await db.clientPortalAccess.findUnique({
    where: { userId: session.user.id },
    include: { client: true },
  });

  if (!access) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to your portal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Your portal access has not been configured yet. Please contact your account manager.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [projects, tasks] = await Promise.all([
    db.project.findMany({
      where: { clientId: access.clientId, visibility: "CLIENT" },
      include: { _count: { select: { tasks: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.task.findMany({
      where: {
        visibility: "CLIENT",
        project: { clientId: access.clientId, visibility: "CLIENT" },
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {session.user.name.split(" ")[0]}</h1>
        <p className="text-sm text-slate-500">Client portal · {access.client.name}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {projects.length === 0 && (
              <p className="text-sm text-slate-400">No active projects shared with you.</p>
            )}
            {projects.map((p) => (
              <div key={p.id} className="rounded-md border border-slate-200 p-3">
                <p className="font-medium text-slate-900">{p.name}</p>
                {p.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{p.description}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">{p._count.tasks} task{p._count.tasks !== 1 ? "s" : ""}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.length === 0 && (
              <p className="text-sm text-slate-400">No tasks shared with you yet.</p>
            )}
            {tasks.map((t) => (
              <Link key={t.id} href={`/portal/tasks`} className="block">
                <div className="rounded-md hover:bg-slate-50 p-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{t.title}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {t.project?.name}
                      {t.dueDate && ` · Due ${format(new Date(t.dueDate), "MMM d")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
