/*
 * Fluent Path - Consolidate Writing Practice Categories
 *
 * Consolidates overlapping category labels into the canonical production
 * taxonomy. This changes category labels only; exercises and writing types
 * remain intact.
 */

UPDATE "writing_tasks"
SET
    "category" = CASE
        /* Communication */
        WHEN "category" = 'Professional Communication'
            THEN 'Communication'

        /* People and relationships */
        WHEN "category" IN ('People', 'Family & Friends')
            THEN 'People & Relationships'

        /* Work */
        WHEN "category" IN ('Work & Study', 'Work & Careers')
            THEN 'Work & Careers'

        /* Business */
        WHEN "category" IN ('Business & Economics', 'Economics & Business')
            THEN 'Business & Economics'

        /* Technology */
        WHEN "category" IN ('Technology', 'Technology & AI', 'Consumer & Digital Society')
            THEN 'Technology & AI'

        /* Science */
        WHEN "category" IN ('Science', 'Science & Everyday Life', 'Science & Knowledge')
            THEN 'Science'

        /* Health */
        WHEN "category" IN ('Health & Lifestyle', 'Health & Society')
            THEN 'Health & Lifestyle'

        /* Travel */
        WHEN "category" IN ('Travel', 'Travel & Tourism')
            THEN 'Travel & Tourism'

        /* Language */
        WHEN "category" IN (
            'Language Learning',
            'Language & Communication',
            'Language & Society'
        )
            THEN 'Language Learning'

        /* Society and culture */
        WHEN "category" IN (
            'Society',
            'Media & Culture',
            'Culture & Identity',
            'Ethics & Everyday Decisions',
            'Ethics & Society',
            'Ethics & Philosophy'
        )
            THEN 'Society & Culture'

        /* Civic life / institutions / policy */
        WHEN "category" IN (
            'Civic Life',
            'Public Policy',
            'Democracy & Institutions',
            'Leadership',
            'Leadership & Institutions',
            'Global Affairs',
            'Global Issues'
        )
            THEN 'Civic Life & Public Policy'

        /* Keep already-canonical categories unchanged. */
        ELSE "category"
    END,
    "updated_at" = NOW()
WHERE "category" IN (
    'Professional Communication',
    'People',
    'Family & Friends',
    'Work & Study',
    'Work & Careers',
    'Business & Economics',
    'Economics & Business',
    'Technology',
    'Technology & AI',
    'Consumer & Digital Society',
    'Science',
    'Science & Everyday Life',
    'Science & Knowledge',
    'Health & Lifestyle',
    'Health & Society',
    'Travel',
    'Travel & Tourism',
    'Language Learning',
    'Language & Communication',
    'Language & Society',
    'Society',
    'Media & Culture',
    'Culture & Identity',
    'Ethics & Everyday Decisions',
    'Ethics & Society',
    'Ethics & Philosophy',
    'Civic Life',
    'Public Policy',
    'Democracy & Institutions',
    'Leadership',
    'Leadership & Institutions',
    'Global Affairs',
    'Global Issues'
);
