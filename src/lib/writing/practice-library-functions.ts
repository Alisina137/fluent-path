import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  getWritingPracticeLibrary,
  getWritingPracticeTask,
  WRITING_PRACTICE_MAX_PAGE_SIZE,
  writingPracticeCefrLevels,
} from "@/server/writing/practice-library";

const optionalFilterSchema = z.string().trim().min(1).max(100).optional();

const writingPracticeLibraryInputSchema = z.object({
  cefrLevel: z.enum(writingPracticeCefrLevels).optional(),
  category: optionalFilterSchema,
  writingType: optionalFilterSchema,

  page: z.number().int().min(1).optional(),

  pageSize: z.number().int().min(1).max(WRITING_PRACTICE_MAX_PAGE_SIZE).optional(),
});

const writingPracticeTaskInputSchema = z.object({
  taskId: z.string().uuid(),
});

export const getWritingPracticeLibraryServerFn = createServerFn({
  method: "GET",
})
  .validator(writingPracticeLibraryInputSchema)
  .handler(async ({ data }) => {
    const { requireAuthenticatedUserId } = await import("@/server/auth/session");

    const userId = await requireAuthenticatedUserId();

    try {
      return await getWritingPracticeLibrary(userId, {
        cefrLevel: data.cefrLevel,
        category: data.category,
        writingType: data.writingType,
        page: data.page,
        pageSize: data.pageSize,
      });
    } catch (error) {
      console.error("[writing:practice-library] failed", {
        name: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  });

export const getWritingPracticeTaskServerFn = createServerFn({
  method: "GET",
})
  .validator(writingPracticeTaskInputSchema)
  .handler(async ({ data }) => {
    const { requireAuthenticatedUserId } = await import("@/server/auth/session");

    const userId = await requireAuthenticatedUserId();

    return getWritingPracticeTask(userId, data.taskId);
  });
