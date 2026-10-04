import "server-only";
import { cookies } from "next/headers";
import { signSession, verifySession, SESSION_COOKIE_NAME, SESSION_MAX_AGE, type SessionPayload } from "./jwt";

export type { SessionPayload };
export type SessionRole = SessionPayload["role"];

export async function setSessionCookie(payload: SessionPayload) {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

/**
 * Verifies and returns the current session, or null if absent/invalid/expired.
 * This is the ONLY trusted source of identity/role - never trust client-supplied
 * role selectors or headers.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new UnauthorizedError("Not signed in.");
  }
  return session;
}

export async function requireRole(role: SessionRole): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== role) {
    throw new ForbiddenError(`This action requires the ${role} role.`);
  }
  return session;
}

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}
