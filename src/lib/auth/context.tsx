import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  User,
  UserProfile,
  UserLanguageSettings,
  UserModule,
  Subscription,
} from "@/lib/types";

interface Session {
  user: User;
  profile: UserProfile | null;
  language: UserLanguageSettings | null;
  modules: UserModule[];
  subscription: Subscription | null;
  onboarded: boolean;
}

interface AuthContextValue {
  session: Session | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  signUp: (input: { name: string; email: string; password: string }) => Promise<void>;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signOut: () => void;
  updateUser: (patch: Partial<Pick<User, "name" | "avatar">>) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  updateLanguage: (patch: Partial<UserLanguageSettings>) => void;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "ael.session.v1";

function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function persist(session: Session | null) {
  if (typeof window === "undefined") return;
  if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSession(loadSession());
    setHydrated(true);
  }, []);

  const update = useCallback((next: Session | null) => {
    setSession(next);
    persist(next);
  }, []);

  const signUp = useCallback<AuthContextValue["signUp"]>(async ({ name, email }) => {
    const now = new Date().toISOString();
    const user: User = { id: crypto.randomUUID(), name, email, created_at: now };
    update({
      user,
      profile: {
        user_id: user.id,
        english_level: null,
        learning_goals: [],
        daily_learning_time: 15,
        learning_preferences: [],
        onboarding_completed: false,
        created_at: now,
        updated_at: now,
      },
      language: null,
      modules: [],
      subscription: null,
      onboarded: false,
    });
  }, [update]);

  const signIn = useCallback<AuthContextValue["signIn"]>(async ({ email }) => {
    const existing = loadSession();
    if (existing && existing.user.email === email) {
      update(existing);
      return;
    }
    const now = new Date().toISOString();
    const user: User = {
      id: crypto.randomUUID(),
      name: email.split("@")[0],
      email,
      created_at: now,
    };
    update({
      user,
      profile: {
        user_id: user.id,
        english_level: null,
        learning_goals: [],
        daily_learning_time: 15,
        learning_preferences: [],
        onboarding_completed: false,
        created_at: now,
        updated_at: now,
      },
      language: null,
      modules: [],
      subscription: null,
      onboarded: false,
    });
  }, [update]);

  const signOut = useCallback(() => update(null), [update]);

  const updateUser = useCallback<AuthContextValue["updateUser"]>((patch) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, user: { ...prev.user, ...patch } };
      persist(next);
      return next;
    });
  }, []);

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>((patch) => {
    setSession((prev) => {
      if (!prev || !prev.profile) return prev;
      const next = {
        ...prev,
        profile: { ...prev.profile, ...patch, updated_at: new Date().toISOString() },
      };
      persist(next);
      return next;
    });
  }, []);

  const updateLanguage = useCallback<AuthContextValue["updateLanguage"]>((patch) => {
    setSession((prev) => {
      if (!prev) return prev;
      const base: UserLanguageSettings = prev.language ?? {
        user_id: prev.user.id,
        native_language: "English",
        native_language_code: "en",
        translation_enabled: false,
        preferred_translation_mode: "on_tap",
      };
      const next = { ...prev, language: { ...base, ...patch } };
      persist(next);
      return next;
    });
  }, []);

  const completeOnboarding = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      const now = new Date().toISOString();
      const profile = prev.profile
        ? { ...prev.profile, onboarding_completed: true, updated_at: now }
        : prev.profile;
      const next = { ...prev, profile, onboarded: true };
      persist(next);
      return next;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: !!session,
      hydrated,
      signUp,
      signIn,
      signOut,
      updateUser,
      updateProfile,
      updateLanguage,
      completeOnboarding,
    }),
    [session, hydrated, signUp, signIn, signOut, updateUser, updateProfile, updateLanguage, completeOnboarding],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}