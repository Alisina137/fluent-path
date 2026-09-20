import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
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

  if (typeof candidate.message === "string" && candidate.message.toLowerCase() === "aborted") {
    return true;
  }

  if (candidate.cause && candidate.cause !== error) {
    return isAbortLikeError(candidate.cause);
  }

  return false;
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as {
      unhandled?: unknown;
      message?: unknown;
    };

    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// h3 can convert an in-handler throw into a normal 500 JSON response.
// Normalize genuine catastrophic SSR failures into the application's
// HTML error page, while ignoring expected client-disconnect noise.
async function normalizeCatastrophicSsrResponse(
  response: Response,
  request: Request,
): Promise<Response> {
  if (response.status < 500) {
    return response;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return response;
  }

  const body = await response.clone().text();

  if (!isH3SwallowedErrorBody(body)) {
    return response;
  }

  // A browser/navigation/client disconnect can be converted by h3 into a
  // generic 500 JSON response before it reaches this wrapper. The Request
  // signal is the most reliable way to correlate that response with the
  // client abort; do not promote expected disconnects into catastrophic SSR
  // failures.
  if (request.signal.aborted) {
    consumeLastCapturedError();

    return new Response(null, {
      status: 499,
    });
  }

  const capturedError = consumeLastCapturedError();

  if (capturedError && isAbortLikeError(capturedError)) {
    return new Response(null, {
      status: 499,
    });
  }

  console.error(capturedError ?? new Error("A catastrophic SSR error was captured."));

  return new Response(renderErrorPage(), {
    status: 500,
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();

      const response = await handler.fetch(request, env, ctx);

      return await normalizeCatastrophicSsrResponse(response, request);
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
