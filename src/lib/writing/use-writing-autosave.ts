import { useCallback, useEffect, useRef, useState } from "react";

import { getWritingDraftServerFn, saveWritingDraftServerFn } from "@/lib/writing/draft-functions";

export type WritingAutosaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

interface UseWritingAutosaveOptions {
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

  const savePromiseRef = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadedRef.current = false;
    contentRef.current = "";
    lastPersistedContentRef.current = "";
    savePromiseRef.current = null;

    setIsLoading(true);
    setError(null);
    setStatus("idle");

    void getWritingDraftServerFn({
      data: {
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
  }, [sessionId]);

  const persistContent = useCallback(async (): Promise<boolean> => {
    if (!loadedRef.current || sessionStatus !== "active") {
      return false;
    }

    if (savePromiseRef.current) {
      await savePromiseRef.current;

      if (contentRef.current === lastPersistedContentRef.current) {
        return true;
      }
    }

    if (contentRef.current === lastPersistedContentRef.current) {
      setStatus("saved");
      return true;
    }

    const contentToSave = contentRef.current;

    const savePromise = (async (): Promise<boolean> => {
      setStatus("saving");
      setError(null);

      try {
        const result = await saveWritingDraftServerFn({
          data: {
            sessionId,
            content: contentToSave,
          },
        });

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
        setStatus("error");
        setError("Your latest changes could not be saved.");

        return false;
      }
    })();

    savePromiseRef.current = savePromise;

    try {
      return await savePromise;
    } finally {
      if (savePromiseRef.current === savePromise) {
        savePromiseRef.current = null;
      }
    }
  }, [sessionId, sessionStatus]);

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
    const firstSaveSucceeded = await persistContent();

    if (!firstSaveSucceeded && contentRef.current !== lastPersistedContentRef.current) {
      return persistContent();
    }

    return firstSaveSucceeded;
  }, [persistContent]);

  useEffect(() => {
    if (!loadedRef.current || sessionStatus !== "active" || status !== "unsaved") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void persistContent();
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
