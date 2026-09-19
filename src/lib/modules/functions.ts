import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { MODULE_IDS } from "@/server/modules/constants";

const moduleIdSchema = z.enum([
  MODULE_IDS.speaking,
  MODULE_IDS.writing,
  MODULE_IDS.vocabulary,
  MODULE_IDS.listening,
  MODULE_IDS.reading,
  MODULE_IDS.grammar,
  MODULE_IDS.stories,
  MODULE_IDS.ielts,
  MODULE_IDS.interview,
  MODULE_IDS.business,
]);

const moduleAccessInputSchema = z.object({
  moduleId: moduleIdSchema,
});

export const getModuleAccessServerFn = createServerFn({
  method: "GET",
})
  .validator(moduleAccessInputSchema)
  .handler(async ({ data }) => {
    const { requireAuthenticatedUserId } = await import("@/server/auth/session");

    const { getServerModuleAccess } = await import("@/server/modules/access");

    const userId = await requireAuthenticatedUserId();

    return getServerModuleAccess(userId, data.moduleId);
  });

export const getUserModulesServerFn = createServerFn({
  method: "GET",
}).handler(async () => {
  const { requireAuthenticatedUserId } = await import("@/server/auth/session");

  const { listDevelopmentUserModules } = await import("@/server/modules/development-entitlements");

  const userId = await requireAuthenticatedUserId();

  return listDevelopmentUserModules(userId);
});

export const activateDevelopmentModuleServerFn = createServerFn({
  method: "POST",
})
  .validator(moduleAccessInputSchema)
  .handler(async ({ data }) => {
    const { requireAuthenticatedUserId } = await import("@/server/auth/session");

    const { getAuthenticatedAccountById } = await import("@/server/auth/accounts");

    const { activateDevelopmentModule } = await import("@/server/modules/development-entitlements");

    const userId = await requireAuthenticatedUserId();
    const user = await getAuthenticatedAccountById(userId);

    if (!user) {
      throw new Error("Authenticated account could not be found.");
    }

    return activateDevelopmentModule(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      data.moduleId,
    );
  });

export const cancelDevelopmentModuleServerFn = createServerFn({
  method: "POST",
})
  .validator(moduleAccessInputSchema)
  .handler(async ({ data }) => {
    const { requireAuthenticatedUserId } = await import("@/server/auth/session");

    const { cancelDevelopmentModule } = await import("@/server/modules/development-entitlements");

    const userId = await requireAuthenticatedUserId();

    return cancelDevelopmentModule(userId, data.moduleId);
  });

export const markDevelopmentModuleOpenedServerFn = createServerFn({
  method: "POST",
})
  .validator(moduleAccessInputSchema)
  .handler(async ({ data }) => {
    const { requireAuthenticatedUserId } = await import("@/server/auth/session");

    const { markDevelopmentModuleOpened } =
      await import("@/server/modules/development-entitlements");

    const userId = await requireAuthenticatedUserId();

    return markDevelopmentModuleOpened(userId, data.moduleId);
  });
