import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Role, Visibility } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function canViewByVisibility(
  userRole: Role,
  visibility: Visibility,
  isAssigneeOrCreator = false
): boolean {
  if (isAssigneeOrCreator) return true;
  switch (visibility) {
    case "PRIVATE":
      return false;
    case "MANAGER_ONLY":
      return userRole === "ADMIN" || userRole === "MANAGER";
    case "TEAM":
      return userRole !== "CLIENT_USER";
    case "CLIENT":
      return true;
    default:
      return false;
  }
}

export function canManage(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

export function isAdmin(role: Role): boolean {
  return role === "ADMIN";
}

export const TASK_STATUS_LABELS: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
  BLOCKED: "Blocked",
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const VISIBILITY_LABELS: Record<string, string> = {
  PRIVATE: "Private",
  TEAM: "Team",
  MANAGER_ONLY: "Managers Only",
  CLIENT: "Client Visible",
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  MEMBER: "Member",
  CLIENT_USER: "Client",
};
