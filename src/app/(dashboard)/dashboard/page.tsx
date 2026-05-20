import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, PriorityBadge } from "@/components/shared/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users2, FolderKanban, CheckSquare, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const [totalClients, totalProjects, totalTasks, myTasks, recentTasks, tasksByStatus] =
    await Promise.all([
      db.client.count(),
      db.project.count(),
      db.task.count(),
      db.task.count({ where: { assigneeId: session.user.id, status: { not: "DONE" } } }),
      db.task.findMany({
        where:
          session.user.role === "MEMBER" || session.user.role === "CLIENT_USER"
            ? { OR: [{ assigneeId: session.user.id }, { creatorId: session.user.id }] }
            : {},
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          project: { select: { id: true, name: true, client: { select: { name: true } } } },
        },
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
      db.task.groupBy({ by: ["status"], _count: true }),
    ]);

  const stats = [
    { label: "Clients",  value: totalClients,  icon: Users2,       href: "/clients",  color: "text-blue-600",   bg: "bg-blue-50"  },
    { label: "Projects", value: totalProjects, icon: FolderKanban, href: "/projects", color: "text-indigo-600", bg: "bg-indigo-50"},
    { label: "Tasks",    value: totalTasks,    icon: CheckSquare,  href: "/tasks",    color: "text-emerald-600",bg: "bg-emerald-50"},
    { label: "My Open",  value: myTasks,       icon: Clock,        href: "/tasks",    color: "text-amber-600",  bg: "bg-amber-50" },
  ];

  const statusMap = Object.fromEntries(tasksByStatus.map((t) => [t.status, t._count]));

  return (
    <div className="flex flex-col flex-1">
      <Header title={`Good to see you, ${session.user.name.split(" ")[0]} 👋`} subtitle="Here's what's happening today." />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, href, color, bg }) => (
            <Link key={label} href={href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`${bg} p-3 rounded-xl`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                    <p className="text-sm text-slate-500">{label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Task status breakdown */}
          <Card>
            <CardHeader><CardTitle className="text-base">Tasks by Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "TODO",        label: "To Do",       color: "bg-slate-300" },
                { key: "IN_PROGRESS", label: "In Progress", color: "bg-blue-400"  },
                { key: "IN_REVIEW",   label: "In Review",   color: "bg-purple-400"},
                { key: "BLOCKED",     label: "Blocked",     color: "bg-red-400"   },
                { key: "DONE",        label: "Done",        color: "bg-emerald-400"},
              ].map(({ key, label, color }) => {
                const count = statusMap[key] ?? 0;
                const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{label}</span>
                      <span className="font-medium text-slate-800">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent tasks */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Recent Tasks</CardTitle>
                <Link href="/tasks" className="text-xs text-indigo-600 hover:underline">View all</Link>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentTasks.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">No tasks yet</p>
                )}
                {recentTasks.map((task) => (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {task.project?.client?.name} · {task.project?.name}
                          {task.dueDate && ` · Due ${format(new Date(task.dueDate), "MMM d")}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge status={task.status} />
                        {task.assignee && (
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={task.assignee.avatar ?? undefined} />
                            <AvatarFallback className="text-[10px]">
                              {task.assignee.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
