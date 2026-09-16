import type { AppNotification, NotificationType } from "@/lib/types";

export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  subscription_expiring: "Subscription expiring soon",
  new_module_available: "New module available",
  module_updated: "Module updated",
  daily_reminder: "Daily reminder",
};

/**
 * Notification factory helpers. Delivery (in-app, email, push) is
 * intentionally out of scope for this milestone.
 */
export function buildNotification(
  input: Omit<AppNotification, "id" | "created_at" | "read">,
): AppNotification {
  return {
    ...input,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    read: false,
  };
}
