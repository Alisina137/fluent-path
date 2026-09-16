import { and, asc, eq, type SQL } from "drizzle-orm";

import { getDb } from "@/db/client";
import { writingTasks } from "@/db/schema";
import { MODULE_IDS } from "@/server/modules/constants";
import { requireServerModuleAccess } from "@/server/modules/route-access";

export const writingPracticeCefrLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export type WritingPracticeCefrLevel = (typeof writingPracticeCefrLevels)[number];

export interface WritingPracticeLibraryFilters {
  cefrLevel?: WritingPracticeCefrLevel;
  category?: string;
  writingType?: string;
}

export interface WritingPracticeLibraryTask {
  id: string;
  title: string;
  prompt: string;
  description: string | null;
  category: string;
  writingType: string;
  cefrLevel: string;
  minWords: number | null;
  maxWords: number | null;
  audience: string | null;
  purpose: string | null;
  tone: string | null;
  estimatedMinutes: number | null;
  sortOrder: number;
}

export interface WritingPracticeLibraryFacets {
  cefrLevels: WritingPracticeCefrLevel[];
  categories: string[];
  writingTypes: string[];
}

export interface WritingPracticeLibraryResult {
  tasks: WritingPracticeLibraryTask[];
  facets: WritingPracticeLibraryFacets;
}

function normalizeOptionalFilter(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  return normalized || undefined;
}

function buildTaskConditions(filters: WritingPracticeLibraryFilters): SQL[] {
  const conditions: SQL[] = [eq(writingTasks.isActive, 1)];

  if (filters.cefrLevel) {
    conditions.push(eq(writingTasks.cefrLevel, filters.cefrLevel));
  }

  const category = normalizeOptionalFilter(filters.category);

  if (category) {
    conditions.push(eq(writingTasks.category, category));
  }

  const writingType = normalizeOptionalFilter(filters.writingType);

  if (writingType) {
    conditions.push(eq(writingTasks.writingType, writingType));
  }

  return conditions;
}

function mapTask(task: typeof writingTasks.$inferSelect): WritingPracticeLibraryTask {
  return {
    id: task.id,
    title: task.title,
    prompt: task.prompt,
    description: task.description,
    category: task.category,
    writingType: task.writingType,
    cefrLevel: task.cefrLevel,
    minWords: task.minWords,
    maxWords: task.maxWords,
    audience: task.audience,
    purpose: task.purpose,
    tone: task.tone,
    estimatedMinutes: task.estimatedMinutes,
    sortOrder: task.sortOrder,
  };
}

export async function getWritingPracticeLibrary(
  userId: string,
  filters: WritingPracticeLibraryFilters = {},
): Promise<WritingPracticeLibraryResult> {
  await requireServerModuleAccess(userId, MODULE_IDS.writing);

  const db = getDb();

  const conditions = buildTaskConditions(filters);

  let tasks: (typeof writingTasks.$inferSelect)[];
  let facetRows: { cefrLevel: string; category: string; writingType: string }[];

  try {
    [tasks, facetRows] = await Promise.all([
      db
        .select()
        .from(writingTasks)
        .where(and(...conditions))
        .orderBy(asc(writingTasks.sortOrder), asc(writingTasks.title)),

      db
        .select({
          cefrLevel: writingTasks.cefrLevel,
          category: writingTasks.category,
          writingType: writingTasks.writingType,
        })
        .from(writingTasks)
        .where(eq(writingTasks.isActive, 1)),
    ]);
  } catch (error) {
    console.error("[practice-library] query failed", error);
    console.error("[practice-library] cause", (error as { cause?: unknown })?.cause);
    throw error;
  }

  const cefrSet = new Set(facetRows.map((row) => row.cefrLevel));

  const categories = [...new Set(facetRows.map((row) => row.category.trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b),
  );

  const writingTypes = [
    ...new Set(facetRows.map((row) => row.writingType.trim()).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));

  return {
    tasks: tasks.map(mapTask),

    facets: {
      cefrLevels: writingPracticeCefrLevels.filter((level) => cefrSet.has(level)),
      categories,
      writingTypes,
    },
  };
}

export async function getWritingPracticeTask(
  userId: string,
  taskId: string,
): Promise<WritingPracticeLibraryTask | null> {
  await requireServerModuleAccess(userId, MODULE_IDS.writing);

  const db = getDb();

  const [task] = await db
    .select()
    .from(writingTasks)
    .where(and(eq(writingTasks.id, taskId), eq(writingTasks.isActive, 1)))
    .limit(1);

  return task ? mapTask(task) : null;
}
