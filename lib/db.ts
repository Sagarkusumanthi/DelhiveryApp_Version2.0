import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function buildClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Caller (route handlers) should catch and surface a setup-required state.
    throw new SetupRequiredError(
      "DATABASE_URL is not set. Configure your Neon/Postgres connection string in .env (see .env.example)."
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export class SetupRequiredError extends Error {}

export function getDb(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new SetupRequiredError(
      "DATABASE_URL is not set. Configure your Neon/Postgres connection string in .env (see .env.example)."
    );
  }
  if (!global.__prisma) {
    global.__prisma = buildClient();
  }
  return global.__prisma;
}
