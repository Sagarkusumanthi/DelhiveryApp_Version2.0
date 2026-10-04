import { STORE_NEXT } from "@/lib/constants";

export function getValidStoreTransitions(status: string): string[] {
  return STORE_NEXT[status] ?? [];
}

export function isValidStoreTransition(from: string, to: string): boolean {
  return getValidStoreTransitions(from).includes(to);
}

// An admin can override to any status except the one it's already at —
// including "correcting" a terminal status like DELIVERED or REJECTED,
// which a normal store transition could never do.
export function isValidAdminOverride(from: string, to: string): boolean {
  return from !== to;
}
