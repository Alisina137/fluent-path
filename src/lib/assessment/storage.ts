import type { AssessmentAttempt, AssessmentResult } from "@/lib/types";

const KEY = "ael.assessment.v1";

interface Store {
  attempts: AssessmentAttempt[];
  results: AssessmentResult[];
}

function read(): Store {
  if (typeof window === "undefined") return { attempts: [], results: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : { attempts: [], results: [] };
  } catch {
    return { attempts: [], results: [] };
  }
}

function write(store: Store) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(store));
}

export function saveAttempt(attempt: AssessmentAttempt, result: AssessmentResult) {
  const store = read();
  store.attempts = [attempt, ...store.attempts.filter((a) => a.id !== attempt.id)].slice(0, 20);
  store.results = [result, ...store.results.filter((r) => r.attempt_id !== attempt.id)].slice(0, 20);
  write(store);
}

export function latestResult(): AssessmentResult | null {
  return read().results[0] ?? null;
}

export function latestAttempt(): AssessmentAttempt | null {
  return read().attempts[0] ?? null;
}

export function allResults(): AssessmentResult[] {
  return read().results;
}