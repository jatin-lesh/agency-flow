"use client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Visibility } from "@prisma/client";
import { VISIBILITY_LABELS } from "@/lib/utils";

interface Props {
  value: Visibility;
  onChange: (v: Visibility) => void;
  label?: string;
}

export function VisibilitySelect({ value, onChange, label = "Visibility" }: Props) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as Visibility)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(VISIBILITY_LABELS) as Visibility[]).map((v) => (
            <SelectItem key={v} value={v}>
              {VISIBILITY_LABELS[v]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-slate-500">
        {value === "PRIVATE" && "Only you and the assignee can see this."}
        {value === "TEAM" && "All team members can see this."}
        {value === "MANAGER_ONLY" && "Only managers and admins can see this."}
        {value === "CLIENT" && "Team members and client contacts can see this."}
      </p>
    </div>
  );
}
