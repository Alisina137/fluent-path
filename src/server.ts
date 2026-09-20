import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

type ErrorWithMetadata = {
  name?: unknown;
  message?: unknown;
  code?: unknown;
  cause?: unknown;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (module) => (module.default ?? module) as ServerEntry,
    );
  }

  return serverEntryPromise;
}

function isAbortLikeError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as ErrorWithMetadata;

  if (candidate.name === "AbortError") {
    return true;
  }

  if (candidate.code === "ECONNRESET") {
    return true;
  }

  if (
    typeof candidate.message === "string" &&
    candidate.message.toLowerCase() === "aborted"
  ) {
    return true;
  }

  if (candidate.cause && candidate.cause !== error) {
    return isAbortLikeError(candidate.cause);
  }

  return false;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();

      // Let TanStack/H3 own responses that it has already normalized.
      // Reinterpreting an H3 500 here is unsafe because client disconnects
      // (ECONNRESET) can be converted into a generic 500 before this wrapper
      // sees them, making them indistinguishable from genuine SSR failures.
      return await handler.fetch(request, env, ctx);
    } catch (error) {
      if (isAbortLikeError(error)) {
        return new Response(null, {
          status: 499,
        });
      }

      console.error(error);

      return new Response(renderErrorPage(), {
        status: 500,
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      });
    }
  },
};
