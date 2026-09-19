/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/lib/auth/context";
import {
  activateDevelopmentModuleServerFn,
  cancelDevelopmentModuleServerFn,
  getUserModulesServerFn,
  markDevelopmentModuleOpenedServerFn,
} from "@/lib/modules/functions";

type ModuleId =
  | "speaking"
  | "writing"
  | "vocabulary"
  | "listening"
  | "reading"
  | "grammar"
  | "stories"
  | "ielts"
  | "interview"
  | "business";

export interface ServerUserModule {
  userId: string;
  moduleId: string;
  accessStatus: string;
  accessSource: string;
  activatedAt: Date | string | null;
  expiresAt: Date | string | null;
  lastAccessedAt: Date | string | null;
  progressPercentage: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface ModuleContextValue {
  modules: ServerUserModule[];
  isLoading: boolean;
  error: string | null;
  refreshModules: () => Promise<void>;
  subscribeModule: (moduleId: ModuleId) => Promise<void>;
  renewModule: (moduleId: ModuleId) => Promise<void>;
  cancelModule: (moduleId: ModuleId) => Promise<void>;
  markModuleOpened: (moduleId: ModuleId) => Promise<void>;
  findModule: (moduleId: ModuleId) => ServerUserModule | undefined;
  isSubscribed: (moduleId: ModuleId) => boolean;
}

const ModuleContext = createContext<ModuleContextValue | null>(null);

export function ModuleProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();

  const [modules, setModules] = useState<ServerUserModule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = Boolean(session?.user);

  const refreshModules = useCallback(async () => {
    if (!isAuthenticated) {
      setModules([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getUserModulesServerFn();

      setModules(result as ServerUserModule[]);
    } catch {
      setModules([]);
      setError("Your module subscriptions could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refreshModules();
  }, [refreshModules]);

  const subscribeModule = useCallback(
    async (moduleId: ModuleId) => {
      if (!isAuthenticated) {
        throw new Error("Authentication is required.");
      }

      await activateDevelopmentModuleServerFn({
        data: {
          moduleId,
        },
      });

      await refreshModules();
    },
    [isAuthenticated, refreshModules],
  );

  const renewModule = useCallback(
    async (moduleId: ModuleId) => {
      await subscribeModule(moduleId);
    },
    [subscribeModule],
  );

  const cancelModule = useCallback(
    async (moduleId: ModuleId) => {
      if (!isAuthenticated) {
        throw new Error("Authentication is required.");
      }

      await cancelDevelopmentModuleServerFn({
        data: {
          moduleId,
        },
      });

      await refreshModules();
    },
    [isAuthenticated, refreshModules],
  );

  const markModuleOpened = useCallback(
    async (moduleId: ModuleId) => {
      if (!isAuthenticated) {
        return;
      }

      await markDevelopmentModuleOpenedServerFn({
        data: {
          moduleId,
        },
      });

      setModules((current) =>
        current.map((module) =>
          module.moduleId === moduleId
            ? {
                ...module,
                lastAccessedAt: new Date(),
              }
            : module,
        ),
      );
    },
    [isAuthenticated],
  );

  const findModule = useCallback(
    (moduleId: ModuleId) => modules.find((module) => module.moduleId === moduleId),
    [modules],
  );

  const isSubscribed = useCallback(
    (moduleId: ModuleId) => {
      const module = findModule(moduleId);

      if (!module) {
        return false;
      }

      if (module.accessStatus !== "active" && module.accessStatus !== "trialing") {
        return false;
      }

      if (module.expiresAt && new Date(module.expiresAt).getTime() <= Date.now()) {
        return false;
      }

      return true;
    },
    [findModule],
  );

  const value = useMemo<ModuleContextValue>(
    () => ({
      modules,
      isLoading,
      error,
      refreshModules,
      subscribeModule,
      renewModule,
      cancelModule,
      markModuleOpened,
      findModule,
      isSubscribed,
    }),
    [
      modules,
      isLoading,
      error,
      refreshModules,
      subscribeModule,
      renewModule,
      cancelModule,
      markModuleOpened,
      findModule,
      isSubscribed,
    ],
  );

  return <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>;
}

export function useModules(): ModuleContextValue {
  const context = useContext(ModuleContext);

  if (!context) {
    throw new Error("useModules must be used inside ModuleProvider.");
  }

  return context;
}
