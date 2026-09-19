import { and, asc, count, eq, type SQL } from "drizzle-orm";

import { getDb } from "@/db/client";
import { writingTasks } from "@/db/schema";
import { MODULE_IDS } from "@/server/modules/constants";
import { requireServerModuleAccess } from "@/server/modules/route-access";

export const writingPracticeCefrLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export type WritingPracticeCefrLevel = (typeof writingPracticeCefrLevels)[number];

export const WRITING_PRACTICE_DEFAULT_PAGE_SIZE = 10;
export const WRITING_PRACTICE_MAX_PAGE_SIZE = 50;

export interface WritingPracticeLibraryFilters {
  cefrLevel?: WritingPracticeCefrLevel;
  category?: string;
  writingType?: string;
  page?: number;
  pageSize?: number;
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

export interface WritingPracticeLibraryPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface WritingPracticeLibraryResult {
  tasks: WritingPracticeLibraryTask[];
  facets: WritingPracticeLibraryFacets;
  pagination: WritingPracticeLibraryPagination;
}

function normalizeOptionalFilter(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  return normalized || undefined;
}

function normalizePage(value: number | undefined): number {
  if (!value || !Number.isInteger(value) || value < 1) {
    return 1;
  }

  return value;
}

function normalizePageSize(value: number | undefined): number {
  if (!value || !Number.isInteger(value) || value < 1) {
    return WRITING_PRACTICE_DEFAULT_PAGE_SIZE;
  }

  return Math.min(value, WRITING_PRACTICE_MAX_PAGE_SIZE);
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

function buildCategoryFacetConditions(filters: WritingPracticeLibraryFilters): SQL[] {
  const conditions: SQL[] = [eq(writingTasks.isActive, 1)];

  if (filters.cefrLevel) {
    conditions.push(eq(writingTasks.cefrLevel, filters.cefrLevel));
  }

  return conditions;
}

function buildWritingTypeFacetConditions(filters: WritingPracticeLibraryFilters): SQL[] {
  const conditions = buildCategoryFacetConditions(filters);

  const category = normalizeOptionalFilter(filters.category);

  if (category) {
    conditions.push(eq(writingTasks.category, category));
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

  const page = normalizePage(filters.page);
  const pageSize = normalizePageSize(filters.pageSize);

  const taskConditions = buildTaskConditions(filters);
  const categoryFacetConditions = buildCategoryFacetConditions(filters);
  const writingTypeFacetConditions = buildWritingTypeFacetConditions(filters);

  try {
    const [tasks, totalRows, cefrRows, categoryRows, writingTypeRows] = await Promise.all([
      db
        .select()
        .from(writingTasks)
        .where(and(...taskConditions))
        .orderBy(asc(writingTasks.sortOrder), asc(writingTasks.title))
        .limit(pageSize)
        .offset((page - 1) * pageSize),

      db
        .select({
          count: count(),
        })
        .from(writingTasks)
        .where(and(...taskConditions)),

      db
        .selectDistinct({
          cefrLevel: writingTasks.cefrLevel,
        })
        .from(writingTasks)
        .where(eq(writingTasks.isActive, 1)),

      db
        .selectDistinct({
          category: writingTasks.category,
        })
        .from(writingTasks)
        .where(and(...categoryFacetConditions))
        .orderBy(asc(writingTasks.category)),

      db
        .selectDistinct({
          writingType: writingTasks.writingType,
        })
        .from(writingTasks)
        .where(and(...writingTypeFacetConditions))
        .orderBy(asc(writingTasks.writingType)),
    ]);

    const totalItems = Number(totalRows[0]?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    const cefrSet = new Set(cefrRows.map((row) => row.cefrLevel));

    const categories = categoryRows.map((row) => row.category.trim()).filter(Boolean);

    const writingTypes = writingTypeRows.map((row) => row.writingType.trim()).filter(Boolean);

    return {
      tasks: tasks.map(mapTask),

      facets: {
        cefrLevels: writingPracticeCefrLevels.filter((level) => cefrSet.has(level)),
        categories,
        writingTypes,
      },

      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  } catch (error) {
    console.error("[practice-library] query failed", error);
    console.error("[practice-library] cause", (error as { cause?: unknown })?.cause);

    throw error;
  }
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
