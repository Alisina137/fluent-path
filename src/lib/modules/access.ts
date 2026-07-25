import type {
  LearningModule,
  ModuleAccessState,
  ModuleId,
  UserModule,
} from "@/lib/types";

export const ACCESS_LABELS: Record<ModuleAccessState, string> = {
  available: "Available",
  subscribed: "Subscribed",
  expired: "Expired",
  coming_soon: "Coming soon",
  locked: "Locked",
};

export function findUserModule(
  modules: UserModule[] | undefined,
  moduleId: ModuleId,
): UserModule | undefined {
  return modules?.find((m) => m.module_id === moduleId);
}

export function isExpired(um: UserModule | undefined, now = new Date()): boolean {
  if (!um) return false;
  if (um.subscription_status === "expired") return true;
  if (!um.expiration_date) return false;
  return new Date(um.expiration_date).getTime() < now.getTime();
}

export function isSubscribed(um: UserModule | undefined): boolean {
  if (!um) return false;
  if (isExpired(um)) return false;
  return um.subscription_status === "active" || um.subscription_status === "trialing";
}

export function isComingSoon(module: LearningModule): boolean {
  return module.release_status === "coming_soon";
}

export function getAccessState(
  module: LearningModule,
  um: UserModule | undefined,
): ModuleAccessState {
  if (isComingSoon(module)) return "coming_soon";
  if (isSubscribed(um)) return "subscribed";
  if (isExpired(um)) return "expired";
  return "available";
}

export function hasModuleAccess(
  module: LearningModule,
  um: UserModule | undefined,
): boolean {
  return getAccessState(module, um) === "subscribed";
}

export function canStartModule(
  module: LearningModule,
  um: UserModule | undefined,
): boolean {
  return hasModuleAccess(module, um);
}

export function daysUntil(iso: string | null, now = new Date()): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatRelativeDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diffMs < day) return "Today";
  if (diffMs < 2 * day) return "Yesterday";
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}