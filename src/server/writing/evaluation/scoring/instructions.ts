import type { WritingCefrLevel } from "./cefr";

const CEFR_EXPECTATIONS: Record<WritingCefrLevel, string> = {
  A1: `
Expect very simple connected or sentence-level writing.

The learner may rely on:
- basic sentence patterns
- common everyday vocabulary
- simple present and other basic structures
- short statements
- basic connectors such as "and" or "but"

Do not penalize the learner for lacking complex grammar,
advanced vocabulary, or sophisticated organization.
`,

  A2: `
Expect simple writing about familiar and everyday topics.

The learner should show increasing control of:
- common grammatical structures
- basic past, present, and future references
- familiar vocabulary
- simple connected sentences
- basic sequencing and linking
- straightforward communicative purposes

Do not require complex academic or advanced stylistic language.
`,

  B1: `
Expect reasonably connected writing on familiar topics and experiences.

The learner should show:
- usable control of common grammar
- some sentence variety
- sufficient vocabulary for familiar topics
- understandable paragraph or idea organization when appropriate
- basic development of reasons, descriptions, experiences, and opinions
- generally successful completion of familiar writing tasks

Errors are acceptable when they do not regularly prevent communication.
`,

  B2: `
Expect clear and reasonably detailed writing across a wider range of topics.

The learner should show:
- good control of common grammatical structures
- meaningful sentence variety
- sufficient lexical range and precision
- generally natural word combinations
- clear organization and development
- effective connections between ideas
- appropriate control of audience, purpose, and tone

Some errors are acceptable, particularly in more complex language.
`,

  C1: `
Expect clear, well-structured, flexible, and detailed writing.

The learner should show:
- strong grammatical control
- flexible sentence structures
- broad and precise vocabulary
- good control of register
- well-developed and logically connected ideas
- effective organization
- successful handling of demanding communicative purposes

Occasional errors should not significantly reduce clarity or effectiveness.
`,

  C2: `
Expect highly controlled, precise, flexible, and effective writing.

The learner should show:
- consistently strong grammatical control
- highly flexible language use
- broad and precise lexical resources
- nuanced control of register and meaning
- sophisticated but natural organization where appropriate
- strong cohesion
- highly effective fulfillment of complex writing purposes

Do not demand artificial complexity. Natural precision and effectiveness
matter more than unnecessarily elaborate language.
`,
};

export function buildCefrScoringInstructions(level: WritingCefrLevel): string {
  return `
TARGET CEFR LEVEL: ${level}

Evaluate the learner relative to the expected writing ability at this
target CEFR level.

${CEFR_EXPECTATIONS[level]}

CEFR SCORING PRINCIPLES

1. The target level is the primary evaluation benchmark.

2. Do not penalize learners for failing to demonstrate language that
substantially exceeds the target level.

3. Do not reward unnecessary complexity merely because it appears advanced.

4. Accuracy, clarity, appropriateness, and successful communication matter
more than showing off difficult language.

5. A learner may demonstrate ability above the target level.

6. A learner may also perform below the target level.

7. The estimated CEFR level should reflect demonstrated performance in
this specific writing sample, not permanently classify the learner.

8. Short writing samples provide less evidence for CEFR estimation.
Do not infer advanced ability from one sophisticated sentence.

9. Evaluate grammar, vocabulary, coherence, and task achievement separately
before forming an overall judgment.

10. Do not lower all dimension scores merely because one dimension is weak.
`.trim();
}
