import type { ModuleId, SubscriptionStatus, UserModule } from "@/lib/types";
import { MODULES } from "@/lib/modules/registry";
import type { ServerUserModule } from "@/lib/modules/context";

function isModuleId(value: string): value is ModuleId {
  return MODULES.some((module) => module.id === value);
}

function isSubscriptionStatus(value: string): value is SubscriptionStatus {
  return (
    value === "active" ||
    value === "trialing" ||
    value === "past_due" ||
    value === "canceled" ||
    value === "expired"
  );
}

export function toUserModule(module: ServerUserModule): UserModule | null {
  if (!isModuleId(module.moduleId)) {
    return null;
  }

  if (!isSubscriptionStatus(module.accessStatus)) {
    return null;
  }

  const activatedAt = module.activatedAt ? new Date(module.activatedAt).toISOString() : null;

  const expiresAt = module.expiresAt ? new Date(module.expiresAt).toISOString() : null;

  const lastAccessedAt = module.lastAccessedAt
    ? new Date(module.lastAccessedAt).toISOString()
    : null;

  return {
    user_id: module.userId,
    module_id: module.moduleId,
    subscription_status: module.accessStatus,
    activation_date: activatedAt,
    expiration_date: expiresAt,
    auto_renew: false,
    last_accessed: lastAccessedAt,
    progress_percentage: module.progressPercentage,
  };
}

export function toUserModules(modules: ServerUserModule[]): UserModule[] {
  return modules.map(toUserModule).filter((module): module is UserModule => module !== null);
}
