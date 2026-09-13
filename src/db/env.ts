function requireServerEnvironmentVariable(name: "DATABASE_URL"): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required server environment variable: ${name}`);
  }

  return value;
}

export function getDatabaseUrl(): string {
  return requireServerEnvironmentVariable("DATABASE_URL");
}
