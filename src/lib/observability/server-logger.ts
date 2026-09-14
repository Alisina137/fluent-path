export type ServerSubsystem =
  | "server"
  | "speaking_ai"
  | "speaking_stt"
  | "speaking_tts"
  | "speaking_grammar_feedback"
  | "speaking_vocabulary_feedback"
  | "speaking_fluency_feedback"
  | "speaking_custom_scenario";

type ServerLogInput = {
  subsystem: ServerSubsystem;
  operation: string;
  error?: unknown;
  code?: string;
};

function createEventId(): string {
  return globalThis.crypto.randomUUID();
}

function getErrorType(error: unknown): string {
  if (error instanceof Error) {
    return error.name || "Error";
  }

  if (error === null) {
    return "null";
  }

  return typeof error;
}

function getErrorCode(error: unknown): string | undefined {
  if (error === null || typeof error !== "object" || !("code" in error)) {
    return undefined;
  }

  const code = (error as { code?: unknown }).code;

  if (typeof code === "string" || typeof code === "number") {
    return String(code).slice(0, 64);
  }

  return undefined;
}

export function logServerError(input: ServerLogInput): string {
  const eventId = createEventId();

  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      eventId,
      subsystem: input.subsystem,
      operation: input.operation,
      errorType: getErrorType(input.error),
      errorCode: input.code ?? getErrorCode(input.error),
    }),
  );

  return eventId;
}
