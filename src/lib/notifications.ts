import type { PrismaClient } from "@prisma/client";
import { sendWhatsApp } from "./whatsapp";

type MinimalTask = { id: string; title: string };

function eventToMessage(event: string, task: MinimalTask, actorName: string): string {
  switch (event) {
    case "task.created":
      return `📋 New task assigned to you by ${actorName}: ${task.title}`;
    case "task.updated":
      return `✅ Task updated by ${actorName}: ${task.title}`;
    case "task.message":
      return `💬 New message from ${actorName} in: ${task.title}`;
    default:
      return `🔔 ${event}: ${task.title}`;
  }
}

/**
 * Notify users involved with a task via WhatsApp (assignee + creator).
 * Silently skips users without phone or whatsappEnabled.
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
        assignee: { select: { id: true, phone: true, whatsappEnabled: true } },
        creator: { select: { id: true, phone: true, whatsappEnabled: true } },
      },
    });
    if (!full) return;

    const recipients = new Map<string, string>();
    const message = eventToMessage(event, task, actorName);

    for (const u of [full.assignee, full.creator]) {
      if (u && u.whatsappEnabled && u.phone) {
        recipients.set(u.id, u.phone);
      }
    }

    await Promise.all(
      Array.from(recipients.values()).map((phone) =>
        sendWhatsApp(phone, message).catch((e) =>
          console.error("[notifications] whatsapp send error:", e),
        ),
      ),
    );
  } catch (err) {
    console.error("[notifications] notifyTaskEvent error:", err);
  }
}
