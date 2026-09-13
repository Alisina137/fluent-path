import { and, eq, gt, isNull, or } from "drizzle-orm";

import { getDb } from "@/db/client";
import { modules, userModules } from "@/db/schema";

export type ServerModuleAccessState =
  "granted" | "not_subscribed" | "expired" | "coming_soon" | "module_not_found";

export interface ServerModuleAccessResult {
  moduleId: string;
  allowed: boolean;
  state: ServerModuleAccessState;
}

export async function getServerModuleAccess(
  userId: string,
  moduleId: string,
): Promise<ServerModuleAccessResult> {
  const db = getDb();
  const now = new Date();

  const [module] = await db
    .select({
      id: modules.id,
      releaseStatus: modules.releaseStatus,
    })
    .from(modules)
    .where(eq(modules.id, moduleId))
    .limit(1);

  if (!module) {
    return {
      moduleId,
      allowed: false,
      state: "module_not_found",
    };
  }

  if (module.releaseStatus === "coming_soon") {
    return {
      moduleId,
      allowed: false,
      state: "coming_soon",
    };
  }

  const [entitlement] = await db
    .select({
      accessStatus: userModules.accessStatus,
      expiresAt: userModules.expiresAt,
    })
    .from(userModules)
    .where(
      and(
        eq(userModules.userId, userId),
        eq(userModules.moduleId, moduleId),
        eq(userModules.accessStatus, "active"),
        or(isNull(userModules.expiresAt), gt(userModules.expiresAt, now)),
      ),
    )
    .limit(1);

  if (!entitlement) {
    return {
      moduleId,
      allowed: false,
      state: "not_subscribed",
    };
  }

  return {
    moduleId,
    allowed: true,
    state: "granted",
  };
}
