import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  getWritingPracticeLibrary,
  getWritingPracticeTask,
  writingPracticeCefrLevels,
} from "@/server/writing/practice-library";

const optionalFilterSchema = z.string().trim().min(1).max(100).optional();

const writingPracticeLibraryInputSchema = z.object({
  userId: z.string().uuid(),

  cefrLevel: z.enum(writingPracticeCefrLevels).optional(),

  category: optionalFilterSchema,

  writingType: optionalFilterSchema,
});

const writingPracticeTaskInputSchema = z.object({
  userId: z.string().uuid(),
  taskId: z.string().uuid(),
});

export const getWritingPracticeLibraryServerFn = createServerFn({
  method: "GET",
})
  .validator(writingPracticeLibraryInputSchema)
  .handler(async ({ data }) => {
    try {
      return await getWritingPracticeLibrary(data.userId, {
        cefrLevel: data.cefrLevel,
        category: data.category,
        writingType: data.writingType,
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
    return getWritingPracticeTask(data.userId, data.taskId);
  });
