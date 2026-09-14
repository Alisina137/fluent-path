import type { ServerModuleAccessResult } from "./access";
import { getServerModuleAccess } from "./access";

export class ModuleAccessError extends Error {
  readonly state: ServerModuleAccessResult["state"];

  constructor(state: ServerModuleAccessResult["state"]) {
    super(`Module access denied: ${state}`);
    this.name = "ModuleAccessError";
    this.state = state;
  }
}

export async function requireServerModuleAccess(
  userId: string,
  moduleId: string,
): Promise<ServerModuleAccessResult> {
  const result = await getServerModuleAccess(userId, moduleId);

  if (!result.allowed) {
    throw new ModuleAccessError(result.state);
  }

  return result;
}
