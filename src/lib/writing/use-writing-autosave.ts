import { useCallback, useEffect, useRef, useState } from "react";

import { getWritingDraftServerFn, saveWritingDraftServerFn } from "@/lib/writing/draft-functions";

export type WritingAutosaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

interface UseWritingAutosaveOptions {
  userId: string;
  sessionId: string;
  sessionStatus: "active" | "completed" | "abandoned";
  autosaveDelayMs?: number;
}

interface UseWritingAutosaveResult {
  content: string;
  setContent: (content: string) => void;
  status: WritingAutosaveStatus;
  isLoading: boolean;
  error: string | null;
  lastSavedAt: Date | null;
  wordCount: number;
  characterCount: number;
  saveNow: () => Promise<boolean>;
}

export function useWritingAutosave({
  userId,
  sessionId,
  sessionStatus,
  autosaveDelayMs = 1200,
}: UseWritingAutosaveOptions): UseWritingAutosaveResult {
  const [content, setContentState] = useState("");
  const [status, setStatus] = useState<WritingAutosaveStatus>("idle");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);

  const loadedRef = useRef(false);
  const contentRef = useRef("");
  const lastPersistedContentRef = useRef("");
  const saveRequestIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    loadedRef.current = false;
    setIsLoading(true);
    setError(null);
    setStatus("idle");

    void getWritingDraftServerFn({
      data: {
        userId,
        sessionId,
      },
    })
      .then((draft) => {
        if (cancelled) {
          return;
        }

        contentRef.current = draft.content;
        lastPersistedContentRef.current = draft.content;

        setContentState(draft.content);
        setWordCount(draft.wordCount);
        setCharacterCount(draft.characterCount);
        setLastSavedAt(new Date(draft.lastSavedAt));
        setStatus("saved");

        loadedRef.current = true;
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setError("Unable to restore your saved draft.");
        setStatus("error");
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId, userId]);

  const persistContent = useCallback(
    async (contentToSave: string): Promise<boolean> => {
      if (!loadedRef.current || sessionStatus !== "active") {
        return false;
      }

      if (contentToSave === lastPersistedContentRef.current) {
        setStatus("saved");
        return true;
      }

      const requestId = ++saveRequestIdRef.current;

      setStatus("saving");
      setError(null);

      try {
        const result = await saveWritingDraftServerFn({
          data: {
            userId,
            sessionId,
            content: contentToSave,
          },
        });

        if (requestId !== saveRequestIdRef.current) {
          return false;
        }

        lastPersistedContentRef.current = result.draft.content;

        setWordCount(result.draft.wordCount);
        setCharacterCount(result.draft.characterCount);
        setLastSavedAt(new Date(result.draft.lastSavedAt));

        if (contentRef.current === result.draft.content) {
          setStatus("saved");
          return true;
        }

        setStatus("unsaved");
        return false;
      } catch {
        if (requestId !== saveRequestIdRef.current) {
          return false;
        }

        setStatus("error");
        setError("Your latest changes could not be saved.");
        return false;
      }
    },
    [sessionId, sessionStatus, userId],
  );

  const setContent = useCallback((nextContent: string) => {
    contentRef.current = nextContent;
    setContentState(nextContent);

    if (!loadedRef.current) {
      return;
    }

    if (nextContent === lastPersistedContentRef.current) {
      setStatus("saved");
      return;
    }

    setStatus("unsaved");
    setError(null);
  }, []);

  const saveNow = useCallback(async () => {
    return await persistContent(contentRef.current);
  }, [persistContent]);

  useEffect(() => {
    if (!loadedRef.current || sessionStatus !== "active" || status !== "unsaved") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void persistContent(contentRef.current);
    }, autosaveDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [autosaveDelayMs, content, persistContent, sessionStatus, status]);

  return {
    content,
    setContent,
    status,
    isLoading,
    error,
    lastSavedAt,
    wordCount,
    characterCount,
    saveNow,
  };
}
