import type { PrismaClient } from "@prisma/client";

type MinimalTask = { id: string; title: string };

function eventToNotification(
  event: string,
  task: MinimalTask,
  actorName: string,
): { title: string; message: string; type: "TASK_ASSIGNED" | "TASK_UPDATED" | "MESSAGE_ADDED" | "GENERAL" } {
  switch (event) {
    case "task.created":
      return {
        title: "New task assigned",
        message: `${actorName} assigned you to "${task.title}"`,
        type: "TASK_ASSIGNED",
      };
    case "task.updated":
      return {
        title: "Task updated",
        message: `${actorName} updated "${task.title}"`,
        type: "TASK_UPDATED",
      };
    case "task.message":
      return {
        title: "New message",
        message: `${actorName} commented on "${task.title}"`,
        type: "MESSAGE_ADDED",
      };
    default:
      return {
        title: "Notification",
        message: `${event}: ${task.title}`,
        type: "GENERAL",
      };
  }
}

/**
 * Creates in-app notification records for users involved with a task.
 * Notifies assignee and creator, excluding the actor themselves.
 */
export async function notifyTaskEvent(
  event: string,
  task: MinimalTask,
  actorName: string,
  db: PrismaClient,
) {
  try {
    const full = await db.task.findUnique({
      where: { id: task.id },
      select: {
        assignee: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
    });
    if (!full) return;

    const { title, message, type } = eventToNotification(event, task, actorName);
    const link = `/dashboard/tasks/${task.id}`;

    // Collect unique recipient IDs (exclude the actor)
    const recipientIds = new Set<string>();
    if (full.assignee) recipientIds.add(full.assignee.id);
    if (full.creator) recipientIds.add(full.creator.id);

    // Remove actor — find by name match (actor name comes from session.user.name)
    // We don't have actorId here so we exclude by matching name
    if (full.assignee?.name === actorName) recipientIds.delete(full.assignee.id);
    if (full.creator?.name === actorName) recipientIds.delete(full.creator.id);

    if (recipientIds.size === 0) return;

    await db.notification.createMany({
      data: Array.from(recipientIds).map((userId) => ({
        userId,
        title,
        message,
        type,
        link,
      })),
    });
  } catch (err) {
    console.error("[notifications] notifyTaskEvent error:", err);
  }
}
