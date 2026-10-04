import { SignJWT, jwtVerify } from "jose";

export interface SessionPayload {
  userId: string;
  role: "CUSTOMER" | "STORE_OWNER" | "ADMIN";
  name: string;
  email: string;
}

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET is not set (or too short).");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const key = getSecretKey();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const key = getSecretKey();
    const { payload } = await jwtVerify(token, key);
    const { userId, role, name, email } = payload as unknown as SessionPayload;
    if (!userId || !role || !email) return null;
    return { userId, role, name: name ?? "", email };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = "giftly_session";
export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
