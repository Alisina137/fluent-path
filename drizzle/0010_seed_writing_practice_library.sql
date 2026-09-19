/*
 * Fluent Path - Writing Practice Library
 *
 * Initial production-ready guided exercises for the AI Writing Coach.
 * Four exercises are provided for each CEFR level from A1 through C2.
 *
 * Fixed UUIDs make this migration deterministic.
 * ON CONFLICT makes the insert safe against duplicate IDs.
 */

INSERT INTO "writing_tasks" (
    "id",
    "title",
    "prompt",
    "description",
    "category",
    "writing_type",
    "cefr_level",
    "min_words",
    "max_words",
    "audience",
    "purpose",
    "tone",
    "estimated_minutes",
    "sort_order",
    "is_active"
)
VALUES

-- ============================================================
-- A1 - Beginner
-- ============================================================

(
    '10000000-0000-4000-8000-000000000001',
    'Introduce Yourself',
    'Write a short introduction about yourself. Include your name, where you are from, what you do, and two things you like.',
    'Practice basic personal information and simple present-tense sentences.',
    'Everyday Life',
    'Personal Writing',
    'A1',
    40,
    70,
    'General learner',
    'Introduce yourself using simple English',
    'Friendly',
    10,
    10,
    1
),

(
    '10000000-0000-4000-8000-000000000002',
    'Describe Your Daily Routine',
    'Describe what you usually do from morning until evening on a normal day.',
    'Practice common daily activities, time expressions, and the simple present tense.',
    'Everyday Life',
    'Description',
    'A1',
    50,
    80,
    'General learner',
    'Describe a familiar daily routine',
    'Neutral',
    10,
    20,
    1
),

(
    '10000000-0000-4000-8000-000000000003',
    'A Message to a Friend',
    'Write a short message to a friend. Invite them to do something with you this weekend. Say what you want to do, where, and when.',
    'Practice writing a simple friendly invitation.',
    'Communication',
    'Message',
    'A1',
    40,
    70,
    'Friend',
    'Invite someone to an activity',
    'Friendly',
    10,
    30,
    1
),

(
    '10000000-0000-4000-8000-000000000004',
    'My Favorite Place',
    'Describe your favorite place. Say where it is, what it looks like, what you do there, and why you like it.',
    'Practice simple descriptive vocabulary and expressing basic preferences.',
    'Places',
    'Description',
    'A1',
    50,
    80,
    'General reader',
    'Describe a familiar place',
    'Positive',
    10,
    40,
    1
),

-- ============================================================
-- A2 - Elementary
-- ============================================================

(
    '10000000-0000-4000-8000-000000000005',
    'A Memorable Weekend',
    'Write about an interesting or enjoyable weekend you had. Explain where you went, what you did, who you were with, and how you felt.',
    'Practice describing past experiences using connected sentences.',
    'Experiences',
    'Personal Writing',
    'A2',
    80,
    120,
    'General learner',
    'Describe a past experience',
    'Friendly',
    15,
    50,
    1
),

(
    '10000000-0000-4000-8000-000000000006',
    'Ask for Information by Email',
    'Imagine you want to join an English course. Write an email asking about the course schedule, price, class size, and registration process.',
    'Practice polite questions and the basic structure of an email.',
    'Communication',
    'Email',
    'A2',
    80,
    120,
    'Course administrator',
    'Request practical information',
    'Polite',
    15,
    60,
    1
),

(
    '10000000-0000-4000-8000-000000000007',
    'A Person I Admire',
    'Describe a person you admire. Explain who the person is, what they are like, what they do, and why you admire them.',
    'Practice describing people, personality, and reasons.',
    'People',
    'Description',
    'A2',
    80,
    120,
    'General reader',
    'Describe and explain admiration for a person',
    'Positive',
    15,
    70,
    1
),

(
    '10000000-0000-4000-8000-000000000008',
    'Continue the Story',
    'You missed your bus on an important morning. Continue the story. Explain what happened next, what problem you faced, and how the day ended.',
    'Practice sequencing events and using past-tense language.',
    'Creative Writing',
    'Story',
    'A2',
    90,
    130,
    'General reader',
    'Tell a short sequence of events',
    'Informal',
    15,
    80,
    1
),

-- ============================================================
-- B1 - Intermediate
-- ============================================================

(
    '10000000-0000-4000-8000-000000000009',
    'Should Students Have Homework Every Day?',
    'Write your opinion about whether students should receive homework every day. Give at least two reasons and include an example.',
    'Practice organizing an opinion and supporting it with reasons.',
    'Education',
    'Opinion',
    'B1',
    130,
    180,
    'General reader',
    'Express and support an opinion',
    'Neutral',
    20,
    90,
    1
),

(
    '10000000-0000-4000-8000-000000000010',
    'Recommend a Place to Visit',
    'Write a review of a city, attraction, park, restaurant, or other place you know. Describe your experience and explain whether you recommend it.',
    'Practice descriptive and evaluative language in a structured review.',
    'Travel',
    'Review',
    'B1',
    130,
    180,
    'Travelers',
    'Describe and evaluate a place',
    'Engaging',
    20,
    100,
    1
),

(
    '10000000-0000-4000-8000-000000000011',
    'Request a Schedule Change',
    'Write an email to a teacher, manager, or colleague explaining why you need to change an appointment or scheduled activity. Suggest an alternative time.',
    'Practice clear, polite workplace or academic communication.',
    'Communication',
    'Email',
    'B1',
    120,
    170,
    'Teacher or colleague',
    'Request a schedule change',
    'Polite',
    20,
    110,
    1
),

(
    '10000000-0000-4000-8000-000000000012',
    'A Challenge You Overcame',
    'Write about a challenge you faced and overcame. Describe the situation, what made it difficult, what actions you took, and what you learned.',
    'Practice narrative organization, reflection, and connected past events.',
    'Experiences',
    'Personal Writing',
    'B1',
    140,
    190,
    'General reader',
    'Narrate and reflect on a personal experience',
    'Reflective',
    20,
    120,
    1
),

-- ============================================================
-- B2 - Upper Intermediate
-- ============================================================

(
    '10000000-0000-4000-8000-000000000013',
    'Online Learning or Classroom Learning?',
    'Compare online learning with traditional classroom learning. Discuss advantages and disadvantages of both and explain which situations suit each approach.',
    'Practice balanced comparison, paragraph organization, and supported reasoning.',
    'Education',
    'Essay',
    'B2',
    200,
    280,
    'General reader',
    'Compare two approaches and develop a balanced argument',
    'Academic',
    30,
    130,
    1
),

(
    '10000000-0000-4000-8000-000000000014',
    'Social Media and Communication',
    'Some people believe social media improves communication, while others believe it weakens real relationships. Discuss both views and give your own position.',
    'Practice discussing contrasting viewpoints and forming a reasoned conclusion.',
    'Technology',
    'Argumentative Writing',
    'B2',
    220,
    300,
    'General reader',
    'Evaluate contrasting views and defend a position',
    'Formal',
    30,
    140,
    1
),

(
    '10000000-0000-4000-8000-000000000015',
    'Formal Complaint',
    'Write a formal email to a company about a product or service that did not meet your expectations. Describe the problem, explain its impact, and request a reasonable solution.',
    'Practice formal register, complaint structure, and clear requests.',
    'Professional Communication',
    'Formal Email',
    'B2',
    180,
    240,
    'Customer service representative',
    'Make a formal complaint and request action',
    'Formal',
    25,
    150,
    1
),

(
    '10000000-0000-4000-8000-000000000016',
    'The Value of Learning Another Language',
    'Write an essay explaining how learning another language can affect education, employment, travel, and understanding of other cultures. Support your ideas with examples.',
    'Practice explanatory essay structure and development of supporting ideas.',
    'Language Learning',
    'Essay',
    'B2',
    220,
    300,
    'General reader',
    'Explain benefits using developed examples',
    'Academic',
    30,
    160,
    1
),

-- ============================================================
-- C1 - Advanced
-- ============================================================

(
    '10000000-0000-4000-8000-000000000017',
    'Remote Work and the Future of Organizations',
    'Evaluate the long-term effects of remote and hybrid work on productivity, collaboration, employee well-being, and organizational culture. Present a nuanced position supported by examples.',
    'Practice advanced argumentation, qualification, cohesion, and professional vocabulary.',
    'Work and Careers',
    'Essay',
    'C1',
    300,
    420,
    'Educated general reader',
    'Critically evaluate a workplace trend',
    'Analytical',
    40,
    170,
    1
),

(
    '10000000-0000-4000-8000-000000000018',
    'Proposal for Improving Your Community',
    'Write a formal proposal identifying an important problem in your community. Analyze its causes and consequences, then recommend practical actions that local organizations or residents could take.',
    'Practice problem analysis, formal proposals, and evidence-based recommendations.',
    'Society',
    'Proposal',
    'C1',
    300,
    420,
    'Community decision-makers',
    'Analyze a problem and recommend solutions',
    'Formal',
    40,
    180,
    1
),

(
    '10000000-0000-4000-8000-000000000019',
    'Does Technology Make Us More Productive?',
    'Assess the claim that modern technology makes people more productive. Consider both productivity gains and possible disadvantages such as distraction, information overload, or dependence on digital tools.',
    'Practice critical evaluation and sophisticated development of contrasting arguments.',
    'Technology',
    'Argumentative Writing',
    'C1',
    320,
    450,
    'Educated general reader',
    'Critically assess a broad claim',
    'Analytical',
    45,
    190,
    1
),

(
    '10000000-0000-4000-8000-000000000020',
    'Professional Project Report',
    'Imagine you recently completed a team project. Write a concise report describing the project objective, approach, main results, difficulties encountered, and recommendations for future projects.',
    'Practice structured professional reporting and concise formal language.',
    'Professional Communication',
    'Report',
    'C1',
    280,
    400,
    'Manager or project stakeholder',
    'Report results and make recommendations',
    'Professional',
    40,
    200,
    1
),

-- ============================================================
-- C2 - Proficient
-- ============================================================

(
    '10000000-0000-4000-8000-000000000021',
    'Individual Freedom and Social Responsibility',
    'To what extent should individual freedom be limited when personal choices create significant consequences for society? Develop a nuanced argument that addresses competing principles and possible exceptions.',
    'Practice precise argumentation, qualification, counterargument, and sophisticated cohesion.',
    'Society',
    'Argumentative Writing',
    'C2',
    400,
    550,
    'Educated general reader',
    'Develop a nuanced argument about competing principles',
    'Academic',
    55,
    210,
    1
),

(
    '10000000-0000-4000-8000-000000000022',
    'Artificial Intelligence and Human Judgment',
    'Evaluate the extent to which important decisions should be delegated to artificial intelligence. Consider areas where automation may improve decisions as well as situations where human judgment should remain central.',
    'Practice advanced critical analysis and careful treatment of complex trade-offs.',
    'Technology',
    'Critical Essay',
    'C2',
    420,
    580,
    'Educated general reader',
    'Critically evaluate the limits of automated decision-making',
    'Analytical',
    60,
    220,
    1
),

(
    '10000000-0000-4000-8000-000000000023',
    'Education Beyond Employment',
    'Some argue that the primary purpose of education is to prepare people for employment, while others see education as having broader intellectual, civic, and personal purposes. Critically examine these perspectives and develop your own position.',
    'Practice synthesis of competing perspectives and sustained academic argument.',
    'Education',
    'Critical Essay',
    'C2',
    420,
    580,
    'Academic reader',
    'Synthesize perspectives and defend a nuanced position',
    'Academic',
    60,
    230,
    1
),

(
    '10000000-0000-4000-8000-000000000024',
    'Policy Brief on Sustainable Cities',
    'Write a policy brief recommending how a rapidly growing city could improve environmental sustainability without seriously restricting economic opportunity. Address transportation, housing, energy, and implementation challenges.',
    'Practice concise high-level policy analysis, prioritization, and recommendations.',
    'Environment',
    'Policy Brief',
    'C2',
    400,
    550,
    'Policy decision-makers',
    'Recommend and justify a balanced policy approach',
    'Professional',
    60,
    240,
    1
)

ON CONFLICT ("id") DO NOTHING;