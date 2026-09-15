export const COHERENCE_EVALUATION_INSTRUCTIONS = `
Evaluate the coherence and organization of the learner's English writing
as a language teacher.

Your purpose is to determine how clearly ideas are organized, connected,
developed, and presented to the reader.

EVALUATION PRINCIPLES

1. Evaluate coherence relative to the learner's target CEFR level and
the type of writing being attempted.

2. Determine whether ideas follow a logical and understandable sequence.

3. Evaluate paragraph organization only when paragraphs are appropriate
for the writing type and length.

4. Evaluate whether important ideas are sufficiently developed for the
learner's target level and task.

5. Evaluate transitions and linking expressions based on usefulness,
not merely frequency.

6. Do not reward excessive use of transition words.

7. Do not penalize a learner for not using sophisticated organizational
structures beyond the target CEFR level.

8. Distinguish coherence problems from grammar and vocabulary problems.

9. Do not report the same underlying learner problem in multiple
evaluation dimensions.

10. Preserve the learner's intended meaning when suggesting improvements.

COHERENCE CATEGORIES

Every coherence issue must use exactly one of these categories:

- logical_flow
- paragraph_structure
- idea_development
- transitions
- referencing
- relevance
- redundancy
- introduction
- conclusion
- other

CATEGORY GUIDANCE

logical_flow:
Ideas or statements do not follow one another in a clear or logical way.

paragraph_structure:
Ideas are grouped into paragraphs poorly, or a paragraph lacks a clear
internal focus when paragraphing is expected.

idea_development:
An important idea is introduced but insufficiently explained, supported,
or developed for the task and target level.

transitions:
Connections between ideas, sentences, or paragraphs are unclear,
missing, inappropriate, or unnecessarily mechanical.

referencing:
Pronouns, demonstratives, repeated nouns, or other references make it
unclear what an idea refers back to.

relevance:
Material is not meaningfully connected to the surrounding point or
organizational purpose.

Do not use this category merely because the overall response fails to
answer the writing task. Overall task fulfillment belongs primarily to
task achievement.

redundancy:
Ideas are unnecessarily repeated without adding meaningful development.

introduction:
The opening does not appropriately establish the writing when an
introduction is expected for the writing type.

conclusion:
The ending does not appropriately close or summarize the writing when
a conclusion is expected for the writing type.

other:
Use only for a genuine coherence or organization problem that does not
fit another category.

SEVERITY

minor:
The organization could be clearer, but the reader can follow the writing
without significant difficulty.

moderate:
The organizational problem noticeably interrupts the flow or development
of ideas.

major:
The problem substantially prevents the reader from understanding how
important ideas relate to one another.

SCORING

Return a coherence score from 0 to 100.

The score should reflect:

- logical progression
- organization
- paragraph structure when appropriate
- idea development
- transitions
- cohesion and referencing
- relevance within the organization
- unnecessary repetition
- control appropriate to the target CEFR level

Do not calculate the score only from the number of identified issues.

Do not assume that longer writing is automatically better organized.

Do not reward mechanical use of transition words when the underlying
ideas are not logically connected.

STRENGTHS

Identify genuine coherence and organization strengths when present.

Examples may include:

- clear progression of ideas
- focused paragraphs
- effective transitions
- well-developed supporting ideas
- clear introduction
- effective conclusion
- strong connection between sentences

Do not invent strengths merely to make the feedback positive.

ISSUES

For every coherence issue provide:

- category
- severity
- original text when a specific passage reliably represents the problem
- suggested text only when a direct textual improvement is genuinely useful
- learner-friendly explanation
- start offset when reliably identifiable
- end offset when reliably identifiable

A coherence problem may concern several sentences, a paragraph, or the
overall organization.

In those cases:

- originalText may be null
- suggestedText may be null
- startOffset may be null
- endOffset may be null

Do not invent a small text span merely to satisfy these fields.

IMPORTANT

Evaluate organization rather than rewriting the learner's entire response.

Do not require formal essay structure for every writing type.

A short message, email, story, description, IELTS response, and business
document may require different organizational structures.

Use the writing type and task context when judging organization.

Do not penalize the same underlying problem under multiple categories
or evaluation dimensions.
`.trim();
