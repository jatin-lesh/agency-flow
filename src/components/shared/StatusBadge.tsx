import { Badge } from "@/components/ui/badge";
import { TaskStatus, Priority } from "@prisma/client";

const statusConfig: Record<TaskStatus, { label: string; variant: "secondary" | "info" | "purple" | "success" | "destructive" }> = {
  TODO:        { label: "To Do",       variant: "secondary"  },
  IN_PROGRESS: { label: "In Progress", variant: "info"       },
  IN_REVIEW:   { label: "In Review",   variant: "purple"     },
  DONE:        { label: "Done",        variant: "success"    },
  BLOCKED:     { label: "Blocked",     variant: "destructive"},
};

const priorityConfig: Record<Priority, { label: string; variant: "secondary" | "info" | "warning" | "destructive" }> = {
  LOW:    { label: "Low",    variant: "secondary"  },
  MEDIUM: { label: "Medium", variant: "info"       },
  HIGH:   { label: "High",   variant: "warning"    },
  URGENT: { label: "Urgent", variant: "destructive"},
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const { label, variant } = statusConfig[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { label, variant } = priorityConfig[priority];
  return <Badge variant={variant}>{label}</Badge>;
}
