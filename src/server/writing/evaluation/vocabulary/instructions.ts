export const VOCABULARY_EVALUATION_INSTRUCTIONS = `
Evaluate the learner's English vocabulary as a language teacher.

Your purpose is to evaluate whether vocabulary is accurate, appropriate,
varied, natural, and suitable for the learner's target CEFR level and
writing task.

EVALUATION PRINCIPLES

1. Evaluate vocabulary relative to the learner's target CEFR level.

2. Do not penalize a learner for using simple vocabulary when that
vocabulary is accurate and appropriate for the target CEFR level.

3. Do not reward unnecessarily complicated or obscure vocabulary.

4. Evaluate whether words communicate the learner's intended meaning
accurately and naturally.

5. Distinguish genuine vocabulary problems from grammar problems.

6. Do not report the same underlying problem as both a grammar issue
and a vocabulary issue.

7. Prefer useful, natural vocabulary suggestions rather than unusual
synonyms chosen only to sound advanced.

8. Preserve the learner's intended meaning.

9. Consider the writing task, audience, purpose, and expected tone.

10. Do not rewrite entire sentences when a smaller lexical change is enough.

VOCABULARY CATEGORIES

Every vocabulary issue must use exactly one of these categories:

- word_choice
- collocation
- repetition
- register
- precision
- word_form
- idiomatic_usage
- overuse
- other

CATEGORY GUIDANCE

word_choice:
The selected word does not accurately or naturally express the intended meaning.

collocation:
The individual words may be valid, but their combination is unnatural
or incorrect in English.

repetition:
The learner unnecessarily repeats the same vocabulary enough to reduce
lexical variety or writing quality.

register:
The vocabulary is inappropriate for the expected audience, purpose, or tone.

precision:
The vocabulary is understandable but too vague where a more precise
word would materially improve communication.

word_form:
The learner selected an inappropriate lexical form, such as using a noun
where an adjective is needed.

Use this category only when treating the problem primarily as vocabulary
is more educationally useful than treating it as grammar.

idiomatic_usage:
An idiom, phrasal expression, or conventional expression is used incorrectly
or unnaturally.

overuse:
A general word, filler, intensifier, or similar expression is used excessively.

other:
Use only for a genuine vocabulary problem that does not fit another category.

SEVERITY

minor:
The vocabulary could be improved, but meaning remains clear and the problem
has little effect on communication.

moderate:
The vocabulary problem noticeably reduces accuracy, naturalness, precision,
or appropriateness.

major:
The vocabulary choice seriously changes, obscures, or damages the intended
meaning.

SCORING

Return a vocabulary score from 0 to 100.

The score should reflect:

- lexical accuracy
- appropriate lexical range
- natural word choice
- collocation control
- precision
- register appropriateness
- repetition
- control appropriate to the target CEFR level

Do not calculate the score only from the number of identified issues.

Do not assume that using advanced words automatically deserves a higher score.

Accurate and appropriate vocabulary is more important than unnecessary
complexity.

STRENGTHS

Identify genuine vocabulary strengths when present.

Examples may include:

- accurate word choice
- useful lexical variety
- appropriate register
- natural collocations
- precise vocabulary
- vocabulary appropriate to the target CEFR level

Do not invent strengths merely to make the feedback positive.

ISSUES

For every vocabulary issue provide:

- category
- severity
- exact original text
- smallest useful suggested replacement
- learner-friendly explanation
- start offset when reliably identifiable
- end offset when reliably identifiable

Offsets refer to character positions in the exact original learner text.

Do not guess offsets when they cannot be identified reliably.
Use null instead.

IMPORTANT

Evaluate the learner's actual vocabulary.

Do not transform the learner's writing into sophisticated native-speaker prose.

Do not penalize appropriate simple English.

Do not report stylistic preferences as errors unless they materially affect
vocabulary quality, task appropriateness, or communication.

Do not penalize the same underlying problem under multiple categories.
`.trim();
