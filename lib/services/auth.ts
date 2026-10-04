import "server-only";
import { getDb } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { UnauthorizedError } from "@/lib/session";

export async function login(identifier: string, password: string) {
  const user = await getDb().user.findFirst({
    where: { OR: [{ email: { equals: identifier, mode: "insensitive" } }, { phone: identifier }] },
  });
  if (!user) throw new UnauthorizedError("Incorrect email/phone or password.");
  const valid = await verifyPassword(password, user.password);
  if (!valid) throw new UnauthorizedError("Incorrect email/phone or password.");
  const { password: _pw, ...safeUser } = user;
  return safeUser;
}
