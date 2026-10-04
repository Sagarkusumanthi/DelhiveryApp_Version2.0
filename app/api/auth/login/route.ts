import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/services/auth";
import { setSessionCookie } from "@/lib/session";
import { loginSchema } from "@/lib/validation";
import { handleApiError, ValidationError } from "@/lib/api-errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Enter your email/phone and password.", parsed.error.flatten().fieldErrors as any);
    }
    const user = await login(parsed.data.identifier, parsed.data.password);
    await setSessionCookie({ userId: user.id, role: user.role, name: user.name, email: user.email });
    return NextResponse.json({ user });
  } catch (err) {
    return handleApiError(err);
  }
}
