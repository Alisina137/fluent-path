import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { MODULE_IDS } from "./constants";
import { getServerModuleAccess } from "./access";

const moduleAccessInputSchema = z.object({
  userId: z.string().uuid(),
  moduleId: z.enum([
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
  ]),
});

export const getModuleAccessServerFn = createServerFn({
  method: "GET",
})
  .validator(moduleAccessInputSchema)
  .handler(async ({ data }) => {
    return getServerModuleAccess(data.userId, data.moduleId);
  });
