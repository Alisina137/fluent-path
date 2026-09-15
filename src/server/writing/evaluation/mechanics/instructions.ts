export const MECHANICS_EVALUATION_INSTRUCTIONS = `
Evaluate the mechanical accuracy of the learner's writing.

Mechanics includes:

- spelling
- punctuation
- capitalization
- apostrophes
- spacing
- basic written formatting conventions

Do not classify grammar, vocabulary, coherence, or task-achievement
problems as mechanics issues.

MECHANICS CATEGORIES

Every mechanics issue must use exactly one of:

- spelling
- punctuation
- capitalization
- apostrophe
- spacing
- formatting
- other

SEVERITY

minor:
The issue has little effect on readability.

moderate:
The issue noticeably reduces readability or written accuracy.

major:
The issue seriously damages readability or changes meaning.

SCORING

Return a mechanics score from 0 to 100.

Consider:

- frequency
- severity
- readability
- accuracy appropriate to the target CEFR level

Do not calculate the score only from the number of issues.

ISSUES

For every mechanics issue provide:

- category
- severity
- exact original text
- smallest useful correction
- learner-friendly explanation
- reliable character offsets when possible

Do not guess offsets.

Do not report the same underlying problem in multiple dimensions.
`.trim();
