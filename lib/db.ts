import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export class SetupRequiredError extends Error {}

function buildClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new SetupRequiredError(
      "DATABASE_URL is not set. Configure your Neon/Postgres connection string."
    );
  }

  return new PrismaClient();
}

export function getDb(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new SetupRequiredError(
      "DATABASE_URL is not set. Configure your Neon/Postgres connection string."
    );
  }

  if (!global.__prisma) {
    global.__prisma = buildClient();
  }

  return global.__prisma;
}
