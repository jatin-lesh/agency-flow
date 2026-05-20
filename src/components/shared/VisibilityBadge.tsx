import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Users, ShieldCheck, Globe } from "lucide-react";
import { Visibility } from "@prisma/client";

const config: Record<Visibility, { label: string; variant: "outline" | "secondary" | "warning" | "info"; icon: React.ElementType }> = {
  PRIVATE:      { label: "Private",       variant: "outline",   icon: EyeOff    },
  MANAGER_ONLY: { label: "Managers Only", variant: "warning",   icon: ShieldCheck },
  TEAM:         { label: "Team",          variant: "secondary", icon: Users     },
  CLIENT:       { label: "Client",        variant: "info",      icon: Globe     },
};

export function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  const { label, variant, icon: Icon } = config[visibility];
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
