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

const userIdSchema = z.object({
  userId: z.string().uuid(),
});

const moduleAccessInputSchema = userIdSchema.extend({
  moduleId: moduleIdSchema,
});

const developmentModuleActivationSchema = moduleAccessInputSchema.extend({
  email: z.string().email(),
  name: z.string().trim().min(1).max(160),
});

export const getModuleAccessServerFn = createServerFn({
  method: "GET",
})
  .validator(moduleAccessInputSchema)
  .handler(async ({ data }) => {
    const { getServerModuleAccess } = await import("@/server/modules/access");

    return getServerModuleAccess(data.userId, data.moduleId);
  });

export const getUserModulesServerFn = createServerFn({
  method: "GET",
})
  .validator(userIdSchema)
  .handler(async ({ data }) => {
    const { listDevelopmentUserModules } =
      await import("@/server/modules/development-entitlements");

    return listDevelopmentUserModules(data.userId);
  });

export const activateDevelopmentModuleServerFn = createServerFn({
  method: "POST",
})
  .validator(developmentModuleActivationSchema)
  .handler(async ({ data }) => {
    const { activateDevelopmentModule } = await import("@/server/modules/development-entitlements");

    return activateDevelopmentModule(
      {
        id: data.userId,
        email: data.email,
        name: data.name,
      },
      data.moduleId,
    );
  });

export const cancelDevelopmentModuleServerFn = createServerFn({
  method: "POST",
})
  .validator(moduleAccessInputSchema)
  .handler(async ({ data }) => {
    const { cancelDevelopmentModule } = await import("@/server/modules/development-entitlements");

    return cancelDevelopmentModule(data.userId, data.moduleId);
  });

export const markDevelopmentModuleOpenedServerFn = createServerFn({
  method: "POST",
})
  .validator(moduleAccessInputSchema)
  .handler(async ({ data }) => {
    const { markDevelopmentModuleOpened } =
      await import("@/server/modules/development-entitlements");

    return markDevelopmentModuleOpened(data.userId, data.moduleId);
  });
