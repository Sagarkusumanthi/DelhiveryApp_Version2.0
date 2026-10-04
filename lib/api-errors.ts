import { NextResponse } from "next/server";
import { SetupRequiredError } from "./db";
import { UnauthorizedError, ForbiddenError } from "./session";

export class NotFoundError extends Error {}
export class ValidationError extends Error {
  details?: Record<string, string[]>;
  constructor(message: string, details?: Record<string, string[]>) {
    super(message);
    this.details = details;
  }
}
export class ConflictError extends Error {}

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof SetupRequiredError) {
    return NextResponse.json(
      { error: "setup_required", message: err.message },
      { status: 503 }
    );
  }
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: "unauthorized", message: err.message }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    return NextResponse.json({ error: "forbidden", message: err.message }, { status: 403 });
  }
  if (err instanceof NotFoundError) {
    return NextResponse.json({ error: "not_found", message: err.message }, { status: 404 });
  }
  if (err instanceof ValidationError) {
    return NextResponse.json(
      { error: "validation_error", message: err.message, details: err.details },
      { status: 422 }
    );
  }
  if (err instanceof ConflictError) {
    return NextResponse.json({ error: "conflict", message: err.message }, { status: 409 });
  }
  console.error("Unhandled API error:", err);
  return NextResponse.json(
    { error: "server_error", message: "Something went wrong. Please try again." },
    { status: 500 }
  );
}
