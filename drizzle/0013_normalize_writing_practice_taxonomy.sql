/*
 * Fluent Path - Normalize Writing Practice Taxonomy
 *
 * Canonicalizes category labels that represent the same concept.
 * Intentionally distinct writing types (for example Essay vs Critical Essay,
 * Story vs Literary Story, Email vs Formal Email) are preserved.
 */

-- Work category appeared in both ampersand and "and" forms.
UPDATE "writing_tasks"
SET
    "category" = 'Work & Careers',
    "updated_at" = NOW()
WHERE "category" = 'Work and Careers';

-- Consolidate the beginner/intermediate money label into the broader
-- production business taxonomy.
UPDATE "writing_tasks"
SET
    "category" = 'Business & Economics',
    "updated_at" = NOW()
WHERE "category" = 'Business & Money';

-- Keep these deliberately distinct:
-- Technology / Technology & AI
-- Science / Science & Everyday Life / Science & Knowledge
-- Health & Lifestyle / Health & Society
-- Language Learning / Language & Communication / Language & Society
-- Leadership / Leadership & Institutions
-- Consumer & Digital Society / Consumer Life
-- Travel / Travel & Tourism
-- Ethics & Everyday Decisions / Ethics & Society / Ethics & Philosophy
--
-- Writing types are also deliberately not collapsed:
-- Email / Formal Email
-- Essay / Academic Essay / Critical Essay
-- Story / Simple Story / Literary Story
-- Report / Analytical Report
-- Personal Writing / Reflective Writing
