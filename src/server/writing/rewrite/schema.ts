import { z } from "zod";

const writingRewriteProviderSchema = z
  .object({
    rewrittenText: z.string().trim().min(1).max(5_000),
    explanation: z.string().trim().min(1).max(2_000),
    learningPoint: z.string().trim().min(1).max(1_000),
  })
  .strict();

export type ValidatedWritingRewriteProviderResult = z.infer<typeof writingRewriteProviderSchema>;

export function validateWritingRewriteProviderResult(
  value: unknown,
): ValidatedWritingRewriteProviderResult {
  return writingRewriteProviderSchema.parse(value);
}
