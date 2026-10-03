/**
 * Development-only reset script. Truncates all application tables.
 * NEVER expose this as an HTTP endpoint. Run explicitly via `npm run db:reset:dev`.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { existsSync } from "fs";

// Load .env for local CLI runs (Next.js does this for the app, but tsx does not).
if (!process.env.DATABASE_URL && existsSync(".env") && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(".env");
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to run the dev reset script with NODE_ENV=production.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("Resetting Giftly database (dev only)...");
  await db.$executeRawUnsafe(`
    TRUNCATE TABLE
      "OrderStatusHistory",
      "OrderItem",
      "Order",
      "Product",
      "Store",
      "Category",
      "City",
      "User"
    RESTART IDENTITY CASCADE;
  `);
  console.log("Done. Run `npm run db:seed` to repopulate demo data.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
